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
        Schema::create('notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('folder_id')->constrained('folders')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->uuid();
            $table->string('title');
            $table->string('status');
            $table->text('failure_reason')->nullable();
            $table->longText('content')->nullable();
            $table->longText('transcription')->nullable();
            $table->text('summary')->nullable();
            $table->boolean('is_pinned')->default(false);

            $table->string('podcast_file_path')->nullable();
            $table->integer('podcast_duration')->nullable()->comment('Duration in seconds');
            $table->bigInteger('podcast_file_size')->nullable()->comment('File size in bytes');
            
            // Podcast generation status
            $table->enum('podcast_status', ['pending', 'processing', 'completed', 'failed'])
                  ->nullable()
                  ->default(null);
            
            // Failure reason for debugging
            $table->text('podcast_failure_reason')->nullable();
            
            // Metadata for podcast generation (JSON)
            $table->json('podcast_metadata')->nullable();
            
            // Timestamps for podcast generation
            $table->timestamp('podcast_generated_at')->nullable();
            
            // Index for efficient querying
            $table->index(['podcast_status', 'created_at'], 'notes_podcast_status_created_index');
            $table->index(['user_id', 'podcast_status'], 'notes_user_podcast_status_index');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notes');
    }
};
