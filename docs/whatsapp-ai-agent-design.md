# WhatsApp AI Assistant — Design

A per-customer AI assistant reachable over WhatsApp. Customers message **one
shared platform number**, link themselves with a one-time code, and then manage
their workspace by chatting or sending Malayalam voice notes.

**Target:** 500 linked customers. Read *and* write. Malayalam voice at launch.

---

## 1. Architecture: one shared number

A single WhatsApp number is linked to the platform by scanning a QR once.
Customers are identified by the number they message us *from*.

```
Tenant's WhatsApp ──message──► Platform number (one session)
                                      │
                               Evolution API (VPS, Docker)
                                      │ webhook: message.upsert
                                      ▼
                          Agent worker (Laravel queue)
                                      │
                       ┌──────────────┴──────────────┐
                       ▼                             ▼
                 MySQL (workspace data)        ASR + LLM
                       │
                       └── reply sent back out through the same number
```

### Why not one session per customer

500 live WhatsApp Web sessions costs roughly **25–60GB of RAM** and needs
sharding across nodes, per-customer session recovery, and a re-link path for
each. One session costs about **150MB**. The saving is roughly 95% of the
infrastructure and well over half the build.

The trade-off is blast radius: a ban now takes out every customer at once rather
than one. §7 covers how that is managed rather than pretended away.

The gateway sits behind a `WhatsAppGateway` interface so a high-value customer
can later be moved onto a dedicated session, or onto the official Cloud API,
without touching the agent.

---

## 2. Stack

| Layer | Choice | Why |
|---|---|---|
| Gateway | **Evolution API** (Docker, Baileys based) | REST + webhooks, and can host a dedicated instance later without a rewrite |
| Malayalam ASR | **Sarvam AI**, Google `ml-IN` fallback | Indic-specialised models clearly beat general Whisper on Malayalam |
| LLM | **DeepSeek** default, customer key optional | Cheap enough to absorb; BYOK moves cost off the platform for heavy users |

Explicitly **not** `whatsapp-web.js`, WPPConnect or Venom — each drives a
headless Chromium, ~300–500MB per session. Irrelevant at one session, but it
would foreclose the dedicated-session upgrade path.

### Cost

| Item | Monthly |
|---|---|
| VPS (2 vCPU / 4GB, gateway + worker) | ₹450–1,000 |
| VPS (4 vCPU / 8GB, everything incl. app + MySQL) | ₹900–1,800 |
| Malayalam ASR | ~₹10–40 per *active* customer |
| DeepSeek tokens | single-digit ₹ per customer |
| WhatsApp message fees | **none** — this is the advantage over the Cloud API |

**ASR dominates the variable cost, not the LLM.** Two levers: cap voice minutes
per plan, and let heavy users supply their own LLM key. Verify provider pricing
before committing; it changes often.

---

## 3. Linking: one-time code, no QR for tenants

The tenant never scans anything. Settings shows an instruction:

```
Send this message to +91 XXXXX XXXXX from your WhatsApp:

        LINK 7K2M

Code expires in 15 minutes.
```

When the message arrives, the webhook's **sender number is authoritative** — the
tenant is never asked to type their own number, which removes any mismatch or
spoofing question. We look up the pending code, then record whatever number it
actually arrived from.

The code is claimed with the same conditional-update pattern as activation
codes, so a code cannot be redeemed twice even if two messages race.

### Linked to the user, not the workspace

A tenant may own both a Business and a Personal workspace. The link is therefore
attached to the **user**, and the agent acts on their `current_workspace_id`,
with an explicit in-chat switch:

```
You:   switch to personal
Agent: Now using Personal. Business is still there — say "switch to business".
```

This mirrors the sidebar switcher rather than inventing a second mental model.

---

## 4. The hard boundaries

These three rules are what keep the feature safe. They are not optional.

### 4.1 Reply only. Never initiate.

The assistant responds to inbound messages and nothing else. No broadcasts, no
reminders, no "your invoice is overdue" nudges. Reactive traffic resembles normal
conversation; outbound-initiated traffic is what gets numbers flagged.

Overdue reminders stay on email, where they already work
(`SendInvoiceDueReminders`).

### 4.2 Never message the tenant's customers.

"Send this invoice to Halavision" must be **refused**, with the PDF or link
returned to the tenant to forward themselves.

This is the obvious next feature request and it is the fastest route to a ban:
messaging strangers who never contacted us, from our number, with generated
commercial documents. It is also the difference between a convenience tool and
an unsolicited-messaging service.

### 4.3 A queue worker has no workspace scope.

The most dangerous detail in the whole design.
`app/Scopes/WorkspaceScope.php` filters **only when a user is authenticated**:

```php
if (auth()->check() && auth()->user()->current_workspace_id) {
    $builder->where($model->getTable() . '.workspace_id', ...);
}
```

A queue worker has no authenticated user, so inside a job `Invoice::all()`
returns **every invoice belonging to every customer on the platform**. An AI
tool doing an innocent `Invoice::where('status','overdue')->get()` would hand one
tenant another tenant's books.

The agent runner must therefore establish context explicitly before any tool
runs, and tools must constrain by `workspace_id` directly rather than trusting
ambient scope:

```php
Auth::setUser($link->user);                       // activates WorkspaceScope
app()->instance('ai.workspace_id', $workspaceId); // tools assert against this
```

Leakage tests mirror `CrossWorkspaceValidationTest`: tenant A's agent must not be
able to read or write tenant B's records, asserted per tool.

---

## 5. Writes: propose, then confirm

Reads answer immediately. Every write takes two turns.

```
You:   Halavision-ന് 5 dome camera invoice ഇടൂ

Agent: Invoice for Halavision
       5 × 5MP Ultra Premium IP camera 2.8mm Dome @ ₹1,970
       Subtotal ₹9,850 · GST 18% ₹1,773 · Total ₹11,623

       Reply  YES 7K2M  to create it, or NO to cancel.

You:   YES 7K2M

Agent: Created INC-2026-00014 · ₹11,623 · due 17 Oct
       https://finance.nokkoo.in/app/invoices/41
```

Why this is non-negotiable for Malayalam voice: ASR is weakest on exactly the
tokens that carry the money — amounts, quantities and names. Kerala speech also
code-switches heavily ("അഞ്ചു ക്യാമറ five thousand rupees"), which helps digits
but confuses naive parsing.

Rules:

- **The model proposes arguments; the server does the arithmetic.** Totals come
  from the existing `InvoiceCalculationService`, never from the LLM
- the preview shows **resolved** entities, so the tenant sees the actual customer
  and product that was matched, not their own words echoed back
- tokens are single-use and expire in 10 minutes
- ambiguity asks instead of guessing ("which Halavision?")
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
| `switch_workspace` | |

Each tool wraps the services the HTTP controllers already use, so numbering,
tax and allocation rules cannot drift between the web UI and the assistant.

---

## 6. Schema

```
whatsapp_links                        one phone <-> one user
  user_id             FK, unique
  phone_number        string, unique, null   authoritative sender, set on verify
  code                string, null           pending one-time link code
  code_expires_at     timestamp, null
  verified_at         timestamp, null
  status              enum   pending|linked|revoked
  last_message_at     timestamp, null

whatsapp_messages                     audit trail and debugging
  user_id             FK, null
  workspace_id        FK, null              resolved at handling time
  direction           enum   inbound|outbound
  wa_message_id       string, unique        idempotency for webhook retries
  type                enum   text|audio
  body                text, null
  transcript          text, null            ASR output
  created_at

agent_conversations                   rolling context per user
  user_id             FK
  summary             text                  compacted older turns
  updated_at

agent_messages
  conversation_id     FK
  role                enum   user|assistant|tool
  content             text
  tokens_in/out       int                   cost attribution

agent_pending_actions                 the confirmation gate
  user_id             FK
  workspace_id        FK                    captured at proposal time
  tool                string
  arguments           json
  preview             text                  exactly what was shown
  token               string, unique
  expires_at          timestamp
  executed_at         timestamp, null

workspace_ai_settings
  workspace_id        FK, unique
  provider            enum   platform|deepseek|openai|anthropic
  api_key             text, encrypted       Laravel encrypted cast
  model               string, null
  monthly_token_cap   int, null             guards a runaway loop
```

`api_key` uses an `encrypted` cast, and the settings endpoint returns only a
boolean `has_key` — never the value.

`agent_pending_actions.workspace_id` is captured when the action is *proposed*,
so a mid-conversation workspace switch cannot cause a confirmation to execute
against the wrong books.

---

## 7. Hosting and the ban plan

### The worker cannot run on cPanel

It needs a persistent queue worker; shared hosting gives a one-minute cron and
hard request timeouts. Either:

1. **Split** — UI on cPanel, worker on the VPS against MySQL over a whitelisted
   remote connection. Cheapest, but adds latency and exposes the database.
2. **Consolidate** — move the whole app to the VPS.

**Recommendation: (2).** 500 customers outgrows shared hosting regardless, and
it avoids opening MySQL to the internet.

### Treat a ban as *when*, not *if*

The QR protocol is unofficial and against WhatsApp's Terms of Service. One
number carrying 500 conversations is exactly the volume pattern that draws
attention. So:

- keep a **spare number provisioned and warm**, so recovery is hours not days
- store links by user, so re-linking after a number change is one broadcast
  email and a new code — not a rebuild
- **nothing in the product may be reachable only via WhatsApp**
- warm up gradually; do not go 0 → 500 linked users in a week
- pace outbound replies, no bursts
- present linking as opt-in with a plain-language warning, and do not promise
  uptime for it

---

## 8. Build order

1. **Linking** — `whatsapp_links`, code generation, Settings instructions,
   webhook receiver with idempotency, inbound logging. Ends with: a tenant can
   link and their messages are attributed to them.
2. **Read-only text agent** — agent runner with hard workspace binding, read
   tools, conversation memory, workspace switching. Ends with: "what's my
   outstanding?" answers correctly and a cross-tenant leakage test passes.
3. **Malayalam voice, still read-only** — ASR pipeline, transcript stored beside
   the message. Mistranscriptions are harmless here, which is the point: it lets
   accuracy be measured before it can cost anyone money.
4. **Writes** — pending-action gate, confirmation parsing, write tools.
5. **BYOK and caps** — AI settings UI, encrypted keys, token accounting, voice
   minute limits.
6. **Ops** — spare-number swap procedure, ban detection, reconnect handling.

Stages 1–3 are independently useful and cannot damage financial data. Shipping
them first is how we learn how tenants actually phrase things in Malayalam
before the agent is allowed to write.

---

## 9. Open questions

- Voice-minute cap per plan, and behaviour on exhaustion?
- Owners only, or any workspace member once team invites exist?
- Retention for transcripts and message logs?
- What does the product promise if the number is banned?
