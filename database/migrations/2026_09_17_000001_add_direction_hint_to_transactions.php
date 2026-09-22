<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adds direction_hint to transactions.
 *
 * A transfer is stored as a linked pair of rows (transfer_pair_id). Both rows
 * hold a positive amount, so on its own a row cannot say whether money left or
 * entered that account. This is required for cross-workspace transfers
 * (e.g. Business -> Personal owner's draw), where each leg lives in a
 * different workspace and must render correctly from either side.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->string('direction_hint', 3)->nullable()->after('transfer_pair_id');
        });
    }

    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropColumn('direction_hint');
        });
    }
};
