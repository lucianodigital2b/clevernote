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
            // Podcast file information
            $table->string('podcast_file_path')->nullable()->after('summary');
            $table->integer('podcast_duration')->nullable()->comment('Duration in seconds');
            $table->bigInteger('podcast_file_size')->nullable()->comment('File size in bytes');
            
            // Podcast generation status
            $table->enum('podcast_status', ['pending', 'processing', 'completed', 'failed'])
                  ->nullable()
                  ->default(null)
                  ->after('podcast_file_size');
            
            // Failure reason for debugging
            $table->text('podcast_failure_reason')->nullable()->after('podcast_status');
            
            // Metadata for podcast generation (JSON)
            $table->json('podcast_metadata')->nullable()->after('podcast_failure_reason');
            
            // Timestamps for podcast generation
            $table->timestamp('podcast_generated_at')->nullable()->after('podcast_metadata');
            
            // Index for efficient querying
            $table->index(['podcast_status', 'created_at'], 'notes_podcast_status_created_index');
            $table->index(['user_id', 'podcast_status'], 'notes_user_podcast_status_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('notes', function (Blueprint $table) {
            // Drop indexes first
            $table->dropIndex('notes_podcast_status_created_index');
            $table->dropIndex('notes_user_podcast_status_index');
            
            // Drop columns
            $table->dropColumn([
                'podcast_file_path',
                'podcast_duration',
                'podcast_file_size',
                'podcast_status',
                'podcast_failure_reason',
                'podcast_metadata',
                'podcast_generated_at'
            ]);
        });
    }
};