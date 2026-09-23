<?php

namespace Tests\Feature;

use App\Models\ActivationCode;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ActivationCodeTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $newUser;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->superAdmin()->create();
        // A freshly signed-up account: not activated.
        $this->newUser = User::factory()->unactivated()->create();
    }

    private function makeCode(?string $code = null): ActivationCode
    {
        return ActivationCode::create([
            'code' => $code ?? 'ABCD-EFGH-JKMN',
            'created_by' => $this->admin->id,
        ]);
    }

    // ---------------- Admin: generating ----------------

    public function test_admin_can_generate_a_batch_of_codes(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/admin/activation-codes', ['quantity' => 5]);

        $response->assertStatus(201);
        $this->assertCount(5, $response->json('data'));
        $this->assertSame(5, ActivationCode::count());
    }

    public function test_generated_codes_are_all_different(): void
    {
        $this->actingAs($this->admin)
            ->postJson('/api/admin/activation-codes', ['quantity' => 50])
            ->assertStatus(201);

        $this->assertSame(50, ActivationCode::distinct('code')->count('code'));
    }

    public function test_generated_codes_avoid_visually_ambiguous_characters(): void
    {
        $this->actingAs($this->admin)
            ->postJson('/api/admin/activation-codes', ['quantity' => 30])
            ->assertStatus(201);

        foreach (ActivationCode::pluck('code') as $code) {
            $this->assertMatchesRegularExpression('/^[2-9A-HJ-NP-Z]{4}(-[2-9A-HJ-NP-Z]{4}){2}$/', $code);
            // 0/O and 1/I/L are excluded because codes are typed by hand.
            $this->assertDoesNotMatchRegularExpression('/[01OIL]/', $code);
        }
    }

    public function test_quantity_is_validated(): void
    {
        foreach ([0, -1, 501] as $bad) {
            $this->actingAs($this->admin)
                ->postJson('/api/admin/activation-codes', ['quantity' => $bad])
                ->assertStatus(422)
                ->assertJsonValidationErrors('quantity');
        }
    }

    // ---------------- Admin: authorization ----------------

    public function test_non_admin_cannot_generate_codes(): void
    {
        $this->actingAs($this->newUser)
            ->postJson('/api/admin/activation-codes', ['quantity' => 5])
            ->assertStatus(403);

        $this->assertSame(0, ActivationCode::count());
    }

    public function test_non_admin_cannot_list_codes(): void
    {
        $this->makeCode();

        $this->actingAs($this->newUser)
            ->getJson('/api/admin/activation-codes')
            ->assertStatus(403);
    }

    public function test_guest_cannot_list_codes(): void
    {
        $this->getJson('/api/admin/activation-codes')->assertStatus(401);
    }

    // ---------------- Admin: listing used vs unused ----------------

    public function test_listing_reports_used_and_unused_counts(): void
    {
        $used = $this->makeCode('AAAA-BBBB-CCCC');
        $this->makeCode('DDDD-EEEE-FFFF');
        $this->makeCode('GGGG-HHHH-JJJJ');

        $used->update(['used_by' => $this->newUser->id, 'used_at' => now()]);

        $response = $this->actingAs($this->admin)->getJson('/api/admin/activation-codes');

        $response->assertStatus(200);
        $this->assertSame(3, $response->json('counts.total'));
        $this->assertSame(1, $response->json('counts.used'));
        $this->assertSame(2, $response->json('counts.unused'));
    }

    public function test_listing_can_filter_to_unused_only(): void
    {
        $used = $this->makeCode('AAAA-BBBB-CCCC');
        $this->makeCode('DDDD-EEEE-FFFF');
        $used->update(['used_by' => $this->newUser->id, 'used_at' => now()]);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/admin/activation-codes?status=unused');

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
        $this->assertSame('DDDD-EEEE-FFFF', $response->json('data.0.code'));
    }

    public function test_listing_shows_who_used_a_code(): void
    {
        $used = $this->makeCode();
        $used->update(['used_by' => $this->newUser->id, 'used_at' => now()]);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/admin/activation-codes?status=used');

        $response->assertStatus(200);
        $this->assertSame($this->newUser->email, $response->json('data.0.user.email'));
    }

    public function test_unused_code_can_be_deleted_but_used_code_cannot(): void
    {
        $unused = $this->makeCode('AAAA-BBBB-CCCC');
        $used = $this->makeCode('DDDD-EEEE-FFFF');
        $used->update(['used_by' => $this->newUser->id, 'used_at' => now()]);

        $this->actingAs($this->admin)
            ->deleteJson("/api/admin/activation-codes/{$unused->id}")
            ->assertStatus(204);

        // Used codes are the audit trail of who was activated by what.
        $this->actingAs($this->admin)
            ->deleteJson("/api/admin/activation-codes/{$used->id}")
            ->assertStatus(422);

        $this->assertDatabaseMissing('activation_codes', ['id' => $unused->id]);
        $this->assertDatabaseHas('activation_codes', ['id' => $used->id]);
    }

    // ---------------- Redeeming ----------------

    public function test_user_can_activate_with_a_valid_code(): void
    {
        $code = $this->makeCode();

        $response = $this->actingAs($this->newUser)
            ->postJson('/api/auth/activate', ['code' => $code->code]);

        $response->assertStatus(200);

        $fresh = $this->newUser->fresh();
        $this->assertNotNull($fresh->activated_at);

        $code->refresh();
        $this->assertSame($this->newUser->id, $code->used_by);
        $this->assertNotNull($code->used_at);
    }

    public function test_activation_provisions_a_workspace_so_the_dashboard_works(): void
    {
        $code = $this->makeCode();

        $this->actingAs($this->newUser)
            ->postJson('/api/auth/activate', ['code' => $code->code])
            ->assertStatus(200);

        $fresh = $this->newUser->fresh();

        // Lands on a usable dashboard rather than a dead end.
        $this->assertNotNull($fresh->current_workspace_id);
        $this->assertTrue($fresh->onboarding_completed);

        $workspace = Workspace::withoutGlobalScopes()->find($fresh->current_workspace_id);
        $this->assertSame($this->newUser->id, $workspace->owner_id);
        // Owner membership is what every workspace-scoped query relies on.
        $this->assertDatabaseHas('workspace_members', [
            'workspace_id' => $workspace->id,
            'user_id' => $this->newUser->id,
            'role' => 'owner',
        ]);
        $this->assertDatabaseHas('workspace_settings', ['workspace_id' => $workspace->id]);
    }

    public function test_a_code_cannot_be_used_twice(): void
    {
        $code = $this->makeCode();
        $second = User::factory()->unactivated()->create();

        $this->actingAs($this->newUser)
            ->postJson('/api/auth/activate', ['code' => $code->code])
            ->assertStatus(200);

        // The first request established a session for $newUser; it has to be
        // cleared before acting as a different account in the same test.
        $this->flushSession();

        $this->actingAs($second)
            ->postJson('/api/auth/activate', ['code' => $code->code])
            ->assertStatus(422)
            ->assertJsonValidationErrors('code');

        $this->assertNull($second->fresh()->activated_at);
        // The first redeemer keeps the code.
        $this->assertSame($this->newUser->id, $code->fresh()->used_by);
    }

    public function test_invalid_code_is_rejected_and_nothing_is_provisioned(): void
    {
        $this->actingAs($this->newUser)
            ->postJson('/api/auth/activate', ['code' => 'ZZZZ-ZZZZ-ZZZZ'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('code');

        $fresh = $this->newUser->fresh();
        $this->assertNull($fresh->activated_at);
        $this->assertNull($fresh->current_workspace_id);
        $this->assertSame(0, Workspace::withoutGlobalScopes()->count());
    }

    public function test_code_entry_is_forgiving_about_case_spacing_and_dashes(): void
    {
        $code = $this->makeCode('ABCD-EFGH-JKMN');

        $this->actingAs($this->newUser)
            ->postJson('/api/auth/activate', ['code' => '  abcdefghjkmn '])
            ->assertStatus(200);

        $this->assertSame($this->newUser->id, $code->fresh()->used_by);
    }

    public function test_activating_twice_is_harmless(): void
    {
        $first = $this->makeCode('AAAA-BBBB-CCCC');
        $second = $this->makeCode('DDDD-EEEE-FFFF');

        $this->actingAs($this->newUser)
            ->postJson('/api/auth/activate', ['code' => $first->code])
            ->assertStatus(200);

        $this->actingAs($this->newUser)
            ->postJson('/api/auth/activate', ['code' => $second->code])
            ->assertStatus(200);

        // The second code must not be consumed by an already-active account.
        $this->assertNull($second->fresh()->used_by);
    }

    // ---------------- Gating ----------------

    public function test_unactivated_user_is_blocked_from_the_app(): void
    {
        $this->actingAs($this->newUser)
            ->getJson('/api/dashboard')
            ->assertStatus(403)
            ->assertJson(['activation_required' => true]);
    }

    public function test_unactivated_user_can_still_read_own_profile_and_log_out(): void
    {
        // The client must be able to discover it needs to activate, and leave.
        $this->actingAs($this->newUser)->getJson('/api/auth/user')->assertStatus(200);
        $this->actingAs($this->newUser)->postJson('/api/auth/logout')->assertStatus(200);
    }

    public function test_activated_user_reaches_the_app(): void
    {
        $code = $this->makeCode();

        $this->actingAs($this->newUser)
            ->postJson('/api/auth/activate', ['code' => $code->code])
            ->assertStatus(200);

        $this->actingAs($this->newUser->fresh())
            ->getJson('/api/dashboard')
            ->assertStatus(200);
    }

    public function test_a_real_signup_starts_unactivated_and_works_after_redeeming(): void
    {
        // Goes through the actual registration endpoint rather than a factory,
        // to prove new signups are gated for real.
        $this->postJson('/api/auth/register', [
            'name' => 'New Customer',
            'email' => 'newcustomer@example.com',
            'password' => 'Password1',
            'password_confirmation' => 'Password1',
        ])->assertStatus(201);

        $signup = User::where('email', 'newcustomer@example.com')->firstOrFail();
        $this->assertNull($signup->activated_at, 'A new signup must not be activated.');

        $this->flushSession();
        $this->actingAs($signup)->getJson('/api/dashboard')->assertStatus(403);

        $code = $this->makeCode('PQRS-TUVW-XYZ2');
        $this->actingAs($signup)
            ->postJson('/api/auth/activate', ['code' => $code->code])
            ->assertStatus(200);

        $this->actingAs($signup->fresh())->getJson('/api/dashboard')->assertStatus(200);
    }

    public function test_existing_accounts_were_grandfathered_by_the_migration(): void
    {
        // The migration back-fills activated_at, so nobody who signed up before
        // activation codes existed gets locked out.
        $this->assertNotNull($this->admin->activated_at);
        $this->assertSame(0, DB::table('users')->whereNull('activated_at')->whereNot('id', $this->newUser->id)->count());
    }
}
