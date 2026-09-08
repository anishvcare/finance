<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quotes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->string('quote_number', 50);
            $table->foreignId('customer_id')->constrained();
            $table->enum('status', ['draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired', 'converted', 'cancelled'])->default('draft');
            $table->date('quote_date');
            $table->date('expiry_date')->nullable();
            $table->string('currency', 3);
            $table->bigInteger('subtotal')->default(0);
            $table->bigInteger('discount_amount')->default(0);
            $table->bigInteger('shipping_amount')->default(0);
            $table->bigInteger('tax_amount')->default(0);
            $table->bigInteger('additional_charges')->default(0);
            $table->bigInteger('round_off')->default(0);
            $table->bigInteger('total')->default(0);
            $table->text('notes')->nullable();
            $table->text('terms')->nullable();
            $table->text('customer_message')->nullable();
            $table->text('internal_notes')->nullable();
            $table->unsignedBigInteger('converted_invoice_id')->nullable();
            $table->string('template', 50)->default('clean');
            $table->foreignId('created_by')->constrained('users');
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('viewed_at')->nullable();
            $table->timestamp('accepted_at')->nullable();
            $table->timestamp('rejected_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->unique(['workspace_id', 'quote_number']);
            $table->index(['workspace_id', 'status']);
            $table->index(['workspace_id', 'customer_id']);
        });

        Schema::create('quote_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quote_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['product', 'service', 'custom']);
            $table->unsignedBigInteger('product_id')->nullable();
            $table->unsignedBigInteger('service_id')->nullable();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('unit', 50)->default('each');
            $table->decimal('quantity', 12, 3);
            $table->bigInteger('unit_price');
            $table->decimal('discount_rate', 5, 2)->default(0);
            $table->bigInteger('discount_amount')->default(0);
            $table->unsignedBigInteger('tax_id')->nullable();
            $table->decimal('tax_rate', 8, 4)->default(0);
            $table->bigInteger('tax_amount')->default(0);
            $table->bigInteger('line_total');
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->string('invoice_number', 50);
            $table->foreignId('customer_id')->constrained();
            $table->unsignedBigInteger('quote_id')->nullable();
            $table->enum('status', ['draft', 'finalised', 'sent', 'viewed', 'partially_paid', 'paid', 'overdue', 'void', 'cancelled', 'refunded'])->default('draft');
            $table->date('invoice_date');
            $table->date('due_date');
            $table->string('currency', 3);
            $table->smallInteger('payment_terms')->default(30);
            $table->string('reference_number', 100)->nullable();
            $table->string('purchase_order', 100)->nullable();
            $table->string('salesperson', 100)->nullable();
            $table->bigInteger('subtotal')->default(0);
            $table->bigInteger('discount_amount')->default(0);
            $table->bigInteger('shipping_amount')->default(0);
            $table->bigInteger('tax_amount')->default(0);
            $table->bigInteger('additional_charges')->default(0);
            $table->bigInteger('round_off')->default(0);
            $table->bigInteger('total')->default(0);
            $table->bigInteger('amount_paid')->default(0);
            $table->bigInteger('balance_due')->default(0);
            $table->text('notes')->nullable();
            $table->text('terms')->nullable();
            $table->text('payment_instructions')->nullable();
            $table->text('internal_notes')->nullable();
            $table->text('footer')->nullable();
            $table->string('template', 50)->default('clean');
            $table->string('share_token', 64)->nullable()->unique();
            $table->timestamp('share_expires_at')->nullable();
            $table->timestamp('finalised_at')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('viewed_at')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('voided_at')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
            $table->softDeletes();
            $table->unique(['workspace_id', 'invoice_number']);
            $table->index(['workspace_id', 'status']);
            $table->index(['workspace_id', 'customer_id']);
            $table->index(['workspace_id', 'due_date']);
            $table->foreign('quote_id')->references('id')->on('quotes')->nullOnDelete();
        });

        Schema::create('invoice_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['product', 'service', 'custom']);
            $table->unsignedBigInteger('product_id')->nullable();
            $table->unsignedBigInteger('service_id')->nullable();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('unit', 50)->default('each');
            $table->decimal('quantity', 12, 3);
            $table->bigInteger('unit_price');
            $table->decimal('discount_rate', 5, 2)->default(0);
            $table->bigInteger('discount_amount')->default(0);
            $table->unsignedBigInteger('tax_id')->nullable();
            $table->decimal('tax_rate', 8, 4)->default(0);
            $table->bigInteger('tax_amount')->default(0);
            $table->bigInteger('line_total');
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('bills', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->string('bill_number', 50);
            $table->foreignId('supplier_id')->constrained();
            $table->string('supplier_invoice_number', 100)->nullable();
            $table->enum('status', ['draft', 'open', 'partially_paid', 'paid', 'overdue', 'cancelled', 'disputed'])->default('draft');
            $table->date('bill_date');
            $table->date('due_date');
            $table->string('currency', 3);
            $table->smallInteger('payment_terms')->default(30);
            $table->bigInteger('subtotal')->default(0);
            $table->bigInteger('discount_amount')->default(0);
            $table->bigInteger('shipping_amount')->default(0);
            $table->bigInteger('tax_amount')->default(0);
            $table->bigInteger('additional_charges')->default(0);
            $table->bigInteger('round_off')->default(0);
            $table->bigInteger('total')->default(0);
            $table->bigInteger('amount_paid')->default(0);
            $table->bigInteger('balance_due')->default(0);
            $table->text('notes')->nullable();
            $table->text('internal_notes')->nullable();
            $table->string('attachment_path', 500)->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
            $table->softDeletes();
            $table->unique(['workspace_id', 'bill_number']);
            $table->index(['workspace_id', 'status']);
            $table->index(['workspace_id', 'supplier_id']);
            $table->index(['workspace_id', 'due_date']);
        });

        Schema::create('bill_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bill_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['product', 'service', 'expense']);
            $table->unsignedBigInteger('product_id')->nullable();
            $table->unsignedBigInteger('service_id')->nullable();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('unit', 50)->default('each');
            $table->decimal('quantity', 12, 3);
            $table->bigInteger('unit_price');
            $table->decimal('discount_rate', 5, 2)->default(0);
            $table->bigInteger('discount_amount')->default(0);
            $table->unsignedBigInteger('tax_id')->nullable();
            $table->decimal('tax_rate', 8, 4)->default(0);
            $table->bigInteger('tax_amount')->default(0);
            $table->bigInteger('line_total');
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bill_items');
        Schema::dropIfExists('bills');
        Schema::dropIfExists('invoice_items');
        Schema::dropIfExists('invoices');
        Schema::dropIfExists('quote_items');
        Schema::dropIfExists('quotes');
    }
};
