<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_statistics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->date('date');
            $table->integer('quiz_attempts')->default(0);
            $table->integer('quiz_correct_answers')->default(0);
            $table->integer('quiz_total_questions')->default(0);
            $table->integer('flashcard_reviews')->default(0);
            $table->integer('flashcard_correct')->default(0);
            $table->integer('study_time_minutes')->default(0);
            $table->integer('focus_sessions_completed')->default(0);
            $table->integer('focus_time_minutes')->default(0);
            $table->integer('current_streak')->default(0);
            $table->integer('max_streak')->default(0);
            $table->timestamps();
            
            $table->unique(['user_id', 'date']);
            $table->index(['user_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_statistics');
    }
};