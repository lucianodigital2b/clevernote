<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('mindmaps', function (Blueprint $table) {
            $table->string('status')->default('pending')->after('edges');
        });
    }

    public function down()
    {
        Schema::table('mindmaps', function (Blueprint $table) {
            $table->dropColumn('status');
        });
    }
};