<?php

namespace Tests\Unit\Services\TextToSpeech;

use App\Services\TextToSpeech\AmazonPollyService;
use Aws\Polly\PollyClient;
use Aws\Result;
use Illuminate\Support\Facades\Storage;
use Mockery;
use Tests\TestCase;

class AmazonPollyServiceTest extends TestCase
{
    protected AmazonPollyService $service;
    protected $mockPollyClient;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->mockPollyClient = Mockery::mock(PollyClient::class);
        
        $config = [
            'access_key_id' => 'test-key',
            'secret_access_key' => 'test-secret',
            'region' => 'us-east-1',
        ];
        
        $defaults = [
            'voice_id' => 'Joanna',
            'language_code' => 'en-US',
            'engine' => 'standard',
            'output_format' => 'mp3',
        ];
        
        $this->service = new AmazonPollyService($config, $defaults);
        
        // Use reflection to inject the mock client
        $reflection = new \ReflectionClass($this->service);
        $clientProperty = $reflection->getProperty('client');
        $clientProperty->setAccessible(true);
        $clientProperty->setValue($this->service, $this->mockPollyClient);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    public function test_convert_text_to_speech_success()
    {
        Storage::fake('r2');
        
        $text = 'Hello, this is a test.';
        $options = ['voice_id' => 'Matthew'];
        
        $mockResult = Mockery::mock(Result::class);
        $mockResult->shouldReceive('get')
            ->with('AudioStream')
            ->andReturn('fake-audio-data');
        
        $this->mockPollyClient
            ->shouldReceive('synthesizeSpeech')
            ->once()
            ->with([
                'Text' => $text,
                'VoiceId' => 'Matthew',
                'LanguageCode' => 'en-US',
                'Engine' => 'standard',
                'OutputFormat' => 'mp3',
            ])
            ->andReturn($mockResult);
        
        $result = $this->service->convertTextToSpeech($text, $options);
        
        $this->assertIsArray($result);
        $this->assertArrayHasKey('file_path', $result);
        $this->assertArrayHasKey('file_size', $result);
        $this->assertArrayHasKey('duration', $result);
        $this->assertArrayHasKey('metadata', $result);
        
        $this->assertStringContains('podcasts/', $result['file_path']);
        $this->assertStringEndsWith('.mp3', $result['file_path']);
        $this->assertEquals(15, $result['file_size']); // Length of 'fake-audio-data'
        $this->assertIsFloat($result['duration']);
        $this->assertIsArray($result['metadata']);
    }

    public function test_convert_text_to_speech_with_ssml()
    {
        Storage::fake('r2');
        
        $text = '<speak>Hello, <break time="1s"/> this is a test.</speak>';
        $options = ['use_ssml' => true];
        
        $mockResult = Mockery::mock(Result::class);
        $mockResult->shouldReceive('get')
            ->with('AudioStream')
            ->andReturn('fake-audio-data');
        
        $this->mockPollyClient
            ->shouldReceive('synthesizeSpeech')
            ->once()
            ->with([
                'Text' => $text,
                'TextType' => 'ssml',
                'VoiceId' => 'Joanna',
                'LanguageCode' => 'en-US',
                'Engine' => 'standard',
                'OutputFormat' => 'mp3',
            ])
            ->andReturn($mockResult);
        
        $result = $this->service->convertTextToSpeech($text, $options);
        
        $this->assertIsArray($result);
        $this->assertArrayHasKey('file_path', $result);
    }

    public function test_get_available_voices()
    {
        $mockResult = Mockery::mock(Result::class);
        $mockResult->shouldReceive('get')
            ->with('Voices')
            ->andReturn([
                [
                    'Id' => 'Joanna',
                    'Name' => 'Joanna',
                    'Gender' => 'Female',
                    'LanguageCode' => 'en-US',
                    'LanguageName' => 'US English',
                    'SupportedEngines' => ['standard', 'neural'],
                ],
                [
                    'Id' => 'Matthew',
                    'Name' => 'Matthew',
                    'Gender' => 'Male',
                    'LanguageCode' => 'en-US',
                    'LanguageName' => 'US English',
                    'SupportedEngines' => ['standard', 'neural'],
                ],
            ]);
        
        $this->mockPollyClient
            ->shouldReceive('describeVoices')
            ->once()
            ->andReturn($mockResult);
        
        $voices = $this->service->getAvailableVoices();
        
        $this->assertIsArray($voices);
        $this->assertCount(2, $voices);
        $this->assertEquals('Joanna', $voices[0]['id']);
        $this->assertEquals('Female', $voices[0]['gender']);
        $this->assertEquals('en-US', $voices[0]['language_code']);
    }

    public function test_get_supported_languages()
    {
        $mockResult = Mockery::mock(Result::class);
        $mockResult->shouldReceive('get')
            ->with('Voices')
            ->andReturn([
                [
                    'LanguageCode' => 'en-US',
                    'LanguageName' => 'US English',
                ],
                [
                    'LanguageCode' => 'en-GB',
                    'LanguageName' => 'British English',
                ],
                [
                    'LanguageCode' => 'en-US', // Duplicate should be filtered
                    'LanguageName' => 'US English',
                ],
            ]);
        
        $this->mockPollyClient
            ->shouldReceive('describeVoices')
            ->once()
            ->andReturn($mockResult);
        
        $languages = $this->service->getSupportedLanguages();
        
        $this->assertIsArray($languages);
        $this->assertCount(2, $languages); // Duplicates should be removed
        $this->assertContains('en-US', array_column($languages, 'code'));
        $this->assertContains('en-GB', array_column($languages, 'code'));
    }

    public function test_validate_options_success()
    {
        $options = [
            'voice_id' => 'Joanna',
            'language_code' => 'en-US',
            'engine' => 'neural',
            'output_format' => 'mp3',
        ];
        
        $result = $this->service->validateOptions($options);
        
        $this->assertTrue($result);
    }

    public function test_validate_options_invalid_voice()
    {
        $options = [
            'voice_id' => 'InvalidVoice',
        ];
        
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Invalid voice_id: InvalidVoice');
        
        $this->service->validateOptions($options);
    }

    public function test_validate_options_invalid_engine()
    {
        $options = [
            'engine' => 'invalid_engine',
        ];
        
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Invalid engine: invalid_engine');
        
        $this->service->validateOptions($options);
    }

    public function test_get_max_text_length()
    {
        $maxLength = $this->service->getMaxTextLength();
        
        $this->assertEquals(3000, $maxLength);
    }

    public function test_get_service_name()
    {
        $serviceName = $this->service->getServiceName();
        
        $this->assertEquals('Amazon Polly', $serviceName);
    }

    public function test_estimate_duration()
    {
        $text = 'This is a test sentence with approximately ten words in it.';
        
        $duration = $this->service->estimateDuration($text);
        
        $this->assertIsFloat($duration);
        $this->assertGreaterThan(0, $duration);
        $this->assertLessThan(10, $duration); // Should be less than 10 seconds for this short text
    }

    public function test_prepare_text_removes_html()
    {
        $htmlText = '<p>This is <strong>bold</strong> text with <em>emphasis</em>.</p>';
        
        $reflection = new \ReflectionClass($this->service);
        $method = $reflection->getMethod('prepareText');
        $method->setAccessible(true);
        
        $result = $method->invoke($this->service, $htmlText, []);
        
        $this->assertEquals('This is bold text with emphasis.', $result);
    }

    public function test_prepare_text_with_ssml()
    {
        $text = 'Hello world';
        $options = ['use_ssml' => true];
        
        $reflection = new \ReflectionClass($this->service);
        $method = $reflection->getMethod('prepareText');
        $method->setAccessible(true);
        
        $result = $method->invoke($this->service, $text, $options);
        
        $this->assertStringContains('<speak>', $result);
        $this->assertStringContains('</speak>', $result);
        $this->assertStringContains('Hello world', $result);
    }
}