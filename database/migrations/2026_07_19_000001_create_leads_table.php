<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('company')->nullable();
            $table->string('email')->nullable();
            $table->string('mobile', 50)->nullable();
            $table->string('phone', 50)->nullable();
            $table->string('website')->nullable();
            $table->string('city', 100)->nullable();
            $table->string('state', 100)->nullable();
            $table->string('country', 100)->nullable();
            $table->string('channel', 50)->nullable();     // source: website, referral, whatsapp...
            $table->string('category', 100)->nullable();
            $table->enum('stage', ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'])->default('new');
            $table->enum('priority', ['low', 'medium', 'high', 'urgent'])->default('medium');
            $table->bigInteger('estimated_value')->nullable(); // minor units (cents)
            $table->string('currency', 3)->nullable();
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->date('next_follow_up_date')->nullable();
            $table->date('last_contacted_at')->nullable();
            $table->text('notes')->nullable();
            $table->json('tags')->nullable();
            $table->unsignedBigInteger('converted_customer_id')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->softDeletes();
            $table->timestamps();

            $table->index(['workspace_id', 'stage']);
            $table->index(['workspace_id', 'priority']);
            $table->index(['workspace_id', 'next_follow_up_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leads');
    }
};
