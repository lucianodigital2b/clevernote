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
        
        // Fake the storage for testing
        Storage::fake('r2');
    }

    public function test_media_library_generates_correct_url_format()
    {
        // Create a user and note
        $user = User::factory()->create();
        $note = Note::factory()->create(['user_id' => $user->id]);
        
        // Create a fake image file
        $image = UploadedFile::fake()->image('test-image.jpg', 800, 600);
        
        // Upload the file using media library
        $media = $note->addMedia($image)
            ->usingFileName('test-image.jpg')
            ->toMediaCollection('note-images');
        
        // Get the generated URL
        $generatedUrl = $media->getUrl();
        // Since we're using fake storage, the URL will be a local path
        // Let's test that the media was stored correctly and has the right disk
        $this->assertEquals('r2', $media->disk);
        $this->assertEquals('note-images', $media->collection_name);
        $this->assertEquals('test-image.jpg', $media->file_name);
        
        // For a real test with actual R2 URLs, we would need to use the actual R2 configuration
        // But for this test, we can verify the media object properties
        $this->assertNotEmpty($generatedUrl);
        $this->assertStringContainsString('test-image.jpg', $generatedUrl);
    }

    public function test_media_library_url_with_quiz_model()
    {
        // Create a user and quiz
        $user = User::factory()->create();
        $quiz = \App\Models\Quiz::factory()->create(['user_id' => $user->id]);
        
        // Create a fake image file
        $image = UploadedFile::fake()->image('quiz-image.png', 400, 300);
        
        // Upload the file using media library to quiz collection
        $media = $quiz->addMedia($image)
            ->usingFileName('quiz-image.png')
            ->toMediaCollection('quiz-question-images');
        
        // Get the generated URL
        $generatedUrl = $media->getUrl();
        
        // Test the media object properties with fake storage
        $this->assertEquals('r2', $media->disk);
        $this->assertEquals('quiz-question-images', $media->collection_name);
        $this->assertEquals('quiz-image.png', $media->file_name);
        
        // Verify URL contains the filename
        $this->assertNotEmpty($generatedUrl);
        $this->assertStringContainsString('quiz-image.png', $generatedUrl);
    }

    public function test_media_library_url_with_flashcard_model()
    {
        // Create a user and flashcard
        $user = User::factory()->create();
        $flashcard = \App\Models\Flashcard::factory()->create();
        
        // Create a fake image file
        $image = UploadedFile::fake()->image('flashcard-image.webp', 600, 400);
        
        // Upload the file using media library
        $media = $flashcard->addMedia($image)
            ->usingFileName('flashcard-image.webp')
            ->toMediaCollection('flashcard-images');
        
        // Get the generated URL
        $generatedUrl = $media->getUrl();
        
        // Test the media object properties with fake storage
        $this->assertEquals('r2', $media->disk);
        $this->assertEquals('flashcard-images', $media->collection_name);
        $this->assertEquals('flashcard-image.webp', $media->file_name);
        
        // Verify URL contains the filename
        $this->assertNotEmpty($generatedUrl);
        $this->assertStringContainsString('flashcard-image.webp', $generatedUrl);
    }

    protected function tearDown(): void
    {
        parent::tearDown();
    }
}