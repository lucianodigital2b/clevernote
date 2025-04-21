<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddNoteIdToFlashcardSetsTable extends Migration
{
    public function up()
    {
        Schema::table('flashcard_sets', function (Blueprint $table) {
            $table->unsignedBigInteger('note_id')->nullable();
            $table->foreign('note_id')->references('id')->on('notes')->onDelete('set null');
        });
    }

    public function down()
    {
        Schema::table('flashcard_sets', function (Blueprint $table) {
            $table->dropForeign(['note_id']);
            $table->dropColumn('note_id');
        });
    }
}