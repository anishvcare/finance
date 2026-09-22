<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Transaction;
use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceSettings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WorkspaceTransferTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Workspace $business;
    private Workspace $personal;
    private Account $bizAccount;
    private Account $perAccount;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();

        $this->business = Workspace::factory()->create([
            'owner_id' => $this->user->id, 'type' => 'business', 'currency' => 'INR',
        ]);
        $this->business->members()->attach($this->user->id, ['role' => 'owner', 'accepted_at' => now()]);
        WorkspaceSettings::create(['workspace_id' => $this->business->id]);

        $this->personal = Workspace::factory()->create([
            'owner_id' => $this->user->id, 'type' => 'personal', 'currency' => 'INR',
        ]);
        $this->personal->members()->attach($this->user->id, ['role' => 'owner', 'accepted_at' => now()]);
        WorkspaceSettings::create(['workspace_id' => $this->personal->id]);

        $this->user->update(['current_workspace_id' => $this->business->id]);

        $this->bizAccount = $this->account($this->business->id, 'Business Bank', 1000000);
        $this->perAccount = $this->account($this->personal->id, 'Personal Wallet', 50000);
    }

    private function account(int $workspaceId, string $name, int $balance, string $currency = 'INR'): Account
    {
        return Account::withoutGlobalScopes()->create([
            'workspace_id' => $workspaceId,
            'name' => $name,
            'type' => 'bank',
            'currency' => $currency,
            'opening_balance' => $balance,
            'current_balance' => $balance,
            'is_active' => true,
        ]);
    }

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'from_workspace_id' => $this->business->id,
            'to_workspace_id' => $this->personal->id,
            'from_account_id' => $this->bizAccount->id,
            'to_account_id' => $this->perAccount->id,
            'amount' => 250000,
            'date' => now()->toDateString(),
            'description' => "Owner's draw",
        ], $overrides);
    }

    public function test_transfer_creates_linked_pair_in_both_workspaces(): void
    {
        $response = $this->actingAs($this->user)
            ->postJson('/api/workspace-transfers', $this->payload());

        $response->assertStatus(201);

        $out = Transaction::withoutGlobalScopes()->find($response->json('data.outgoing.id'));
        $in = Transaction::withoutGlobalScopes()->find($response->json('data.incoming.id'));

        // One leg in each workspace.
        $this->assertSame($this->business->id, $out->workspace_id);
        $this->assertSame($this->personal->id, $in->workspace_id);

        // Linked both ways.
        $this->assertSame($in->id, $out->transfer_pair_id);
        $this->assertSame($out->id, $in->transfer_pair_id);

        // Direction recorded.
        $this->assertSame('out', $out->direction_hint);
        $this->assertSame('in', $in->direction_hint);

        // Typed as transfer so it never counts as profit or spending.
        $this->assertSame('transfer', $out->type);
        $this->assertSame('transfer', $in->type);
    }

    public function test_transfer_moves_the_account_balances(): void
    {
        $this->actingAs($this->user)
            ->postJson('/api/workspace-transfers', $this->payload())
            ->assertStatus(201);

        $this->assertSame(1000000 - 250000, Account::withoutGlobalScopes()->find($this->bizAccount->id)->current_balance);
        $this->assertSame(50000 + 250000, Account::withoutGlobalScopes()->find($this->perAccount->id)->current_balance);
    }

    public function test_transfer_is_excluded_from_income_and_expense_totals(): void
    {
        $this->actingAs($this->user)
            ->postJson('/api/workspace-transfers', $this->payload())
            ->assertStatus(201);

        $overview = $this->actingAs($this->user)->getJson('/api/overview');

        $overview->assertStatus(200);
        // A transfer is an internal movement, not income or expense.
        $this->assertSame(0, $overview->json('combined.income'));
        $this->assertSame(0, $overview->json('combined.expense'));
        // Total cash across both workspaces is unchanged by a transfer.
        $this->assertSame(1050000, $overview->json('combined.cash_balance'));
    }

    public function test_cannot_transfer_into_a_workspace_the_user_does_not_belong_to(): void
    {
        $stranger = User::factory()->create();
        $strangerWs = Workspace::factory()->create(['owner_id' => $stranger->id, 'type' => 'personal']);
        $strangerWs->members()->attach($stranger->id, ['role' => 'owner', 'accepted_at' => now()]);
        $strangerAccount = $this->account($strangerWs->id, 'Stranger Account', 0);

        $this->actingAs($this->user)
            ->postJson('/api/workspace-transfers', $this->payload([
                'to_workspace_id' => $strangerWs->id,
                'to_account_id' => $strangerAccount->id,
            ]))
            ->assertStatus(422)
            ->assertJsonValidationErrors('to_workspace_id');

        // Nothing moved.
        $this->assertSame(1000000, Account::withoutGlobalScopes()->find($this->bizAccount->id)->current_balance);
        $this->assertSame(0, Account::withoutGlobalScopes()->find($strangerAccount->id)->current_balance);
    }

    public function test_cannot_use_an_account_from_a_different_workspace(): void
    {
        // Personal account passed as the Business-side account.
        $this->actingAs($this->user)
            ->postJson('/api/workspace-transfers', $this->payload([
                'from_account_id' => $this->perAccount->id,
            ]))
            ->assertStatus(422)
            ->assertJsonValidationErrors('from_account_id');
    }

    public function test_rejects_mismatched_currencies(): void
    {
        $usdAccount = $this->account($this->personal->id, 'USD Account', 0, 'USD');

        $this->actingAs($this->user)
            ->postJson('/api/workspace-transfers', $this->payload([
                'to_account_id' => $usdAccount->id,
            ]))
            ->assertStatus(422)
            ->assertJsonValidationErrors('to_account_id');
    }

    public function test_rejects_transfer_to_the_same_workspace(): void
    {
        $this->actingAs($this->user)
            ->postJson('/api/workspace-transfers', $this->payload([
                'to_workspace_id' => $this->business->id,
            ]))
            ->assertStatus(422)
            ->assertJsonValidationErrors('to_workspace_id');
    }

    public function test_rejects_non_positive_amount(): void
    {
        $this->actingAs($this->user)
            ->postJson('/api/workspace-transfers', $this->payload(['amount' => 0]))
            ->assertStatus(422)
            ->assertJsonValidationErrors('amount');
    }

    public function test_index_lists_cross_workspace_transfers(): void
    {
        $this->actingAs($this->user)
            ->postJson('/api/workspace-transfers', $this->payload())
            ->assertStatus(201);

        $response = $this->actingAs($this->user)->getJson('/api/workspace-transfers');

        $response->assertStatus(200);
        // Both legs are visible to the user, each from its own workspace's perspective.
        $this->assertCount(2, $response->json('data'));
    }

    public function test_accounts_endpoint_groups_accounts_by_workspace(): void
    {
        $response = $this->actingAs($this->user)->getJson('/api/workspace-transfers/accounts');

        $response->assertStatus(200);
        $data = collect($response->json('data'));
        $this->assertCount(2, $data);

        $biz = $data->firstWhere('type', 'business');
        $this->assertCount(1, $biz['accounts']);
        $this->assertSame('Business Bank', $biz['accounts'][0]['name']);
    }
}
