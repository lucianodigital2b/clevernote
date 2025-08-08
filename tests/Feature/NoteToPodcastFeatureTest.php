<?php

namespace Tests\Feature;

use App\Contracts\TextToSpeechServiceInterface;
use App\Jobs\GenerateNotePodcastJob;
use App\Models\Note;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Mockery;
use Tests\TestCase;

class NoteToPodcastFeatureTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected $mockTtsService;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->user = User::factory()->create();
        
        // Mock the TTS service
        $this->mockTtsService = Mockery::mock(TextToSpeechServiceInterface::class);
        $this->app->instance(TextToSpeechServiceInterface::class, $this->mockTtsService);
        
        Storage::fake('r2');
        Queue::fake();
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    public function test_complete_note_to_podcast_workflow()
    {
        // Create a note
        $note = Note::factory()->create([
            'user_id' => $this->user->id,
            'title' => 'My Test Note',
            'content' => 'This is the content of my test note that will be converted to a podcast.',
            'podcast_status' => 'pending',
        ]);

        // Mock TTS service response
        $this->mockTtsService
            ->shouldReceive('convertTextToSpeech')
            ->once()
            ->andReturn([
                'file_path' => 'podcasts/test-podcast.mp3',
                'file_size' => 2048,
                'duration' => 45.5,
                'metadata' => [
                    'voice_id' => 'Joanna',
                    'language_code' => 'en-US',
                    'engine' => 'neural',
                ],
            ]);

        // Dispatch the job
        $options = [
            'voice_id' => 'Joanna',
            'include_intro' => true,
            'include_conclusion' => false,
        ];

        GenerateNotePodcastJob::dispatch($note, $options);

        // Assert job was queued
        Queue::assertPushed(GenerateNotePodcastJob::class, function ($job) use ($note, $options) {
            return $job->note->id === $note->id && $job->options === $options;
        });

        // Process the job
        $job = new GenerateNotePodcastJob($note, $options);
        $job->handle();

        // Refresh note and verify podcast was generated
        $note->refresh();
        
        $this->assertEquals('completed', $note->podcast_status);
        $this->assertEquals('podcasts/test-podcast.mp3', $note->podcast_file_path);
        $this->assertEquals(2048, $note->podcast_file_size);
        $this->assertEquals(45.5, $note->podcast_duration);
        $this->assertNotNull($note->podcast_generated_at);
        $this->assertIsArray($note->podcast_metadata);
        $this->assertEquals('Joanna', $note->podcast_metadata['voice_id']);
    }

    public function test_podcast_generation_with_long_content()
    {
        // Create a note with very long content
        $longContent = str_repeat('This is a very long sentence that will test the chunking functionality. ', 100);
        
        $note = Note::factory()->create([
            'user_id' => $this->user->id,
            'title' => 'Long Content Note',
            'content' => $longContent,
            'podcast_status' => 'pending',
        ]);

        // Mock TTS service to handle chunked content
        $this->mockTtsService
            ->shouldReceive('getMaxTextLength')
            ->andReturn(3000);

        $this->mockTtsService
            ->shouldReceive('convertTextToSpeech')
            ->twice() // Should be called twice for chunked content
            ->andReturn([
                'file_path' => 'podcasts/chunk-1.mp3',
                'file_size' => 1024,
                'duration' => 30.0,
                'metadata' => ['voice_id' => 'Joanna'],
            ], [
                'file_path' => 'podcasts/chunk-2.mp3',
                'file_size' => 512,
                'duration' => 15.0,
                'metadata' => ['voice_id' => 'Joanna'],
            ]);

        // Process the job
        $job = new GenerateNotePodcastJob($note, []);
        $job->handle();

        // Verify the podcast was generated with combined chunks
        $note->refresh();
        
        $this->assertEquals('completed', $note->podcast_status);
        $this->assertGreaterThan(1024, $note->podcast_file_size); // Combined size
        $this->assertGreaterThan(30.0, $note->podcast_duration); // Combined duration
    }

    public function test_podcast_generation_failure_handling()
    {
        $note = Note::factory()->create([
            'user_id' => $this->user->id,
            'title' => 'Test Note',
            'content' => 'Test content',
            'podcast_status' => 'pending',
        ]);

        // Mock TTS service to throw an exception
        $this->mockTtsService
            ->shouldReceive('convertTextToSpeech')
            ->once()
            ->andThrow(new \Exception('TTS service unavailable'));

        // Process the job
        $job = new GenerateNotePodcastJob($note, []);
        $job->handle();

        // Verify the failure was handled properly
        $note->refresh();
        
        $this->assertEquals('failed', $note->podcast_status);
        $this->assertStringContains('TTS service unavailable', $note->podcast_failure_reason);
        $this->assertNull($note->podcast_file_path);
        $this->assertNull($note->podcast_duration);
    }

    public function test_note_model_podcast_methods()
    {
        // Test note without podcast
        $noteWithoutPodcast = Note::factory()->create([
            'user_id' => $this->user->id,
            'podcast_status' => null,
        ]);

        $this->assertFalse($noteWithoutPodcast->hasPodcast());
        $this->assertFalse($noteWithoutPodcast->isPodcastProcessing());
        $this->assertFalse($noteWithoutPodcast->isPodcastFailed());

        // Test note with completed podcast
        $noteWithPodcast = Note::factory()->create([
            'user_id' => $this->user->id,
            'podcast_status' => 'completed',
            'podcast_file_path' => 'podcasts/test.mp3',
            'podcast_duration' => 120.5,
            'podcast_file_size' => 2048000,
        ]);

        $this->assertTrue($noteWithPodcast->hasPodcast());
        $this->assertFalse($noteWithPodcast->isPodcastProcessing());
        $this->assertFalse($noteWithPodcast->isPodcastFailed());
        $this->assertStringContains('test.mp3', $noteWithPodcast->podcast_url);
        $this->assertEquals('2:00', $noteWithPodcast->formatted_podcast_duration);
        $this->assertEquals('2.0 MB', $noteWithPodcast->formatted_podcast_file_size);

        // Test note with processing podcast
        $processingNote = Note::factory()->create([
            'user_id' => $this->user->id,
            'podcast_status' => 'processing',
        ]);

        $this->assertFalse($processingNote->hasPodcast());
        $this->assertTrue($processingNote->isPodcastProcessing());
        $this->assertFalse($processingNote->isPodcastFailed());

        // Test note with failed podcast
        $failedNote = Note::factory()->create([
            'user_id' => $this->user->id,
            'podcast_status' => 'failed',
            'podcast_failure_reason' => 'TTS service error',
        ]);

        $this->assertFalse($failedNote->hasPodcast());
        $this->assertFalse($failedNote->isPodcastProcessing());
        $this->assertTrue($failedNote->isPodcastFailed());
    }

    public function test_note_model_scopes()
    {
        // Create notes with different podcast statuses
        $completedNote = Note::factory()->create([
            'user_id' => $this->user->id,
            'podcast_status' => 'completed',
            'podcast_file_path' => 'podcasts/completed.mp3',
        ]);

        $processingNote = Note::factory()->create([
            'user_id' => $this->user->id,
            'podcast_status' => 'processing',
        ]);

        $failedNote = Note::factory()->create([
            'user_id' => $this->user->id,
            'podcast_status' => 'failed',
        ]);

        $noPodcastNote = Note::factory()->create([
            'user_id' => $this->user->id,
            'podcast_status' => null,
        ]);

        // Test scopes
        $notesWithPodcast = Note::withPodcast()->get();
        $this->assertCount(1, $notesWithPodcast);
        $this->assertEquals($completedNote->id, $notesWithPodcast->first()->id);

        $processingNotes = Note::withProcessingPodcast()->get();
        $this->assertCount(1, $processingNotes);
        $this->assertEquals($processingNote->id, $processingNotes->first()->id);

        $failedNotes = Note::withFailedPodcast()->get();
        $this->assertCount(1, $failedNotes);
        $this->assertEquals($failedNote->id, $failedNotes->first()->id);
    }

    public function test_podcast_generation_with_html_content()
    {
        $htmlContent = '<h1>My Note Title</h1><p>This is a <strong>bold</strong> paragraph with <em>emphasis</em>.</p><ul><li>Item 1</li><li>Item 2</li></ul>';
        
        $note = Note::factory()->create([
            'user_id' => $this->user->id,
            'title' => 'HTML Note',
            'content' => $htmlContent,
            'podcast_status' => 'pending',
        ]);

        $this->mockTtsService
            ->shouldReceive('convertTextToSpeech')
            ->once()
            ->with(
                Mockery::on(function ($text) {
                    // Verify HTML was stripped
                    return !str_contains($text, '<') && 
                           !str_contains($text, '>') &&
                           str_contains($text, 'bold') &&
                           str_contains($text, 'emphasis');
                }),
                Mockery::type('array')
            )
            ->andReturn([
                'file_path' => 'podcasts/html-note.mp3',
                'file_size' => 1024,
                'duration' => 25.0,
                'metadata' => ['voice_id' => 'Joanna'],
            ]);

        $job = new GenerateNotePodcastJob($note, []);
        $job->handle();

        $note->refresh();
        $this->assertEquals('completed', $note->podcast_status);
    }

    public function test_podcast_generation_with_ssml_options()
    {
        $note = Note::factory()->create([
            'user_id' => $this->user->id,
            'title' => 'SSML Test Note',
            'content' => 'This content will be converted to SSML format.',
            'podcast_status' => 'pending',
        ]);

        $options = [
            'use_ssml' => true,
            'include_intro' => true,
        ];

        $this->mockTtsService
            ->shouldReceive('convertTextToSpeech')
            ->once()
            ->with(
                Mockery::on(function ($text) {
                    // Verify SSML tags are present
                    return str_contains($text, '<speak>') && 
                           str_contains($text, '</speak>') &&
                           str_contains($text, '<break time="1s"/>');
                }),
                Mockery::on(function ($ttsOptions) {
                    return $ttsOptions['use_ssml'] === true;
                })
            )
            ->andReturn([
                'file_path' => 'podcasts/ssml-note.mp3',
                'file_size' => 1024,
                'duration' => 30.0,
                'metadata' => ['voice_id' => 'Joanna', 'use_ssml' => true],
            ]);

        $job = new GenerateNotePodcastJob($note, $options);
        $job->handle();

        $note->refresh();
        $this->assertEquals('completed', $note->podcast_status);
        $this->assertTrue($note->podcast_metadata['use_ssml']);
    }
}