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
        
        // Mock the config using Laravel's config helper
        config([
            'services.aws.polly' => [
                'access_key_id' => 'test-key',
                'secret_access_key' => 'test-secret',
                'region' => 'us-east-1',
            ]
        ]);
        
        $this->service = new AmazonPollyService();
        
        // Use reflection to inject the mock client
        $reflection = new \ReflectionClass($this->service);
        $clientProperty = $reflection->getProperty('pollyClient');
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
        
        // Mock the audio stream
        $mockStream = Mockery::mock();
        $mockStream->shouldReceive('getContents')
            ->andReturn('fake-audio-data');
        
        $mockResult = Mockery::mock(Result::class);
        $mockResult->shouldReceive('offsetGet')
            ->with('AudioStream')
            ->andReturn($mockStream);
        
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
        $this->assertArrayHasKey('format', $result);
        $this->assertArrayHasKey('voice_id', $result);
        $this->assertArrayHasKey('language_code', $result);
        $this->assertArrayHasKey('engine', $result);
        $this->assertArrayHasKey('service', $result);
        
        $this->assertStringContainsString('podcasts/', $result['file_path']);
        $this->assertStringEndsWith('.mp3', $result['file_path']);
        $this->assertEquals(15, $result['file_size']); // Length of 'fake-audio-data'
        $this->assertIsInt($result['duration']);
        $this->assertIsArray($result['metadata']);
        $this->assertEquals('Matthew', $result['voice_id']);
        $this->assertEquals('en-US', $result['language_code']);
        $this->assertEquals('standard', $result['engine']);
        $this->assertEquals('amazon_polly', $result['service']);
    }

    public function test_convert_text_to_speech_with_ssml()
    {
        Storage::fake('r2');
        
        $text = '<speak>Hello, <break time="1s"/> this is a test.</speak>';
        $options = [];
        
        // Mock the audio stream
        $mockStream = Mockery::mock();
        $mockStream->shouldReceive('getContents')
            ->andReturn('fake-audio-data');
        
        $mockResult = Mockery::mock(Result::class);
        $mockResult->shouldReceive('offsetGet')
            ->with('AudioStream')
            ->andReturn($mockStream);
        
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
        $mockResult->shouldReceive('offsetGet')
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
        $mockResult->shouldReceive('offsetGet')
            ->with('Voices')
            ->andReturn([
                [
                    'Id' => 'Joanna',
                    'Name' => 'Joanna',
                    'Gender' => 'Female',
                    'LanguageCode' => 'en-US',
                    'LanguageName' => 'US English',
                    'SupportedEngines' => ['standard', 'neural'],
                    'AdditionalLanguageCodes' => [],
                ],
                [
                    'Id' => 'Amy',
                    'Name' => 'Amy',
                    'Gender' => 'Female',
                    'LanguageCode' => 'en-GB',
                    'LanguageName' => 'British English',
                    'SupportedEngines' => ['standard', 'neural'],
                    'AdditionalLanguageCodes' => [],
                ],
                [
                    'Id' => 'Matthew',
                    'Name' => 'Matthew',
                    'Gender' => 'Male',
                    'LanguageCode' => 'en-US', // Duplicate should be filtered
                    'LanguageName' => 'US English',
                    'SupportedEngines' => ['standard', 'neural'],
                    'AdditionalLanguageCodes' => [],
                ],
            ]);
        
        $this->mockPollyClient
            ->shouldReceive('describeVoices')
            ->once()
            ->andReturn($mockResult);
        
        $languages = $this->service->getSupportedLanguages();
        
        $this->assertIsArray($languages);
        $this->assertCount(2, $languages); // Duplicates should be removed
        $this->assertArrayHasKey('en-US', $languages);
        $this->assertArrayHasKey('en-GB', $languages);
        $this->assertEquals('US English', $languages['en-US']);
        $this->assertEquals('British English', $languages['en-GB']);
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
            'voice_id' => '', // Empty voice_id should be invalid
        ];
        
        $result = $this->service->validateOptions($options);
        
        $this->assertFalse($result);
    }

    public function test_validate_options_invalid_engine()
    {
        $options = [
            'engine' => 'invalid_engine',
        ];
        
        $result = $this->service->validateOptions($options);
        
        $this->assertFalse($result);
    }

    public function test_get_max_text_length()
    {
        $maxLength = $this->service->getMaxTextLength();
        
        $this->assertEquals(3000, $maxLength);
    }

    public function test_get_service_name()
    {
        $serviceName = $this->service->getServiceName();

        $this->assertEquals('amazon_polly', $serviceName);
    }

    public function test_estimate_duration()
    {
        $text = 'This is a test sentence with approximately ten words in it.';
        $options = [];
        
        $reflection = new \ReflectionClass($this->service);
        $method = $reflection->getMethod('estimateAudioDuration');
        $method->setAccessible(true);
        
        $duration = $method->invoke($this->service, $text, $options);
        
        $this->assertIsInt($duration);
        $this->assertGreaterThan(0, $duration);
        $this->assertLessThan(10, $duration); // Should be less than 10 seconds for this short text
    }


}