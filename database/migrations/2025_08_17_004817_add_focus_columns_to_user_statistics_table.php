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
        Schema::table('user_statistics', function (Blueprint $table) {
            $table->integer('focus_sessions_completed')->default(0)->after('study_time_minutes');
            $table->integer('focus_time_minutes')->default(0)->after('focus_sessions_completed');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user_statistics', function (Blueprint $table) {
            $table->dropColumn(['focus_sessions_completed', 'focus_time_minutes']);
        });
    }
};
