<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['incoming', 'outgoing']);
            $table->unsignedBigInteger('customer_id')->nullable();
            $table->unsignedBigInteger('supplier_id')->nullable();
            $table->foreignId('account_id')->constrained();
            $table->bigInteger('amount');
            $table->string('currency', 3);
            $table->decimal('exchange_rate', 12, 6)->default(1.000000);
            $table->date('payment_date');
            $table->string('payment_method', 50);
            $table->string('reference_number')->nullable();
            $table->text('notes')->nullable();
            $table->string('attachment_path', 500)->nullable();
            $table->boolean('is_refund')->default(false);
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
            $table->softDeletes();
            $table->index(['workspace_id', 'type']);
            $table->index(['workspace_id', 'payment_date']);
            $table->foreign('customer_id')->references('id')->on('customers')->nullOnDelete();
            $table->foreign('supplier_id')->references('id')->on('suppliers')->nullOnDelete();
        });

        Schema::create('payment_allocations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payment_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('invoice_id')->nullable();
            $table->unsignedBigInteger('bill_id')->nullable();
            $table->bigInteger('amount');
            $table->timestamps();
            $table->foreign('invoice_id')->references('id')->on('invoices')->nullOnDelete();
            $table->foreign('bill_id')->references('id')->on('bills')->nullOnDelete();
        });

        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignId('account_id')->constrained();
            $table->enum('type', ['income', 'expense', 'transfer', 'refund', 'adjustment']);
            $table->bigInteger('amount');
            $table->string('currency', 3);
            $table->date('date');
            $table->time('time')->nullable();
            $table->unsignedBigInteger('category_id')->nullable();
            $table->unsignedBigInteger('customer_id')->nullable();
            $table->unsignedBigInteger('supplier_id')->nullable();
            $table->unsignedBigInteger('invoice_id')->nullable();
            $table->unsignedBigInteger('bill_id')->nullable();
            $table->unsignedBigInteger('payment_id')->nullable();
            $table->string('description', 500)->nullable();
            $table->text('notes')->nullable();
            $table->string('payment_method', 50)->nullable();
            $table->string('reference')->nullable();
            $table->json('tags')->nullable();
            $table->boolean('is_recurring')->default(false);
            $table->string('recurrence_rule', 100)->nullable();
            $table->unsignedBigInteger('ocr_import_id')->nullable();
            $table->decimal('ocr_confidence', 5, 2)->nullable();
            $table->enum('review_status', ['pending', 'reviewed', 'confirmed'])->default('confirmed');
            $table->unsignedBigInteger('transfer_pair_id')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
            $table->softDeletes();
            $table->index(['workspace_id', 'date']);
            $table->index(['workspace_id', 'type']);
            $table->index(['workspace_id', 'account_id']);
            $table->foreign('category_id')->references('id')->on('categories')->nullOnDelete();
            $table->foreign('customer_id')->references('id')->on('customers')->nullOnDelete();
            $table->foreign('supplier_id')->references('id')->on('suppliers')->nullOnDelete();
            $table->foreign('invoice_id')->references('id')->on('invoices')->nullOnDelete();
            $table->foreign('bill_id')->references('id')->on('bills')->nullOnDelete();
            $table->foreign('payment_id')->references('id')->on('payments')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transactions');
        Schema::dropIfExists('payment_allocations');
        Schema::dropIfExists('payments');
    }
};
