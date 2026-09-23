<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * PUT /api/auth/user — used by the onboarding flow to mark setup complete.
 *
 * The route was missing entirely, so finishing onboarding failed with
 * "The PUT method is not supported for route api/auth/user".
 */
class ProfileUpdateTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_mark_onboarding_complete(): void
    {
        $user = User::factory()->create(['onboarding_completed' => false]);

        $this->actingAs($user)
            ->putJson('/api/auth/user', ['onboarding_completed' => true])
            ->assertStatus(200);

        $this->assertTrue($user->fresh()->onboarding_completed);
    }

    public function test_user_can_update_own_preferences(): void
    {
        $user = User::factory()->create(['timezone' => 'UTC']);

        $this->actingAs($user)
            ->putJson('/api/auth/user', [
                'name' => 'Updated Name',
                'timezone' => 'Asia/Kolkata',
                'date_format' => 'd/m/Y',
            ])
            ->assertStatus(200);

        $fresh = $user->fresh();
        $this->assertSame('Updated Name', $fresh->name);
        $this->assertSame('Asia/Kolkata', $fresh->timezone);
        $this->assertSame('d/m/Y', $fresh->date_format);
    }

    public function test_response_includes_workspaces_so_the_client_can_refresh(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->putJson('/api/auth/user', ['onboarding_completed' => true])
            ->assertStatus(200)
            ->assertJsonStructure(['id', 'email', 'workspaces']);
    }

    public function test_cannot_escalate_to_super_admin(): void
    {
        $user = User::factory()->create(['is_super_admin' => false]);

        $this->actingAs($user)
            ->putJson('/api/auth/user', ['is_super_admin' => true])
            ->assertStatus(200);

        $this->assertFalse($user->fresh()->is_super_admin);
    }

    public function test_cannot_reactivate_a_suspended_account(): void
    {
        $user = User::factory()->create(['is_active' => false]);

        $this->actingAs($user)
            ->putJson('/api/auth/user', ['is_active' => true])
            ->assertStatus(200);

        $this->assertFalse($user->fresh()->is_active);
    }

    public function test_cannot_change_email_through_this_endpoint(): void
    {
        $user = User::factory()->create(['email' => 'original@example.com']);

        $this->actingAs($user)
            ->putJson('/api/auth/user', ['email' => 'attacker@example.com'])
            ->assertStatus(200);

        $this->assertSame('original@example.com', $user->fresh()->email);
    }

    public function test_cannot_switch_workspace_through_this_endpoint(): void
    {
        $user = User::factory()->create(['current_workspace_id' => null]);

        $this->actingAs($user)
            ->putJson('/api/auth/user', ['current_workspace_id' => 999])
            ->assertStatus(200);

        $this->assertNull($user->fresh()->current_workspace_id);
    }

    public function test_requires_authentication(): void
    {
        $this->putJson('/api/auth/user', ['onboarding_completed' => true])
            ->assertStatus(401);
    }

    public function test_rejects_invalid_values(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->putJson('/api/auth/user', ['onboarding_completed' => 'not-a-boolean'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('onboarding_completed');
    }
}
