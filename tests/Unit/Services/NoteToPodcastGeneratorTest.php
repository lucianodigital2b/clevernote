<?php

namespace Tests\Unit\Services;

use App\Contracts\TextToSpeechServiceInterface;
use App\Models\Note;
use App\Models\User;
use App\Services\NoteToPodcastGenerator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Tests\TestCase;

class NoteToPodcastGeneratorTest extends TestCase
{
    use RefreshDatabase;

    protected NoteToPodcastGenerator $generator;
    protected $mockTtsService;
    protected User $user;
    protected Note $note;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->mockTtsService = Mockery::mock(TextToSpeechServiceInterface::class);
        $this->generator = new NoteToPodcastGenerator($this->mockTtsService);
        
        $this->user = User::factory()->create();
        $this->note = Note::factory()->create([
            'user_id' => $this->user->id,
            'title' => 'Test Note',
            'content' => 'This is a test note content for podcast generation.',
        ]);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    public function test_generate_podcast_success()
    {
        $this->mockTtsService
            ->shouldReceive('convertTextToSpeech')
            ->once()
            ->with(
                Mockery::type('string'),
                Mockery::type('array')
            )
            ->andReturn([
                'file_path' => 'podcasts/test-file.mp3',
                'file_size' => 1024,
                'duration' => 30.5,
                'metadata' => [
                    'voice_id' => 'Joanna',
                    'language_code' => 'en-US',
                ],
            ]);

        $result = $this->generator->generatePodcast($this->note);

        $this->assertTrue($result);
        
        // Refresh the note to get updated data
        $this->note->refresh();
        
        $this->assertEquals('completed', $this->note->podcast_status);
        $this->assertEquals('podcasts/test-file.mp3', $this->note->podcast_file_path);
        $this->assertEquals(1024, $this->note->podcast_file_size);
        $this->assertEquals(30.5, $this->note->podcast_duration);
        $this->assertNotNull($this->note->podcast_generated_at);
        $this->assertIsArray($this->note->podcast_metadata);
    }

    public function test_generate_podcast_with_options()
    {
        $options = [
            'voice_id' => 'Matthew',
            'include_intro' => true,
            'include_conclusion' => true,
            'use_ssml' => true,
        ];

        $this->mockTtsService
            ->shouldReceive('convertTextToSpeech')
            ->once()
            ->with(
                Mockery::on(function ($text) {
                    return str_contains($text, 'Welcome to your podcast') &&
                           str_contains($text, 'Thank you for listening');
                }),
                Mockery::on(function ($ttsOptions) {
                    return $ttsOptions['voice_id'] === 'Matthew' &&
                           $ttsOptions['use_ssml'] === true;
                })
            )
            ->andReturn([
                'file_path' => 'podcasts/test-file.mp3',
                'file_size' => 2048,
                'duration' => 45.0,
                'metadata' => [
                    'voice_id' => 'Matthew',
                    'language_code' => 'en-US',
                ],
            ]);

        $result = $this->generator->generatePodcast($this->note, $options);

        $this->assertTrue($result);
        
        $this->note->refresh();
        $this->assertEquals('completed', $this->note->podcast_status);
        $this->assertEquals('Matthew', $this->note->podcast_metadata['voice_id']);
    }

    public function test_generate_podcast_handles_long_content()
    {
        // Create a note with very long content
        $longContent = str_repeat('This is a very long sentence that will exceed the maximum text length limit. ', 200);
        $this->note->update(['content' => $longContent]);

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

        $result = $this->generator->generatePodcast($this->note);

        $this->assertTrue($result);
        
        $this->note->refresh();
        $this->assertEquals('completed', $this->note->podcast_status);
        $this->assertGreaterThan(1024, $this->note->podcast_file_size); // Combined size
        $this->assertGreaterThan(30.0, $this->note->podcast_duration); // Combined duration
    }

    public function test_generate_podcast_handles_tts_failure()
    {
        $this->mockTtsService
            ->shouldReceive('convertTextToSpeech')
            ->once()
            ->andThrow(new \Exception('TTS service error'));

        $result = $this->generator->generatePodcast($this->note);

        $this->assertFalse($result);
        
        $this->note->refresh();
        $this->assertEquals('failed', $this->note->podcast_status);
        $this->assertStringContains('TTS service error', $this->note->podcast_failure_reason);
    }

    public function test_prepare_content_with_intro_and_conclusion()
    {
        $options = [
            'include_intro' => true,
            'include_conclusion' => true,
        ];

        $reflection = new \ReflectionClass($this->generator);
        $method = $reflection->getMethod('prepareContent');
        $method->setAccessible(true);

        $result = $method->invoke($this->generator, $this->note, $options);

        $this->assertStringContains('Welcome to your podcast', $result);
        $this->assertStringContains($this->note->title, $result);
        $this->assertStringContains($this->note->content, $result);
        $this->assertStringContains('Thank you for listening', $result);
    }

    public function test_prepare_content_without_intro_and_conclusion()
    {
        $options = [
            'include_intro' => false,
            'include_conclusion' => false,
        ];

        $reflection = new \ReflectionClass($this->generator);
        $method = $reflection->getMethod('prepareContent');
        $method->setAccessible(true);

        $result = $method->invoke($this->generator, $this->note, $options);

        $this->assertStringNotContains('Welcome to your podcast', $result);
        $this->assertStringNotContains('Thank you for listening', $result);
        $this->assertStringContains($this->note->content, $result);
    }

    public function test_prepare_content_with_ssml()
    {
        $options = ['use_ssml' => true];

        $reflection = new \ReflectionClass($this->generator);
        $method = $reflection->getMethod('prepareContent');
        $method->setAccessible(true);

        $result = $method->invoke($this->generator, $this->note, $options);

        $this->assertStringContains('<speak>', $result);
        $this->assertStringContains('</speak>', $result);
        $this->assertStringContains('<break time="1s"/>', $result);
    }

    public function test_clean_html_content()
    {
        $htmlContent = '<h1>Title</h1><p>This is <strong>bold</strong> text with <a href="#">links</a>.</p>';
        $this->note->update(['content' => $htmlContent]);

        $reflection = new \ReflectionClass($this->generator);
        $method = $reflection->getMethod('cleanHtmlContent');
        $method->setAccessible(true);

        $result = $method->invoke($this->generator, $htmlContent);

        $this->assertEquals('Title. This is bold text with links.', $result);
        $this->assertStringNotContains('<', $result);
        $this->assertStringNotContains('>', $result);
    }

    public function test_chunk_content()
    {
        $longText = str_repeat('This is a sentence. ', 500); // Very long text
        $maxLength = 1000;

        $reflection = new \ReflectionClass($this->generator);
        $method = $reflection->getMethod('chunkContent');
        $method->setAccessible(true);

        $chunks = $method->invoke($this->generator, $longText, $maxLength);

        $this->assertIsArray($chunks);
        $this->assertGreaterThan(1, count($chunks));
        
        foreach ($chunks as $chunk) {
            $this->assertLessThanOrEqual($maxLength, strlen($chunk));
        }
    }

    public function test_estimate_total_duration()
    {
        $durations = [30.5, 25.0, 40.2];

        $reflection = new \ReflectionClass($this->generator);
        $method = $reflection->getMethod('estimateTotalDuration');
        $method->setAccessible(true);

        $total = $method->invoke($this->generator, $durations);

        $this->assertEquals(95.7, $total);
    }
}