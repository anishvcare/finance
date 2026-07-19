<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('workspaces', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('name');
            $table->enum('type', ['personal', 'business']);
            $table->foreignId('owner_id')->constrained('users');
            $table->string('currency', 3)->default('USD');
            $table->string('timezone', 50)->default('UTC');
            $table->tinyInteger('financial_year_start')->default(1);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('workspace_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->enum('role', ['owner', 'administrator', 'accountant', 'manager', 'staff', 'viewer']);
            $table->timestamp('invited_at')->nullable();
            $table->timestamp('accepted_at')->nullable();
            $table->timestamps();
            $table->unique(['workspace_id', 'user_id']);
        });

        Schema::create('workspace_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('business_name')->nullable();
            $table->string('legal_name')->nullable();
            $table->string('trading_name')->nullable();
            $table->string('owner_name')->nullable();
            $table->string('email')->nullable();
            $table->string('phone', 50)->nullable();
            $table->string('mobile', 50)->nullable();
            $table->string('website')->nullable();
            $table->string('address_line_1')->nullable();
            $table->string('address_line_2')->nullable();
            $table->string('city', 100)->nullable();
            $table->string('state', 100)->nullable();
            $table->string('postal_code', 20)->nullable();
            $table->string('country', 100)->nullable();
            $table->string('tax_number', 100)->nullable();
            $table->string('gst_number', 50)->nullable();
            $table->string('vat_number', 50)->nullable();
            $table->string('abn', 20)->nullable();
            $table->string('pan', 20)->nullable();
            $table->string('upi_id', 100)->nullable();
            $table->string('bank_account_name')->nullable();
            $table->string('bank_name')->nullable();
            $table->string('bank_bsb', 20)->nullable();
            $table->text('bank_account_number')->nullable(); // encrypted
            $table->string('bank_swift', 20)->nullable();
            $table->string('bank_iban', 50)->nullable();
            $table->text('payment_instructions')->nullable();
            $table->text('default_invoice_notes')->nullable();
            $table->text('default_terms')->nullable();
            $table->text('default_invoice_footer')->nullable();
            $table->text('default_quote_footer')->nullable();
            $table->string('invoice_prefix', 20)->default('INV-');
            $table->unsignedInteger('invoice_next_number')->default(1);
            $table->tinyInteger('invoice_number_digits')->default(5);
            $table->boolean('invoice_include_year')->default(false);
            $table->string('quote_prefix', 20)->default('QT-');
            $table->unsignedInteger('quote_next_number')->default(1);
            $table->string('bill_prefix', 20)->default('BILL-');
            $table->unsignedInteger('bill_next_number')->default(1);
            $table->smallInteger('default_payment_terms')->default(30);
            $table->unsignedBigInteger('default_tax_id')->nullable();
            $table->string('logo_path', 500)->nullable();
            $table->string('signature_path', 500)->nullable();
            $table->string('stamp_path', 500)->nullable();
            $table->string('invoice_template', 50)->default('clean');
            $table->string('accent_color', 7)->default('#2563EB');
            $table->timestamps();
        });

        // Add foreign key for current_workspace_id on users
        Schema::table('users', function (Blueprint $table) {
            $table->foreign('current_workspace_id')->references('id')->on('workspaces')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['current_workspace_id']);
        });
        Schema::dropIfExists('workspace_settings');
        Schema::dropIfExists('workspace_members');
        Schema::dropIfExists('workspaces');
    }
};
