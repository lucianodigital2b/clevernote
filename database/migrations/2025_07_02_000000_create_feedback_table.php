<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('feedback', function (Blueprint $table) {
            $table->id();
            $table->nullableMorphs('feedbackable'); // Polymorphic relation (note, flashcard, quiz, etc)
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->boolean('is_positive')->nullable();
            $table->string('reason')->nullable();
            $table->json('metadata')->nullable(); // For additional structured data
            $table->timestamps();
            

            $table->index(['user_id', 'feedbackable_type']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('feedback');
    }
};