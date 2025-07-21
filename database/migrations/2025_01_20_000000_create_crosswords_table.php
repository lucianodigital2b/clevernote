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
        Schema::create('crosswords', function (Blueprint $table) {
            $table->id();
            $table->foreignId('note_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('title');
            $table->json('puzzle_data'); // Stores the crossword grid and clues in JSON format
            $table->enum('status', ['pending', 'generating', 'completed', 'failed'])->default('pending');
            $table->text('failure_reason')->nullable();
            $table->string('uuid')->unique();
            $table->timestamps();
            
            $table->index(['user_id', 'status']);
            $table->index(['note_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('crosswords');
    }
};