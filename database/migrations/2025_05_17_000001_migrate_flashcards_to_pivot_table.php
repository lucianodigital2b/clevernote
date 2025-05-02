<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Get all flashcards that have a flashcard_set_id
        $flashcards = DB::table('flashcards')
            ->whereNotNull('flashcard_set_id')
            ->get();

        // Create pivot table entries for each flashcard
        foreach ($flashcards as $flashcard) {
            DB::table('flashcard_flashcard_set')->insert([
                'flashcard_id' => $flashcard->id,
                'flashcard_set_id' => $flashcard->flashcard_set_id,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove all entries from the pivot table
        DB::table('flashcard_flashcard_set')->truncate();
    }
};