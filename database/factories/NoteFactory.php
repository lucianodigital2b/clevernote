<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Note>
 */
class NoteFactory extends Factory
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
            'user_id' => \App\Models\User::factory(),
            'uuid' => $this->faker->uuid(),
            'title' => $this->faker->sentence(),
            'status' => 'pending',
            'content' => $this->faker->paragraphs(3, true),
            'transcription' => null,
            'summary' => $this->faker->paragraph(),
            'is_pinned' => false,
            'podcast_status' => null,
        ];
    }
}
