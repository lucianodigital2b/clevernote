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
        Schema::table('notes', function (Blueprint $table) {
            $table->json('external_metadata')->nullable()->after('transcription');
            $table->string('source_type')->nullable()->after('external_metadata'); // 'youtube', 'vimeo', 'upload', etc.
            $table->string('source_url')->nullable()->after('source_type'); // Original URL
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('notes', function (Blueprint $table) {
            $table->dropColumn(['external_metadata', 'source_type', 'source_url']);
        });
    }
};