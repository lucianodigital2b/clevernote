<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('flashcards', function (Blueprint $table) {
            $table->dropForeign(['flashcard_set_id']);
            $table->dropColumn('flashcard_set_id');
        });
    }

    public function down(): void
    {
        Schema::table('flashcards', function (Blueprint $table) {
            $table->foreignId('flashcard_set_id')->constrained()->onDelete('cascade');
        });
    }
};