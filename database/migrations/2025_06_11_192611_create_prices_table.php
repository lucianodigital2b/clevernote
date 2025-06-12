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
        Schema::create('prices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->string('stripe_price_id')->unique()->nullable();
            $table->decimal('amount', 8, 2);
            $table->string('currency', 3)->default('usd');
            $table->enum('interval', ['month', 'year'])->nullable();
            $table->integer('interval_count')->default(1);
            $table->enum('type', ['recurring', 'one_time'])->default('recurring');
            $table->boolean('active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('prices');
    }
};
