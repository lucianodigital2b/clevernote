<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateFlashcardSetsTable extends Migration
{
    public function up()
    {
        Schema::create('flashcard_sets', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('description')->nullable();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('folder_id')->nullable()->constrained()->onDelete('set null');
            $table->timestamps();
        });

        Schema::create('flashcard_flashcard_set', function (Blueprint $table) {
            $table->id();
            $table->foreignId('flashcard_id')->constrained()->onDelete('cascade');
            $table->foreignId('flashcard_set_id')->constrained()->onDelete('cascade');
            $table->timestamps();

            $table->unique(['flashcard_id', 'flashcard_set_id']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('flashcard_sets');
    }
}