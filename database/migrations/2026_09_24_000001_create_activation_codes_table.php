<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Activation codes. A super admin generates a batch of these from the admin
 * panel and a new account must redeem exactly one of them before it can use
 * the app, which keeps signups invite-only.
 *
 * A code is single-use: used_by is null while it is available, and claiming it
 * is a conditional UPDATE on that null so two concurrent requests cannot both
 * win the same code.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activation_codes', function (Blueprint $table) {
            $table->id();
            $table->string('code', 32)->unique();
            $table->foreignId('created_by')->constrained('users');
            $table->unsignedBigInteger('used_by')->nullable();
            $table->timestamp('used_at')->nullable();
            $table->string('note', 255)->nullable();
            $table->timestamps();

            $table->foreign('used_by')->references('id')->on('users')->nullOnDelete();
            // Listing the panel's "unused" tab is the hot path.
            $table->index('used_by');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activation_codes');
    }
};
