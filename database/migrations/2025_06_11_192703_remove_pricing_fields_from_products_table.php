<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn([
                'monthly_price',
                'annual_price',
                'billed_monthly',
                'billed_annually'
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->decimal('monthly_price', 8, 2)->after('stripe_product_id');
            $table->decimal('annual_price', 8, 2)->after('monthly_price');
            $table->decimal('billed_monthly', 8, 2)->after('annual_price');
            $table->decimal('billed_annually', 8, 2)->after('billed_monthly');
        });
    }
};
