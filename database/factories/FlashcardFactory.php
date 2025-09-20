<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Flashcard>
 */
class FlashcardFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'folder_id' => \App\Models\Folder::factory(),
            'question' => $this->faker->sentence() . '?',
            'answer' => $this->faker->paragraph(),
            'difficulty' => $this->faker->randomElement(['easy', 'medium', 'hard']),
        ];
    }
}