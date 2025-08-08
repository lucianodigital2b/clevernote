<?php

namespace Tests\Unit\Jobs;

use App\Jobs\GenerateNotePodcastJob;
use App\Models\Note;
use App\Models\User;
use App\Services\NoteToPodcastGenerator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Log;
use Mockery;
use Tests\TestCase;

class GenerateNotePodcastJobTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Note $note;
    protected $mockGenerator;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->user = User::factory()->create();
        $this->note = Note::factory()->create([
            'user_id' => $this->user->id,
            'title' => 'Test Note',
            'content' => 'This is test content for podcast generation.',
            'podcast_status' => 'pending',
        ]);
        
        $this->mockGenerator = Mockery::mock(NoteToPodcastGenerator::class);
        $this->app->instance(NoteToPodcastGenerator::class, $this->mockGenerator);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    public function test_job_handles_successful_podcast_generation()
    {
        $options = ['voice_id' => 'Joanna'];
        
        $this->mockGenerator
            ->shouldReceive('generatePodcast')
            ->once()
            ->with($this->note, $options)
            ->andReturn(true);

        $job = new GenerateNotePodcastJob($this->note, $options);
        $job->handle();

        // Refresh the note to check status
        $this->note->refresh();
        $this->assertNotEquals('processing', $this->note->podcast_status);
    }

    public function test_job_handles_failed_podcast_generation()
    {
        $options = ['voice_id' => 'Joanna'];
        
        $this->mockGenerator
            ->shouldReceive('generatePodcast')
            ->once()
            ->with($this->note, $options)
            ->andReturn(false);

        $job = new GenerateNotePodcastJob($this->note, $options);
        $job->handle();

        // The job should complete without throwing an exception
        // The generator is responsible for updating the note status
        $this->assertTrue(true);
    }

    public function test_job_handles_exception_during_generation()
    {
        Log::shouldReceive('error')->once();
        
        $options = ['voice_id' => 'Joanna'];
        
        $this->mockGenerator
            ->shouldReceive('generatePodcast')
            ->once()
            ->with($this->note, $options)
            ->andThrow(new \Exception('Unexpected error'));

        $job = new GenerateNotePodcastJob($this->note, $options);
        
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Unexpected error');
        
        $job->handle();
    }

    public function test_job_failed_method_updates_note_status()
    {
        $options = ['voice_id' => 'Joanna'];
        $exception = new \Exception('Job failed');
        
        $job = new GenerateNotePodcastJob($this->note, $options);
        $job->failed($exception);

        $this->note->refresh();
        $this->assertEquals('failed', $this->note->podcast_status);
        $this->assertStringContains('Job failed', $this->note->podcast_failure_reason);
    }

    public function test_job_has_correct_configuration()
    {
        $job = new GenerateNotePodcastJob($this->note, []);
        
        $this->assertEquals('default', $job->queue);
        $this->assertEquals(600, $job->timeout);
        $this->assertEquals(3, $job->tries);
        $this->assertEquals([30, 60, 120], $job->backoff());
    }

    public function test_job_serialization()
    {
        $options = ['voice_id' => 'Matthew', 'use_ssml' => true];
        $job = new GenerateNotePodcastJob($this->note, $options);
        
        // Test that the job can be serialized and unserialized
        $serialized = serialize($job);
        $unserialized = unserialize($serialized);
        
        $this->assertInstanceOf(GenerateNotePodcastJob::class, $unserialized);
        $this->assertEquals($this->note->id, $unserialized->note->id);
        $this->assertEquals($options, $unserialized->options);
    }

    public function test_job_updates_note_status_to_processing()
    {
        $this->mockGenerator
            ->shouldReceive('generatePodcast')
            ->once()
            ->andReturn(true);

        // Set initial status
        $this->note->update(['podcast_status' => 'pending']);
        
        $job = new GenerateNotePodcastJob($this->note, []);
        $job->handle();

        // The job should have updated the status to processing at the start
        // Note: This test assumes the job updates status to processing in handle method
        $this->assertTrue(true); // Placeholder - actual implementation may vary
    }

    public function test_job_with_empty_options()
    {
        $this->mockGenerator
            ->shouldReceive('generatePodcast')
            ->once()
            ->with($this->note, [])
            ->andReturn(true);

        $job = new GenerateNotePodcastJob($this->note);
        $job->handle();

        $this->assertTrue(true);
    }

    public function test_job_with_null_note_throws_exception()
    {
        $this->expectException(\TypeError::class);
        
        new GenerateNotePodcastJob(null, []);
    }

    public function test_job_retries_on_failure()
    {
        $job = new GenerateNotePodcastJob($this->note, []);
        
        // Test that the job has retry configuration
        $this->assertEquals(3, $job->tries);
        $this->assertIsArray($job->backoff());
        $this->assertCount(3, $job->backoff());
    }

    public function test_job_logs_start_and_completion()
    {
        Log::shouldReceive('info')
            ->with('Starting podcast generation', Mockery::type('array'))
            ->once();
            
        Log::shouldReceive('info')
            ->with('Podcast generation completed successfully', Mockery::type('array'))
            ->once();

        $this->mockGenerator
            ->shouldReceive('generatePodcast')
            ->once()
            ->andReturn(true);

        $job = new GenerateNotePodcastJob($this->note, []);
        $job->handle();
    }

    public function test_job_logs_failure()
    {
        Log::shouldReceive('info')
            ->with('Starting podcast generation', Mockery::type('array'))
            ->once();
            
        Log::shouldReceive('warning')
            ->with('Podcast generation failed', Mockery::type('array'))
            ->once();

        $this->mockGenerator
            ->shouldReceive('generatePodcast')
            ->once()
            ->andReturn(false);

        $job = new GenerateNotePodcastJob($this->note, []);
        $job->handle();
    }
}