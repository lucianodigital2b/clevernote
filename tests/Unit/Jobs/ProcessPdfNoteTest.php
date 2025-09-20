<?php

namespace Tests\Unit\Jobs;

use App\Jobs\ProcessPdfNote;
use App\Models\Note;
use App\Models\User;
use App\Services\NoteService;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Storage;
use Mockery;
use Tests\TestCase;

class ProcessPdfNoteTest extends TestCase
{
    use DatabaseTransactions;

    protected $noteService;
    protected $user;
    protected $note;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->noteService = Mockery::mock(NoteService::class);
        $this->app->instance(NoteService::class, $this->noteService);
        
        $this->user = User::factory()->create();
        $this->note = Note::factory()->create([
            'user_id' => $this->user->id,
            'status' => 'processing'
        ]);
        
        Storage::fake('public');
    }

    public function test_processes_pdf_file_successfully()
    {
        // Create a fake PDF file
        Storage::disk('public')->put('uploads/test.pdf', 'fake pdf content');
        
        $validatedData = [
            'title' => 'Test PDF Note',
            'folder_id' => $this->note->folder_id
        ];
        
        // Mock the NoteService methods
        $this->noteService->shouldReceive('extractTextFromPdf')
            ->once()
            ->with(storage_path('app/public/uploads/test.pdf'))
            ->andReturn('Extracted PDF text content');
            
        $this->noteService->shouldReceive('updateNoteFromAI')
            ->once()
            ->with($this->note->id, Mockery::type('array'))
            ->andReturn(true);

        // Create and handle the job
        $job = new ProcessPdfNote(
            $this->note->id,
            $validatedData,
            'uploads/test.pdf',
            'pdf'
        );

        // Execute the job
        $job->handle($this->noteService);

        // Verify the file was cleaned up
        Storage::disk('public')->assertMissing('uploads/test.pdf');
    }

    public function test_processes_text_file_successfully()
    {
        // Create a fake text file
        Storage::disk('public')->put('uploads/test.txt', 'This is test text content');
        
        $validatedData = [
            'title' => 'Test Text Note',
            'folder_id' => $this->note->folder_id
        ];
        
        // Mock the NoteService methods
        $this->noteService->shouldReceive('extractTextFromTextFile')
            ->once()
            ->with('uploads/test.txt')
            ->andReturn('Extracted text content');
            
        $this->noteService->shouldReceive('updateNoteFromAI')
            ->once()
            ->with($this->note->id, Mockery::type('array'))
            ->andThrow(new \Exception('AI processing failed'));

        // Create and handle the job
        $job = new ProcessPdfNote(
            $this->note->id,
            $validatedData,
            'uploads/test.txt',
            'txt'
        );

        // Execute the job
        $job->handle($this->noteService);

        // Verify the file was cleaned up
        Storage::disk('public')->assertMissing('uploads/test.txt');
    }

    public function test_processes_docx_file_successfully()
    {
        // Create a fake DOCX file
        Storage::disk('public')->put('uploads/test.docx', 'fake docx content');
        
        $validatedData = [
            'title' => 'Test DOCX Note',
            'folder_id' => $this->note->folder_id
        ];
        
        // Mock the NoteService methods
        $this->noteService->shouldReceive('extractTextFromWord')
            ->once()
            ->with(storage_path('app/public/uploads/test.docx'))
            ->andReturn('Extracted DOCX text content');
            
        $this->noteService->shouldReceive('updateNoteFromAI')
            ->once()
            ->with($this->note->id, Mockery::type('array'))
            ->andReturn(true);

        // Create and handle the job
        $job = new ProcessPdfNote(
            $this->note->id,
            $validatedData,
            'uploads/test.docx',
            'docx'
        );

        // Execute the job
        $job->handle($this->noteService);

        // Verify the file was cleaned up
        Storage::disk('public')->assertMissing('uploads/test.docx');
    }

    public function test_processes_pptx_file_successfully()
    {
        // Create a fake PPTX file
        Storage::disk('public')->put('uploads/test.pptx', 'fake pptx content');
        
        $validatedData = [
            'title' => 'Test PPTX Note',
            'folder_id' => $this->note->folder_id
        ];
        
        // Mock the NoteService methods
        $this->noteService->shouldReceive('extractTextFromPowerPoint')
            ->once()
            ->with(storage_path('app/public/uploads/test.pptx'))
            ->andReturn('Extracted PPTX text content');
            
        $this->noteService->shouldReceive('updateNoteFromAI')
            ->once()
            ->with($this->note->id, Mockery::type('array'))
            ->andReturn(true);

        // Create and handle the job
        $job = new ProcessPdfNote(
            $this->note->id,
            $validatedData,
            'uploads/test.pptx',
            'pptx'
        );

        // Execute the job
        $job->handle($this->noteService);

        // Verify the file was cleaned up
        Storage::disk('public')->assertMissing('uploads/test.pptx');
    }

    public function test_handles_pdf_extraction_failure()
    {
        // Create a fake PDF file
        Storage::disk('public')->put('uploads/test.pdf', 'fake pdf content');
        
        $validatedData = [
            'title' => 'Test PDF Note',
            'folder_id' => $this->note->folder_id
        ];
        
        // Mock the NoteService to throw an exception
        $this->noteService->shouldReceive('extractTextFromPdf')
            ->once()
            ->andThrow(new \Exception('PDF extraction failed'));

        // Create the job
        $job = new ProcessPdfNote(
            $this->note->id,
            $validatedData,
            'uploads/test.pdf',
            'pdf'
        );

        // Execute the job and expect it to handle the exception
        $job->handle($this->noteService);

        // Verify the note status was updated to failed
        $this->note->refresh();
        $this->assertEquals('failed', $this->note->status);
        $this->assertStringContainsString('PDF extraction failed', $this->note->failure_reason);

        // Verify the file was cleaned up
        Storage::disk('public')->assertMissing('uploads/test.pdf');
    }

    public function test_handles_ai_processing_failure()
    {
        // Create a fake text file
        Storage::disk('public')->put('uploads/test.txt', 'This is test text content');
        
        $validatedData = [
            'title' => 'Test Text Note',
            'folder_id' => $this->note->folder_id
        ];
        
        // Mock the NoteService methods
        $this->noteService->shouldReceive('extractTextFromTextFile')
            ->once()
            ->with('uploads/test.txt')
            ->andReturn('Extracted text content');
            
        $this->noteService->shouldReceive('updateNoteFromAI')
            ->once()
            ->with($this->note->id, Mockery::type('array'))
            ->andReturn(true);

        // Create the job
        $job = new ProcessPdfNote(
            $this->note->id,
            $validatedData,
            'uploads/test.txt',
            'txt'
        );

        // Execute the job and expect it to handle the exception
        $job->handle($this->noteService);

        // Verify the note status was updated to failed
        $this->note->refresh();
        $this->assertEquals('failed', $this->note->status);
        $this->assertStringContainsString('AI processing failed', $this->note->failure_reason);

        // Verify the file was cleaned up
        Storage::disk('public')->assertMissing('uploads/test.txt');
    }

    public function test_builds_system_prompt_correctly()
    {
        $job = new ProcessPdfNote(1, [], 'test.pdf', 'pdf');
        
        // Use reflection to access the private method
        $reflection = new \ReflectionClass($job);
        $method = $reflection->getMethod('buildSystemPrompt');
        $method->setAccessible(true);
        
        $prompt = $method->invoke($job);
        
        $this->assertStringContainsString('comprehensive study note', $prompt);
        $this->assertStringContainsString('JSON format', $prompt);
        $this->assertStringContainsString('title', $prompt);
        $this->assertStringContainsString('content', $prompt);
        $this->assertStringContainsString('summary', $prompt);
    }

    public function test_cleans_up_file_on_completion()
    {
        // Create a fake file
        Storage::disk('public')->put('uploads/cleanup-test.txt', 'test content');
        
        $validatedData = [
            'title' => 'Cleanup Test',
            'folder_id' => $this->note->folder_id
        ];
        
        // Mock the NoteService methods
        $this->noteService->shouldReceive('extractTextFromTextFile')
            ->once()
            ->with('uploads/cleanup-test.txt')
            ->andReturn('test content');
            
        $this->noteService->shouldReceive('updateNoteFromAI')
            ->once()
            ->andReturn(true);

        $job = new ProcessPdfNote(
            $this->note->id,
            $validatedData,
            'uploads/cleanup-test.txt',
            'txt'
        );

        // Verify file exists before processing
        Storage::disk('public')->assertExists('uploads/cleanup-test.txt');

        // Execute the job
        $job->handle($this->noteService);

        // Verify file was cleaned up
        Storage::disk('public')->assertMissing('uploads/cleanup-test.txt');
    }

    public function test_updates_note_status_to_completed()
    {
        // Create a fake text file
        Storage::disk('public')->put('uploads/status-test.txt', 'test content');
        
        $validatedData = [
            'title' => 'Status Test',
            'folder_id' => $this->note->folder_id
        ];
        
        // Mock the NoteService methods
        $this->noteService->shouldReceive('extractTextFromTextFile')
            ->once()
            ->with('uploads/status-test.txt')
            ->andReturn('test content');
            
        $this->noteService->shouldReceive('updateNoteFromAI')
            ->once()
            ->andReturn(true);

        $job = new ProcessPdfNote(
            $this->note->id,
            $validatedData,
            'uploads/status-test.txt',
            'txt'
        );

        // Verify initial status
        $this->assertEquals('processing', $this->note->status);

        // Execute the job
        $job->handle($this->noteService);

        // Verify status was updated
        $this->note->refresh();
        $this->assertEquals('completed', $this->note->status);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }
}