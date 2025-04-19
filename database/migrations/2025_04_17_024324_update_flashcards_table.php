<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class UpdateFlashcardsTable extends Migration
{
    public function up()
    {
        Schema::table('flashcards', function (Blueprint $table) {
            $table->string('language')->nullable();
            $table->foreignId('flashcard_set_id')->constrained()->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::table('flashcards', function (Blueprint $table) {
            $table->dropColumn('language');
            $table->dropForeign(['flashcard_set_id']);
            $table->dropColumn('flashcard_set_id');
        });
    }
}