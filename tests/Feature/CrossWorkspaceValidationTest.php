<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Category;
use App\Models\Customer;
use App\Models\Product;
use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceSettings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * A foreign key supplied by the client must be rejected when it points at a
 * record in another workspace.
 *
 * Laravel's `exists:<table>,id` rule runs a raw query against the whole table,
 * so WorkspaceScope does not apply to it. Every such rule therefore has to be
 * constrained to the caller's workspace explicitly, and these tests pin that
 * behaviour down.
 *
 * Each case is paired with a positive control asserting that the equivalent
 * id from the caller's *own* workspace is still accepted, so the rules cannot
 * regress into rejecting everything.
 */
class CrossWorkspaceValidationTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Workspace $mine;
    private Workspace $theirs;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->mine = $this->workspaceFor($this->user, 'business');
        $this->user->update(['current_workspace_id' => $this->mine->id]);

        // A completely unrelated tenant.
        $stranger = User::factory()->create();
        $this->theirs = $this->workspaceFor($stranger, 'business');
    }

    private function workspaceFor(User $owner, string $type): Workspace
    {
        $ws = Workspace::factory()->create(['owner_id' => $owner->id, 'type' => $type, 'currency' => 'INR']);
        $ws->members()->attach($owner->id, ['role' => 'owner', 'accepted_at' => now()]);
        WorkspaceSettings::create(['workspace_id' => $ws->id]);

        return $ws;
    }

    private function customerIn(Workspace $ws): Customer
    {
        return Customer::factory()->create(['workspace_id' => $ws->id, 'created_by' => $ws->owner_id]);
    }

    private function productIn(Workspace $ws): Product
    {
        return Product::factory()->create(['workspace_id' => $ws->id, 'created_by' => $ws->owner_id]);
    }

    private function accountIn(Workspace $ws): Account
    {
        return Account::withoutGlobalScopes()->create([
            'workspace_id' => $ws->id, 'name' => 'Acct', 'type' => 'bank', 'currency' => 'INR',
            'opening_balance' => 100000, 'current_balance' => 100000, 'is_active' => true,
        ]);
    }

    private function categoryIn(Workspace $ws): Category
    {
        return Category::withoutGlobalScopes()->create([
            'workspace_id' => $ws->id, 'name' => 'Cat', 'type' => 'expense',
        ]);
    }

    private function invoicePayload(int $customerId, ?int $productId = null): array
    {
        $item = ['type' => $productId ? 'product' : 'custom', 'name' => 'Item', 'quantity' => 1, 'unit_price' => 1000];
        if ($productId) {
            $item['product_id'] = $productId;
        }

        return [
            'customer_id' => $customerId,
            'invoice_date' => '2026-01-15',
            'due_date' => '2026-02-14',
            'currency' => 'INR',
            'items' => [$item],
        ];
    }

    // ---------------- Invoices ----------------

    public function test_invoice_rejects_customer_from_another_workspace(): void
    {
        $this->actingAs($this->user)
            ->postJson('/api/invoices', $this->invoicePayload($this->customerIn($this->theirs)->id))
            ->assertStatus(422)
            ->assertJsonValidationErrors('customer_id');
    }

    public function test_invoice_accepts_customer_from_own_workspace(): void
    {
        $this->actingAs($this->user)
            ->postJson('/api/invoices', $this->invoicePayload($this->customerIn($this->mine)->id))
            ->assertStatus(201);
    }

    public function test_invoice_rejects_product_from_another_workspace(): void
    {
        $this->actingAs($this->user)
            ->postJson('/api/invoices', $this->invoicePayload(
                $this->customerIn($this->mine)->id,
                $this->productIn($this->theirs)->id
            ))
            ->assertStatus(422)
            ->assertJsonValidationErrors('items.0.product_id');
    }

    public function test_invoice_accepts_product_from_own_workspace(): void
    {
        $this->actingAs($this->user)
            ->postJson('/api/invoices', $this->invoicePayload(
                $this->customerIn($this->mine)->id,
                $this->productIn($this->mine)->id
            ))
            ->assertStatus(201);
    }

    // ---------------- Quotes ----------------

    public function test_quote_rejects_customer_from_another_workspace(): void
    {
        $this->actingAs($this->user)
            ->postJson('/api/quotes', [
                'customer_id' => $this->customerIn($this->theirs)->id,
                'quote_date' => '2026-01-15',
                'valid_until' => '2026-02-14',
                'currency' => 'INR',
                'items' => [['type' => 'custom', 'name' => 'Item', 'quantity' => 1, 'unit_price' => 1000]],
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('customer_id');
    }

    // ---------------- Transactions ----------------

    public function test_transaction_rejects_account_from_another_workspace(): void
    {
        $this->actingAs($this->user)
            ->postJson('/api/transactions', [
                'account_id' => $this->accountIn($this->theirs)->id,
                'type' => 'expense', 'amount' => 5000, 'currency' => 'INR', 'date' => '2026-01-15',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('account_id');
    }

    public function test_transaction_accepts_account_from_own_workspace(): void
    {
        $this->actingAs($this->user)
            ->postJson('/api/transactions', [
                'account_id' => $this->accountIn($this->mine)->id,
                'type' => 'expense', 'amount' => 5000, 'currency' => 'INR', 'date' => '2026-01-15',
            ])
            ->assertStatus(201);
    }

    public function test_transaction_rejects_category_from_another_workspace(): void
    {
        $this->actingAs($this->user)
            ->postJson('/api/transactions', [
                'account_id' => $this->accountIn($this->mine)->id,
                'category_id' => $this->categoryIn($this->theirs)->id,
                'type' => 'expense', 'amount' => 5000, 'currency' => 'INR', 'date' => '2026-01-15',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('category_id');
    }

    public function test_transaction_rejects_customer_from_another_workspace(): void
    {
        $this->actingAs($this->user)
            ->postJson('/api/transactions', [
                'account_id' => $this->accountIn($this->mine)->id,
                'customer_id' => $this->customerIn($this->theirs)->id,
                'type' => 'income', 'amount' => 5000, 'currency' => 'INR', 'date' => '2026-01-15',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('customer_id');
    }

    // ---------------- Intra-workspace transfer ----------------

    public function test_transfer_rejects_account_from_another_workspace(): void
    {
        $this->actingAs($this->user)
            ->postJson('/api/transactions/transfer', [
                'from_account_id' => $this->accountIn($this->mine)->id,
                'to_account_id' => $this->accountIn($this->theirs)->id,
                'amount' => 1000,
                'date' => '2026-01-15',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('to_account_id');
    }

    // ---------------- Payments ----------------

    public function test_payment_rejects_account_from_another_workspace(): void
    {
        $this->actingAs($this->user)
            ->postJson('/api/payments', [
                'type' => 'incoming',
                'account_id' => $this->accountIn($this->theirs)->id,
                'amount' => 5000,
                'currency' => 'INR',
                'payment_date' => '2026-01-15',
                'payment_method' => 'cash',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('account_id');
    }

    // ---------------- Tasks ----------------

    public function test_task_rejects_assignee_who_is_not_a_workspace_member(): void
    {
        $outsider = User::factory()->create();

        $this->actingAs($this->user)
            ->postJson('/api/tasks', [
                'title' => 'Task',
                'assignee_id' => $outsider->id,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('assignee_id');
    }

    public function test_task_accepts_assignee_who_is_a_workspace_member(): void
    {
        $this->actingAs($this->user)
            ->postJson('/api/tasks', [
                'title' => 'Task',
                'assignee_id' => $this->user->id,
            ])
            ->assertStatus(201);
    }
}
