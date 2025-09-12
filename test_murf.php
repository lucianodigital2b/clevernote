<?php

require_once __DIR__ . '/vendor/autoload.php';

use App\Services\TextToSpeech\MurfService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

// Bootstrap Laravel application
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

try {
    echo "Testing Murf Service Implementation...\n\n";
    
    // Test configuration
    $config = [
        'api_key' => env('MURF_API_KEY')
    ];
    
    $defaults = [
        'voice_id' => 'en-US-natalie',
        'language_code' => 'en-US',
        'output_format' => 'mp3'
    ];
    
    if (empty($config['api_key'])) {
        echo "❌ MURF_API_KEY not found in environment variables\n";
        echo "Please add MURF_API_KEY to your .env file\n";
        exit(1);
    }
    
    echo "✅ Murf API key found\n";
    
    // Initialize service
    $murfService = new MurfService($config, $defaults);
    echo "✅ MurfService initialized successfully\n";
    
    // Test service name
    $serviceName = $murfService->getServiceName();
    echo "✅ Service name: {$serviceName}\n";
    
    // Test max text length
    $maxLength = $murfService->getMaxTextLength();
    echo "✅ Max text length: {$maxLength} characters\n";
    
    // Test option validation
    $validOptions = [
        'voice_id' => 'en-US-natalie',
        'language_code' => 'en-US',
        'output_format' => 'mp3',
        'rate' => 0,
        'pitch' => 0
    ];
    
    $isValid = $murfService->validateOptions($validOptions);
    echo $isValid ? "✅ Option validation passed\n" : "❌ Option validation failed\n";
    
    // Test invalid options
    $invalidOptions = [
        'output_format' => 'invalid_format',
        'rate' => 100 // Out of range
    ];
    
    $isInvalid = !$murfService->validateOptions($invalidOptions);
    echo $isInvalid ? "✅ Invalid option detection works\n" : "❌ Invalid option detection failed\n";
    
    // Test available voices (this will make an API call)
    echo "\nTesting API connectivity...\n";
    try {
        $voices = $murfService->getAvailableVoices();
        if (!empty($voices)) {
            echo "✅ Successfully fetched " . count($voices) . " voices from Murf API\n";
            echo "Sample voices:\n";
            foreach (array_slice($voices, 0, 3) as $voice) {
                echo "  - {$voice['name']} ({$voice['voice_id']}) - {$voice['language_name']}\n";
            }
        } else {
            echo "⚠️  No voices returned from API (using fallback voices)\n";
        }
    } catch (Exception $e) {
        echo "⚠️  API call failed (using fallback voices): " . $e->getMessage() . "\n";
    }
    
    // Test supported languages
    try {
        $languages = $murfService->getSupportedLanguages();
        if (!empty($languages)) {
            echo "✅ Successfully fetched " . count($languages) . " supported languages\n";
            echo "Sample languages:\n";
            $count = 0;
            foreach ($languages as $code => $name) {
                if ($count >= 3) break;
                echo "  - {$code}: {$name}\n";
                $count++;
            }
        }
    } catch (Exception $e) {
        echo "⚠️  Language fetch failed: " . $e->getMessage() . "\n";
    }
    
    // Test text-to-speech conversion (only if API key is valid)
    echo "\nTesting text-to-speech conversion...\n";
    $testText = "Hello, this is a test of the Murf text-to-speech service. The integration is working correctly.";
    
    try {
        $result = $murfService->convertTextToSpeech($testText, $validOptions);
        
        echo "✅ Text-to-speech conversion successful!\n";
        echo "  - File: {$result['file_path']}\n";
        echo "  - Size: {$result['file_size']} bytes\n";
        echo "  - Duration: {$result['duration']} seconds\n";
        echo "  - Voice: {$result['voice_id']}\n";
        echo "  - Language: {$result['language_code']}\n";
        echo "  - Service: {$result['service']}\n";
        echo "  - Engine: {$result['engine']}\n";
        
        // Check if file exists
        if (file_exists($result['full_path'])) {
            echo "✅ Audio file created successfully at: {$result['full_path']}\n";
            
            // Clean up test file
            if (Storage::disk('local')->exists($result['file_path'])) {
                Storage::disk('local')->delete($result['file_path']);
                echo "✅ Test file cleaned up\n";
            }
        } else {
            echo "❌ Audio file not found at expected location\n";
        }
        
    } catch (Exception $e) {
        echo "❌ Text-to-speech conversion failed: " . $e->getMessage() . "\n";
        echo "This might be due to:\n";
        echo "  - Invalid or expired API key\n";
        echo "  - Network connectivity issues\n";
        echo "  - Murf API service unavailable\n";
        echo "  - Insufficient API credits\n";
    }
    
    echo "\n" . str_repeat('=', 50) . "\n";
    echo "Murf Service Test Complete!\n";
    echo "\nTo use Murf as your TTS provider:\n";
    echo "1. Set TTS_DEFAULT=murf in your .env file\n";
    echo "2. Ensure MURF_API_KEY is set in your .env file\n";
    echo "3. The service is now ready to use in your application\n";
    
} catch (Exception $e) {
    echo "❌ Test failed with error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
    exit(1);
}