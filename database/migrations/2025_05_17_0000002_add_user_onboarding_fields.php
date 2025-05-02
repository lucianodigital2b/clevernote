<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddUserOnboardingFields extends Migration
{
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('preferred_language')->default('en');
            $table->string('discovery_source')->nullable();
            $table->string('primary_subject_interest')->nullable();
            $table->text('learning_goals')->nullable();
            $table->boolean('onboarding_completed')->default(false)->nullable();
        });
    }

    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['preferred_language', 'discovery_source', 
                'primary_subject_interest', 'learning_goals']);
        });
    }
}