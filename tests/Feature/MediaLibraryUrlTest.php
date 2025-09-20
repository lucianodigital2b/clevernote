<?php

namespace Tests\Feature;

use App\Models\Note;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class MediaLibraryUrlTest extends TestCase
{

    protected function setUp(): void
    {
        parent::setUp();
        
        // Use the actual R2 disk for this test
        // We don't fake it because we want to test the real URL generation
    }

    public function test_media_library_generates_correct_url_format()
    {
        // Create a user and note
        $user = User::factory()->create();
        $note = Note::factory()->create(['user_id' => $user->id]);
        
        // Create a fake image file
        $image = UploadedFile::fake()->image('test-image.jpg', 800, 600);
        
        // Upload the file using media library
        $media = $note->addMediaFromRequest('file')
            ->usingFileName('test-image.jpg')
            ->toMediaCollection('note-images');
        
        // Get the generated URL
        $generatedUrl = $media->getUrl();
        
        // Assert the URL format is correct
        $this->assertStringStartsWith('https://media.getclevernote.app/', $generatedUrl);
        
        // Assert the URL does NOT contain the bucket name as a subdomain or path prefix
        $this->assertStringNotContainsString('clevernote.media.getclevernote.app', $generatedUrl);
        $this->assertStringNotContainsString('/clevernote/', $generatedUrl);
        
        // Assert the URL contains the expected path structure (ID/filename)
        $this->assertMatchesRegularExpression('/https:\/\/media\.getclevernote\.app\/\d+\/[a-zA-Z0-9]+\.jpg/', $generatedUrl);
        
        // Log the generated URL for debugging
        $this->artisan('log:info', ['message' => "Generated URL: {$generatedUrl}"]);
        
        // Additional assertions about the media object
        $this->assertEquals('r2', $media->disk);
        $this->assertEquals('note-images', $media->collection_name);
        $this->assertEquals('test-image.jpg', $media->file_name);
    }

    public function test_media_library_url_with_quiz_model()
    {
        // Create a user and quiz
        $user = User::factory()->create();
        $quiz = \App\Models\Quiz::factory()->create(['user_id' => $user->id]);
        
        // Create a fake image file
        $image = UploadedFile::fake()->image('quiz-image.png', 400, 300);
        
        // Upload the file using media library to quiz collection
        $media = $quiz->addMediaFromRequest('file')
            ->usingFileName('quiz-image.png')
            ->toMediaCollection('quiz-question-images');
        
        // Get the generated URL
        $generatedUrl = $media->getUrl();
        
        // Assert the URL format is correct
        $this->assertStringStartsWith('https://media.getclevernote.app/', $generatedUrl);
        
        // Assert the URL does NOT contain the bucket name
        $this->assertStringNotContainsString('clevernote.media.getclevernote.app', $generatedUrl);
        $this->assertStringNotContainsString('/clevernote/', $generatedUrl);
        
        // Assert the URL contains the expected path structure
        $this->assertMatchesRegularExpression('/https:\/\/media\.getclevernote\.app\/\d+\/[a-zA-Z0-9]+\.png/', $generatedUrl);
        
        // Additional assertions
        $this->assertEquals('r2', $media->disk);
        $this->assertEquals('quiz-question-images', $media->collection_name);
    }

    public function test_media_library_url_with_flashcard_model()
    {
        // Create a user and flashcard
        $user = User::factory()->create();
        $flashcard = \App\Models\Flashcard::factory()->create(['user_id' => $user->id]);
        
        // Create a fake image file
        $image = UploadedFile::fake()->image('flashcard-image.webp', 600, 400);
        
        // Upload the file using media library
        $media = $flashcard->addMediaFromRequest('file')
            ->usingFileName('flashcard-image.webp')
            ->toMediaCollection('flashcard-images');
        
        // Get the generated URL
        $generatedUrl = $media->getUrl();
        
        // Assert the URL format is correct
        $this->assertStringStartsWith('https://media.getclevernote.app/', $generatedUrl);
        
        // Assert no bucket name in URL
        $this->assertStringNotContainsString('clevernote.media.getclevernote.app', $generatedUrl);
        $this->assertStringNotContainsString('/clevernote/', $generatedUrl);
        
        // Assert the URL structure
        $this->assertMatchesRegularExpression('/https:\/\/media\.getclevernote\.app\/\d+\/[a-zA-Z0-9]+\.webp/', $generatedUrl);
        
        // Log for debugging
        echo "\nGenerated Flashcard URL: {$generatedUrl}\n";
    }

    protected function tearDown(): void
    {
        parent::tearDown();
    }
}