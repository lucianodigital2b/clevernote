<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('focus_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('tag_id')->nullable()->constrained()->onDelete('set null');
            $table->timestamp('started_at');
            $table->timestamp('ended_at')->nullable();
            $table->integer('planned_duration_minutes')->default(25); // Default Pomodoro duration
            $table->integer('actual_duration_minutes')->nullable();
            $table->enum('status', ['active', 'paused', 'completed', 'cancelled'])->default('active');
            $table->json('pause_intervals')->nullable(); // Store pause/resume timestamps
            $table->text('notes')->nullable(); // Optional session notes
            $table->timestamps();
            
            $table->index(['user_id', 'started_at']);
            $table->index(['user_id', 'status']);
            $table->index(['tag_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('focus_sessions');
    }
};