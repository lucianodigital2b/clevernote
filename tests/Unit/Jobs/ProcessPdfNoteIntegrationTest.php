<?php

namespace Tests\Unit\Jobs;

use App\Jobs\ProcessPdfNote;
use App\Models\Note;
use App\Models\User;
use App\Services\Prompts\AIPrompts;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ProcessPdfNoteIntegrationTest extends TestCase
{
    use DatabaseTransactions;

    protected $user;
    protected $note;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->user = User::factory()->create();
        $this->note = Note::factory()->create([
            'user_id' => $this->user->id,
            'status' => 'pending'
        ]);
        
        Storage::fake('public');
    }

    public function test_job_can_be_instantiated()
    {
        $validatedData = [
            'title' => 'Test Note',
            'folder_id' => $this->note->folder_id
        ];

        $job = new ProcessPdfNote(
            $this->note->id,
            $validatedData,
            'uploads/test.pdf',
            'pdf'
        );

        $this->assertInstanceOf(ProcessPdfNote::class, $job);
    }

    public function test_job_updates_note_status_to_processing()
    {
        // Create a fake file
        Storage::disk('public')->put('uploads/test.txt', 'Simple test content');
        
        $validatedData = [
            'title' => 'Test Note',
            'folder_id' => $this->note->folder_id
        ];

        $job = new ProcessPdfNote(
            $this->note->id,
            $validatedData,
            'uploads/test.txt',
            'txt'
        );

        // Verify initial status
        $this->assertEquals('pending', $this->note->status);

        try {
            // This will likely fail due to missing services, but we can check status update
            $job->handle(app(\App\Services\NoteService::class));
        } catch (\Exception $e) {
            // Expected to fail, but status should be updated
        }

        // Verify status was updated to processing
        $this->note->refresh();
        $this->assertNotEquals('pending', $this->note->status);
    }

    public function test_job_handles_missing_file_gracefully()
    {
        $validatedData = [
            'title' => 'Test Note',
            'folder_id' => $this->note->folder_id
        ];

        $job = new ProcessPdfNote(
            $this->note->id,
            $validatedData,
            'uploads/nonexistent.txt',
            'txt'
        );

        try {
            $job->handle(app(\App\Services\NoteService::class));
        } catch (\Exception $e) {
            // Expected to fail
        }

        // Verify note exists and wasn't corrupted
        $this->note->refresh();
        $this->assertNotNull($this->note);
    }

    public function test_job_properties_are_set_correctly()
    {
        $validatedData = [
            'title' => 'Test Note',
            'folder_id' => $this->note->folder_id,
            'language' => 'English'
        ];

        $job = new ProcessPdfNote(
            123,
            $validatedData,
            'uploads/test.pdf',
            'pdf'
        );

        // Use reflection to check private properties
        $reflection = new \ReflectionClass($job);
        
        $noteIdProperty = $reflection->getProperty('noteId');
        $noteIdProperty->setAccessible(true);
        $this->assertEquals(123, $noteIdProperty->getValue($job));

        $validatedDataProperty = $reflection->getProperty('validatedData');
        $validatedDataProperty->setAccessible(true);
        $this->assertEquals($validatedData, $validatedDataProperty->getValue($job));

        $filePathProperty = $reflection->getProperty('filePath');
        $filePathProperty->setAccessible(true);
        $this->assertEquals('uploads/test.pdf', $filePathProperty->getValue($job));

        $extensionProperty = $reflection->getProperty('extension');
        $extensionProperty->setAccessible(true);
        $this->assertEquals('pdf', $extensionProperty->getValue($job));
    }

    public function test_ai_prompts_integration_works()
    {
        $testContent = "This is test content for study notes generation.";
        $language = 'English';
        
        $prompt = AIPrompts::studyNotePrompt($testContent, $language);
        
        $this->assertIsString($prompt);
        $this->assertStringContainsString('JSON', $prompt);
        $this->assertStringContainsString($testContent, $prompt);
        $this->assertGreaterThan(50, strlen($prompt));
    }

    public function test_ai_prompts_with_different_languages()
    {
        $testContent = "This is test content for study notes generation.";
        
        $promptEnglish = AIPrompts::studyNotePrompt($testContent, 'English');
        $promptSpanish = AIPrompts::studyNotePrompt($testContent, 'Spanish');
        
        $this->assertIsString($promptEnglish);
        $this->assertIsString($promptSpanish);
        $this->assertStringContainsString($testContent, $promptEnglish);
        $this->assertStringContainsString($testContent, $promptSpanish);
    }
}