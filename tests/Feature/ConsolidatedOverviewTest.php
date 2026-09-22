<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Transaction;
use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceSettings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ConsolidatedOverviewTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Workspace $business;
    private Workspace $personal;

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
    }

    /** @var array<int,int> workspace_id => account_id */
    private array $accounts = [];

    private function accountFor(int $workspaceId): int
    {
        if (! isset($this->accounts[$workspaceId])) {
            $this->accounts[$workspaceId] = Account::withoutGlobalScopes()->create([
                'workspace_id' => $workspaceId,
                'name' => 'Test Account',
                'type' => 'cash',
                'currency' => 'INR',
                'opening_balance' => 0,
                'current_balance' => 0,
                'is_active' => true,
            ])->id;
        }

        return $this->accounts[$workspaceId];
    }

    private function txn(int $workspaceId, string $type, int $amount): void
    {
        Transaction::withoutGlobalScopes()->create([
            'uuid' => \Illuminate\Support\Str::uuid()->toString(),
            'workspace_id' => $workspaceId,
            'account_id' => $this->accountFor($workspaceId),
            'type' => $type,
            'amount' => $amount,
            'currency' => 'INR',
            'date' => now()->toDateString(),
            'created_by' => $this->user->id,
        ]);
    }

    public function test_overview_aggregates_across_business_and_personal(): void
    {
        $this->txn($this->business->id, 'income', 100000);
        $this->txn($this->business->id, 'expense', 40000);
        $this->txn($this->personal->id, 'income', 20000);
        $this->txn($this->personal->id, 'expense', 5000);

        $response = $this->actingAs($this->user)->getJson('/api/overview');

        $response->assertStatus(200);

        // Combined roll-up spans BOTH workspaces.
        $this->assertSame(120000, $response->json('combined.income'));
        $this->assertSame(45000, $response->json('combined.expense'));
        $this->assertSame(75000, $response->json('combined.net'));

        // Per-workspace breakdown keeps them separate.
        $rows = collect($response->json('workspaces'));
        $this->assertCount(2, $rows);

        $biz = $rows->firstWhere('type', 'business');
        $per = $rows->firstWhere('type', 'personal');
        $this->assertSame(100000, $biz['income']);
        $this->assertSame(40000, $biz['expense']);
        $this->assertSame(20000, $per['income']);
        $this->assertSame(5000, $per['expense']);
    }

    public function test_overview_includes_account_cash_balances(): void
    {
        Account::withoutGlobalScopes()->create([
            'workspace_id' => $this->business->id, 'name' => 'Biz Bank', 'type' => 'bank',
            'currency' => 'INR', 'opening_balance' => 0, 'current_balance' => 500000, 'is_active' => true,
        ]);
        Account::withoutGlobalScopes()->create([
            'workspace_id' => $this->personal->id, 'name' => 'Wallet', 'type' => 'cash',
            'currency' => 'INR', 'opening_balance' => 0, 'current_balance' => 15000, 'is_active' => true,
        ]);

        $response = $this->actingAs($this->user)->getJson('/api/overview');

        $response->assertStatus(200);
        $this->assertSame(515000, $response->json('combined.cash_balance'));
    }

    public function test_overview_never_includes_another_users_workspace(): void
    {
        $stranger = User::factory()->create();
        $strangerWs = Workspace::factory()->create(['owner_id' => $stranger->id, 'type' => 'business']);
        $strangerWs->members()->attach($stranger->id, ['role' => 'owner', 'accepted_at' => now()]);
        $this->txn($strangerWs->id, 'income', 999999);

        $this->txn($this->business->id, 'income', 100);

        $response = $this->actingAs($this->user)->getJson('/api/overview');

        $response->assertStatus(200);
        // Only this user's own workspaces are counted.
        $this->assertSame(100, $response->json('combined.income'));
        $this->assertCount(2, $response->json('workspaces'));
    }

    public function test_overview_flags_mixed_currencies(): void
    {
        $this->personal->update(['currency' => 'USD']);

        $response = $this->actingAs($this->user)->getJson('/api/overview');

        $response->assertStatus(200);
        $this->assertTrue($response->json('combined.mixed_currencies'));
    }
}
