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
        Schema::table('subscriptions', function (Blueprint $table) {
            // Add provider field to distinguish between Stripe and RevenueCat
            $table->string('provider')->default('stripe')->after('id');
            
            // RevenueCat specific fields
            $table->string('revenuecat_customer_id')->nullable()->after('provider');
            $table->string('revenuecat_entitlement_id')->nullable()->after('revenuecat_customer_id');
            $table->string('revenuecat_product_id')->nullable()->after('revenuecat_entitlement_id');
            $table->string('platform')->nullable()->after('revenuecat_product_id');
            $table->boolean('is_trial')->default(false)->after('platform');
            $table->timestamp('revenuecat_expires_at')->nullable()->after('is_trial');
            $table->json('revenuecat_metadata')->nullable()->after('revenuecat_expires_at');
            
            // Add indexes for performance
            $table->index(['provider', 'user_id']);
            $table->index('revenuecat_customer_id');
            $table->index('revenuecat_entitlement_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            // Drop indexes first
            $table->dropIndex(['provider', 'user_id']);
            $table->dropIndex(['revenuecat_customer_id']);
            $table->dropIndex(['revenuecat_entitlement_id']);
            
            // Drop columns
            $table->dropColumn([
                'provider',
                'revenuecat_customer_id',
                'revenuecat_entitlement_id',
                'revenuecat_product_id',
                'platform',
                'is_trial',
                'revenuecat_expires_at',
                'revenuecat_metadata'
            ]);
        });
    }
};
