# WhatsApp AI Assistant — Design

A per-customer AI assistant reachable from the customer's own WhatsApp. The
customer links their personal number by scanning a QR code, then manages their
workspace by chatting or sending Malayalam voice notes.

**Target:** 500 linked customers within 12 months. Read *and* write from launch.

---

## 1. Three things to settle before any code

### 1.1 500 sessions is not one small VPS

Each linked customer holds an open WhatsApp Web session. With Baileys (socket
based, no browser) a trimmed session costs roughly **40–120MB** of RAM
depending on how much history syncing is enabled.

| Linked customers | Realistic RAM for sessions alone |
|---|---|
| 25 | 2–4 GB |
| 100 | 6–14 GB |
| 500 | **25–60 GB** |

So 500 sessions means either one large machine or, better, **sharding across
several gateway nodes from the start** — retrofitting sharding later means
re-linking every customer, which means asking 500 people to rescan a QR.

Mitigations that materially reduce per-session cost:

- disable full history sync on link (we only care about messages from now on)
- no in-memory message store; persist what we need to MySQL
- evict idle sessions and reconnect lazily on the next inbound message

**Decision needed:** budget for sharded gateway nodes, and treat
`gateway_node` as a column on the connection record from day one.

### 1.2 The workspace scope does not protect background jobs

This is the most dangerous detail in the whole design.

`app/Scopes/WorkspaceScope.php` filters by workspace **only when a user is
authenticated**:

```php
if (auth()->check() && auth()->user()->current_workspace_id) {
    $builder->where($model->getTable() . '.workspace_id', ...);
}
```

A queue worker has no authenticated user. So inside a job, `Invoice::all()`
returns **every invoice belonging to every customer on the platform**. An AI
tool that innocently calls `Invoice::where('status','overdue')->get()` would
hand one customer another customer's invoices.

**Every tool call must therefore run inside an explicit workspace context.**
The agent runner binds the workspace owner as the acting user before dispatching
any tool, and tools additionally constrain by `workspace_id` rather than relying
on the global scope:

```php
// AgentRunner: establish context, then never trust ambient state again.
Auth::setUser($connection->workspace->owner);   // makes WorkspaceScope active
app()->instance('ai.workspace_id', $connection->workspace_id);
```

Tools are also given a hard guard: every model touched must belong to
`ai.workspace_id`, asserted before returning data. Tests must cover
"customer A's agent cannot see customer B's invoice" the same way
`CrossWorkspaceValidationTest` does for HTTP.

### 1.3 Malayalam speech plus money needs confirmation

Malayalam ASR is materially less accurate than English, and the words most
likely to be mistranscribed are exactly the ones that matter: amounts,
quantities and customer names. Kerala speech also code-switches heavily
("അഞ്ചു ക്യാമറ five thousand rupees"), which helps for digits but confuses
naive number parsing.

Consequence: **no write is ever executed directly from a voice note.** Every
write is proposed, echoed back in full, and executed only on explicit
confirmation. See §5.

---

## 2. Stack

| Layer | Choice | Why |
|---|---|---|
| WhatsApp gateway | **Evolution API** (Docker, Baileys based) | Multi-instance REST + webhooks, which maps directly onto one instance per customer |
| Session store | Postgres + Redis (bundled with Evolution) | Survives gateway restarts without re-scanning QR |
| Malayalam ASR | **Sarvam AI** primary, Google STT (`ml-IN`) fallback | Indic-specialised models beat general Whisper on Malayalam; self-hosted IndicWhisper is the zero-marginal-cost option if volume justifies a GPU |
| LLM | **DeepSeek** by default, customer key optional | Cheap enough to absorb on paid plans; BYOK removes the cost entirely for heavy users |

Explicitly **not** `whatsapp-web.js`, WPPConnect or Venom: each drives a headless
Chromium, roughly 300–500MB per session. At 500 customers that is the difference
between a large VPS and a rack.

### Why not the official Cloud API

For a *personal assistant on the customer's own number*, the official API does
not fit: it requires the number be registered to a Meta Business account and
removes it from the normal WhatsApp app. Customers want their existing personal
WhatsApp, which only the QR route provides.

The trade-off is real and must be stated in the product terms: the QR protocol
is unofficial and **against WhatsApp's Terms of Service**, and a linked number
can be banned. Recommended posture:

- present linking as opt-in with a plain-language warning
- never make the assistant the only route to a feature
- keep the gateway abstracted behind an interface so the official API can be
  swapped in per customer later

---

## 3. Topology

```
Customer WhatsApp ──QR──► Evolution API (VPS, Docker, sharded)
                               │ webhook: message.upsert
                               ▼
                    Agent worker  (VPS, Laravel queue)
                               │
                    ┌──────────┴──────────┐
                    ▼                     ▼
              MySQL (same DB)        ASR + LLM APIs
                    ▲
                    │
            Laravel web app (cPanel) — UI, linking, settings
```

**The agent worker cannot live on cPanel.** It needs a persistent queue worker;
shared hosting offers a one-minute cron and hard request timeouts. Two options:

1. **Split** — web UI stays on cPanel, worker runs on the VPS against the same
   MySQL over a whitelisted remote connection. Cheapest, but adds DB latency and
   widens the database's exposure.
2. **Consolidate** — move the whole Laravel app to the VPS. More work up front,
   but 500 customers will outgrow shared hosting regardless, and it removes the
   remote-MySQL exposure entirely.

**Recommendation: (2)**, as a prerequisite rather than a follow-up.

---

## 4. Schema

```
whatsapp_connections
  workspace_id        FK, unique      one linked number per workspace
  instance_name       string, unique  Evolution instance id
  gateway_node        string          which shard holds the session
  phone_number        string, null    populated once linked
  status              enum            pending|linked|disconnected|banned
  last_seen_at        timestamp
  linked_at           timestamp, null

whatsapp_messages                     audit trail and debugging
  workspace_id        FK
  direction           enum            inbound|outbound
  wa_message_id       string, unique   idempotency for webhook retries
  type                enum            text|audio|image
  body               text, null
  transcript         text, null       ASR output for voice notes
  created_at

agent_conversations                   rolling context per workspace
  workspace_id        FK
  summary            text             compacted older turns
  updated_at

agent_messages
  conversation_id     FK
  role                enum            user|assistant|tool
  content            text
  tokens_in/out       int              cost attribution

agent_pending_actions                 the confirmation gate
  workspace_id        FK
  tool                string
  arguments          json
  preview            text             exactly what the user was shown
  token              string, unique    short code the user replies with
  expires_at         timestamp
  confirmed_at        timestamp, null
  executed_at         timestamp, null

workspace_ai_settings
  workspace_id        FK, unique
  provider            enum            platform|deepseek|openai|anthropic
  api_key            text, encrypted  Laravel encrypted cast, never returned
  model               string, null
  monthly_token_cap   int, null       guards a runaway loop
```

`api_key` uses an `encrypted` cast so keys are never at rest in plaintext, and
the settings endpoint returns only a boolean `has_key` — never the value.

---

## 5. Write flow

Reads answer immediately. Writes always take two turns.

```
User:  "Halavision-ന് 5 dome camera invoice ഇടൂ"

Agent: Invoice for Halavision
       5 × 5MP Ultra Premium IP camera 2.8mm Dome @ ₹1,970
       Subtotal ₹9,850 · GST 18% ₹1,773 · Total ₹11,623

       Reply  YES 7K2M  to create it, or NO to cancel.

User:  YES 7K2M

Agent: Created INC-2026-00014 · ₹11,623 · due 17 Oct
       https://finance.nokkoo.in/app/invoices/41
```

Rules:

- the preview is rendered from the **resolved** entities, not the raw text, so
  the user sees the actual customer and product the agent matched
- amounts are computed by the existing `InvoiceCalculationService`, never by
  the model — the LLM proposes arguments, the server owns the arithmetic
- a token expires in 10 minutes and is single-use, claimed with the same
  conditional-update pattern as activation codes
- ambiguous matches ("which Halavision?") ask rather than guess
- reads need no confirmation

### Tools

| Read | Write (confirmed) |
|---|---|
| `get_outstanding` | `create_invoice` |
| `find_customer` | `record_payment` |
| `list_invoices` | `log_expense` |
| `get_invoice` | `create_customer` |
| `expense_summary` | `mark_invoice_paid` |
| `cash_position` | |

Each tool is a thin wrapper over the services the HTTP controllers already use,
so the arithmetic, numbering and allocation rules cannot drift between the web
UI and the assistant.

---

## 6. Cost shape

Per active customer per month, assuming a few hundred interactions:

| Item | Order of magnitude |
|---|---|
| DeepSeek tokens | single-digit ₹ |
| Malayalam ASR | ₹10–40, dominated by voice-note minutes |
| Gateway compute | ₹20–60, i.e. VPS cost ÷ customers per node |

ASR is the real variable cost, not the LLM. Two levers: cap voice minutes per
plan, and let heavy users supply their own key (BYOK) to move LLM cost off the
platform entirely. Verify current provider pricing before committing — these
change often.

---

## 7. Build order

1. **Linking** — connection record, QR display in Settings, webhook receiver,
   status handling. Ends with: a customer can link and we log inbound messages.
2. **Read-only text agent** — agent runner with hard workspace binding, read
   tools, conversation memory. Ends with: "what's my outstanding?" answers
   correctly, and a cross-workspace leakage test passes.
3. **Malayalam voice** — ASR pipeline, transcript stored alongside the message.
   Still read-only, so a mistranscription is harmless while accuracy is measured.
4. **Writes** — pending-action gate, confirmation parsing, write tools.
5. **BYOK and caps** — AI settings UI, encrypted keys, token accounting.
6. **Sharding and ops** — multi-node gateway, session eviction, reconnect,
   ban detection and customer notification.

Stages 1–2 are independently useful and carry no risk of the agent damaging
financial data, which makes them the right place to learn how customers
actually phrase things before granting write access.

---

## 8. Open questions

- Who bears the cost of a banned number, and what does the product promise?
- Should the assistant be restricted to workspace owners, or available to any
  member once team invites exist?
- Voice-minute caps per plan, and what happens on exhaustion?
- Data retention for transcripts and message logs?
