<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('code', 100)->nullable();
            $table->string('sku', 100)->nullable();
            $table->string('barcode', 100)->nullable();
            $table->text('description')->nullable();
            $table->unsignedBigInteger('category_id')->nullable();
            $table->string('unit', 50)->default('each');
            $table->bigInteger('sales_price')->default(0);
            $table->bigInteger('purchase_price')->nullable();
            $table->bigInteger('cost_price')->nullable();
            $table->bigInteger('wholesale_price')->nullable();
            $table->unsignedBigInteger('tax_id')->nullable();
            $table->boolean('tax_inclusive')->default(false);
            $table->string('currency', 3)->default('USD');
            $table->boolean('track_inventory')->default(false);
            $table->decimal('opening_stock', 12, 3)->default(0);
            $table->decimal('current_stock', 12, 3)->default(0);
            $table->decimal('low_stock_level', 12, 3)->nullable();
            $table->string('image_path', 500)->nullable();
            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable();
            $table->unsignedBigInteger('supplier_id')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
            $table->softDeletes();
            $table->index(['workspace_id', 'is_active']);
            $table->index(['workspace_id', 'name']);
            $table->foreign('category_id')->references('id')->on('categories')->nullOnDelete();
            $table->foreign('tax_id')->references('id')->on('taxes')->nullOnDelete();
            $table->foreign('supplier_id')->references('id')->on('suppliers')->nullOnDelete();
        });

        Schema::create('product_prices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->enum('price_type', ['sales', 'purchase', 'cost', 'wholesale', 'promotional']);
            $table->bigInteger('amount');
            $table->date('effective_from');
            $table->date('effective_to')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->timestamp('created_at');
            $table->index(['product_id', 'price_type', 'effective_from']);
        });

        Schema::create('services', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('code', 100)->nullable();
            $table->text('description')->nullable();
            $table->unsignedBigInteger('category_id')->nullable();
            $table->string('unit', 50)->default('hour');
            $table->bigInteger('hourly_rate')->nullable();
            $table->bigInteger('fixed_price')->nullable();
            $table->bigInteger('minimum_charge')->nullable();
            $table->decimal('default_quantity', 12, 3)->default(1);
            $table->unsignedBigInteger('tax_id')->nullable();
            $table->boolean('tax_inclusive')->default(false);
            $table->string('currency', 3)->default('USD');
            $table->string('estimated_duration', 100)->nullable();
            $table->bigInteger('internal_cost')->nullable();
            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
            $table->softDeletes();
            $table->index(['workspace_id', 'is_active']);
            $table->foreign('category_id')->references('id')->on('categories')->nullOnDelete();
            $table->foreign('tax_id')->references('id')->on('taxes')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('services');
        Schema::dropIfExists('product_prices');
        Schema::dropIfExists('products');
    }
};
