<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Marks when an account redeemed an activation code. Null means the account is
 * signed up but not yet activated, and is held on the activation screen.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('activated_at')->nullable()->after('onboarding_completed');
        });

        // Grandfather every account that already exists. Activation codes are
        // introduced here, so nobody created before this point could have
        // redeemed one, and back-filling avoids locking existing users out.
        DB::table('users')->whereNull('activated_at')->update(['activated_at' => now()]);
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('activated_at');
        });
    }
};
