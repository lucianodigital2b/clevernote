<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('quizzes', function (Blueprint $table) {
            $table->string('uuid')->nullable()->after('id');
        });

        // Generate UUIDs for existing quizzes
        $quizzes = DB::table('quizzes')->whereNull('uuid')->get();
        foreach ($quizzes as $quiz) {
            DB::table('quizzes')
                ->where('id', $quiz->id)
                ->update(['uuid' => (string) Str::uuid()]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('quizzes', function (Blueprint $table) {
            $table->dropColumn('uuid');
        });
    }
};
