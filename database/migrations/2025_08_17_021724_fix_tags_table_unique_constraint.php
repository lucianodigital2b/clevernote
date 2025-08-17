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
        Schema::table('tags', function (Blueprint $table) {
            // Drop the existing unique constraint on name
            $table->dropUnique(['name']);
            
            // Add a composite unique constraint for user_id and name
            $table->unique(['user_id', 'name']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tags', function (Blueprint $table) {
            // Drop the composite unique constraint
            $table->dropUnique(['user_id', 'name']);
            
            // Restore the original unique constraint on name
            $table->unique(['name']);
        });
    }
};
