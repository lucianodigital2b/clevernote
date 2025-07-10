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
        Schema::table('notes', function (Blueprint $table) {
            $table->string('uuid')->nullable()->after('id');
            $table->boolean('is_public')->default(false)->after('uuid');
        });

        // Generate UUIDs for existing notes
        $notes = DB::table('notes')->whereNull('uuid')->get();
        foreach ($notes as $note) {
            DB::table('notes')
                ->where('id', $note->id)
                ->update(['uuid' => (string) Str::uuid()]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('notes', function (Blueprint $table) {
            $table->dropColumn(['uuid', 'is_public']);
        });
    }
};