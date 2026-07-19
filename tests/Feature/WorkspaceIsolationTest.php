<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Product;
use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceSettings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WorkspaceIsolationTest extends TestCase
{
    use RefreshDatabase;

    private User $userA;
    private User $userB;
    private Workspace $workspaceA;
    private Workspace $workspaceB;

    protected function setUp(): void
    {
        parent::setUp();

        // Create User A with workspace
        $this->userA = User::factory()->create();
        $this->workspaceA = Workspace::factory()->create(['owner_id' => $this->userA->id]);
        $this->workspaceA->members()->attach($this->userA->id, ['role' => 'owner', 'accepted_at' => now()]);
        $this->userA->update(['current_workspace_id' => $this->workspaceA->id]);
        WorkspaceSettings::create(['workspace_id' => $this->workspaceA->id]);

        // Create User B with workspace
        $this->userB = User::factory()->create();
        $this->workspaceB = Workspace::factory()->create(['owner_id' => $this->userB->id]);
        $this->workspaceB->members()->attach($this->userB->id, ['role' => 'owner', 'accepted_at' => now()]);
        $this->userB->update(['current_workspace_id' => $this->workspaceB->id]);
        WorkspaceSettings::create(['workspace_id' => $this->workspaceB->id]);
    }

    public function test_user_cannot_access_other_workspace_customers(): void
    {
        $customer = Customer::factory()->create([
            'workspace_id' => $this->workspaceB->id,
            'created_by' => $this->userB->id,
        ]);

        $response = $this->actingAs($this->userA)
            ->getJson("/api/customers/{$customer->id}");

        $response->assertStatus(404); // Not found because scope filters it
    }

    public function test_user_cannot_access_other_workspace_products(): void
    {
        $product = Product::factory()->create([
            'workspace_id' => $this->workspaceB->id,
            'created_by' => $this->userB->id,
        ]);

        $response = $this->actingAs($this->userA)
            ->getJson("/api/products/{$product->id}");

        $response->assertStatus(404);
    }

    public function test_user_cannot_access_other_workspace_invoices(): void
    {
        $customer = Customer::factory()->create([
            'workspace_id' => $this->workspaceB->id,
            'created_by' => $this->userB->id,
        ]);

        $invoice = Invoice::factory()->create([
            'workspace_id' => $this->workspaceB->id,
            'customer_id' => $customer->id,
            'created_by' => $this->userB->id,
        ]);

        $response = $this->actingAs($this->userA)
            ->getJson("/api/invoices/{$invoice->id}");

        $response->assertStatus(404);
    }

    public function test_products_list_only_shows_own_workspace(): void
    {
        Product::factory()->count(3)->create([
            'workspace_id' => $this->workspaceA->id,
            'created_by' => $this->userA->id,
        ]);

        Product::factory()->count(5)->create([
            'workspace_id' => $this->workspaceB->id,
            'created_by' => $this->userB->id,
        ]);

        $response = $this->actingAs($this->userA)
            ->getJson('/api/products');

        $response->assertStatus(200);
        $this->assertCount(3, $response->json('data'));
    }

    public function test_cannot_create_resource_in_other_workspace(): void
    {
        // Even if user tries to pass another workspace's customer_id
        $otherCustomer = Customer::factory()->create([
            'workspace_id' => $this->workspaceB->id,
            'created_by' => $this->userB->id,
        ]);

        $response = $this->actingAs($this->userA)
            ->postJson('/api/invoices', [
                'customer_id' => $otherCustomer->id,
                'invoice_date' => '2026-01-15',
                'due_date' => '2026-02-14',
                'currency' => 'USD',
                'items' => [['type' => 'custom', 'name' => 'Test', 'quantity' => 1, 'unit_price' => 1000]],
            ]);

        // Should fail validation because customer doesn't belong to this workspace
        $response->assertStatus(422);
    }
}
