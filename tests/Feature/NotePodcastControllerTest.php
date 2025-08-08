<?php

namespace Tests\Feature;

use App\Jobs\GenerateNotePodcastJob;
use App\Models\Note;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class NotePodcastControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Note $note;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->user = User::factory()->create();
        $this->note = Note::factory()->create([
            'user_id' => $this->user->id,
            'title' => 'Test Note',
            'content' => '<p>This is a test note with some content for podcast generation.</p>',
            'status' => 'processed'
        ]);
    }

    public function test_can_generate_podcast_for_note()
    {
        Queue::fake();

        $response = $this->actingAs($this->user)
            ->postJson("/notes/{$this->note->id}/generate-podcast", [
                'voice' => 'Joanna',
                'add_intro' => true,
                'add_conclusion' => true,
                'use_ssml' => true
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Podcast generation started successfully'
            ]);

        // Verify the note status was updated
        $this->note->refresh();
        $this->assertEquals('processing', $this->note->podcast_status);

        // Verify the job was dispatched
        Queue::assertPushed(GenerateNotePodcastJob::class, function ($job) {
            return $job->note->id === $this->note->id;
        });
    }

    public function test_cannot_generate_podcast_for_empty_note()
    {
        $emptyNote = Note::factory()->create([
            'user_id' => $this->user->id,
            'content' => null,
            'status' => 'processed'
        ]);

        $response = $this->actingAs($this->user)
            ->postJson("/notes/{$emptyNote->id}/generate-podcast");

        $response->assertStatus(422)
            ->assertJson([
                'message' => 'Cannot generate podcast for empty or unprocessed note'
            ]);
    }

    public function test_cannot_generate_podcast_for_unprocessed_note()
    {
        $unprocessedNote = Note::factory()->create([
            'user_id' => $this->user->id,
            'content' => '<p>Some content</p>',
            'status' => 'processing'
        ]);

        $response = $this->actingAs($this->user)
            ->postJson("/notes/{$unprocessedNote->id}/generate-podcast");

        $response->assertStatus(422)
            ->assertJson([
                'message' => 'Cannot generate podcast for empty or unprocessed note'
            ]);
    }

    public function test_cannot_generate_podcast_when_already_processing()
    {
        $this->note->update(['podcast_status' => 'processing']);

        $response = $this->actingAs($this->user)
            ->postJson("/notes/{$this->note->id}/generate-podcast");

        $response->assertStatus(409)
            ->assertJson([
                'message' => 'Podcast generation is already in progress for this note'
            ]);
    }

    public function test_can_get_podcast_status()
    {
        $this->note->update([
            'podcast_status' => 'completed',
            'podcast_file_path' => 'podcasts/test-podcast.mp3',
            'podcast_duration' => 120,
            'podcast_file_size' => 1024000,
            'podcast_generated_at' => now()
        ]);

        $response = $this->actingAs($this->user)
            ->getJson("/notes/{$this->note->id}/podcast-status");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'file_path',
                'duration',
                'file_size',
                'generated_at'
            ])
            ->assertJson([
                'status' => 'completed',
                'file_path' => 'podcasts/test-podcast.mp3',
                'duration' => 120,
                'file_size' => 1024000
            ]);
    }

    public function test_can_delete_podcast()
    {
        $this->note->update([
            'podcast_status' => 'completed',
            'podcast_file_path' => 'podcasts/test-podcast.mp3',
            'podcast_duration' => 120,
            'podcast_file_size' => 1024000,
            'podcast_generated_at' => now()
        ]);

        $response = $this->actingAs($this->user)
            ->deleteJson("/notes/{$this->note->id}/podcast");

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Podcast deleted successfully'
            ]);

        // Verify podcast fields were reset
        $this->note->refresh();
        $this->assertNull($this->note->podcast_status);
        $this->assertNull($this->note->podcast_file_path);
        $this->assertNull($this->note->podcast_duration);
        $this->assertNull($this->note->podcast_file_size);
        $this->assertNull($this->note->podcast_generated_at);
    }

    public function test_cannot_delete_non_existent_podcast()
    {
        $response = $this->actingAs($this->user)
            ->deleteJson("/notes/{$this->note->id}/podcast");

        $response->assertStatus(404)
            ->assertJson([
                'message' => 'No podcast found for this note'
            ]);
    }

    public function test_cannot_access_other_users_note_podcast()
    {
        $otherUser = User::factory()->create();
        $otherNote = Note::factory()->create(['user_id' => $otherUser->id]);

        $response = $this->actingAs($this->user)
            ->postJson("/notes/{$otherNote->id}/generate-podcast");

        $response->assertStatus(403);
    }

    public function test_validates_podcast_generation_options()
    {
        $response = $this->actingAs($this->user)
            ->postJson("/notes/{$this->note->id}/generate-podcast", [
                'voice' => 'InvalidVoice',
                'add_intro' => 'not_boolean',
                'add_conclusion' => 'not_boolean',
                'use_ssml' => 'not_boolean'
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['voice', 'add_intro', 'add_conclusion', 'use_ssml']);
    }
}