<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quiz_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('quiz_tags', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->timestamps();
        });

        Schema::create('quiz_tag', function (Blueprint $table) {
            $table->foreignId('quiz_id')->constrained()->onDelete('cascade');
            $table->foreignId('tag_id')->constrained('quiz_tags')->onDelete('cascade');
            $table->primary(['quiz_id', 'tag_id']);
        });

        Schema::create('quiz_attempts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('quiz_id')->constrained()->onDelete('cascade');
            $table->integer('score');
            $table->integer('total_questions');
            $table->json('answers')->nullable();
            $table->timestamp('completed_at');
            $table->timestamps();
        });

        Schema::create('quiz_leaderboards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quiz_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->integer('best_score');
            $table->integer('attempts_count');
            $table->timestamp('last_attempt_at');
            $table->timestamps();
            $table->unique(['quiz_id', 'user_id']);
        });

        Schema::table('quizzes', function (Blueprint $table) {
            $table->foreignId('category_id')->nullable()->constrained('quiz_categories')->onDelete('set null');
            $table->boolean('is_public')->default(false);
            $table->timestamp('next_attempt_available_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('quizzes', function (Blueprint $table) {
            $table->dropForeign(['category_id']);
            $table->dropColumn(['category_id', 'is_public', 'next_attempt_available_at']);
        });

        Schema::dropIfExists('quiz_leaderboards');
        Schema::dropIfExists('quiz_attempts');
        Schema::dropIfExists('quiz_tag');
        Schema::dropIfExists('quiz_tags');
        Schema::dropIfExists('quiz_categories');
    }
};