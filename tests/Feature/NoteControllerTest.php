<?php

namespace Tests\Feature;

use App\Models\Note;
use App\Models\User;
use App\Models\FlashcardSet;
use App\Services\NoteService;
use App\Services\DeepSeekService;
use App\Services\TranscriptionService;
use App\Services\YouTubeAudioExtractor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;
use Tests\TestCase;
use Mockery;
use Inertia\Testing\AssertableInertia as Assert;

class NoteControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');

        $this->noteService = Mockery::mock(NoteService::class);
        $this->transcriptionService = Mockery::mock(TranscriptionService::class);
        $this->deepseekService = Mockery::mock(DeepSeekService::class);
        $this->youtubeAudioExtractor = Mockery::mock(YouTubeAudioExtractor::class);

        $this->app->instance(NoteService::class, $this->noteService);
        $this->app->instance(TranscriptionService::class, $this->transcriptionService);
        $this->app->instance(DeepSeekService::class, $this->deepseekService);
        $this->app->instance(YouTubeAudioExtractor::class, $this->youtubeAudioExtractor);
    }

    public function test_index_displays_notes_list()
    {
        $user = User::factory()->create();
        $note = Note::factory()->create(['user_id' => $user->id]);

        $this->noteService->shouldReceive('getUserNotes')
            ->once()
            ->andReturn(collect([$note]));

        $response = $this->actingAs($user)
            ->get(route('notes.index'));

        $response->assertInertia(fn (Assert $page) => $page
            ->component('Notes/Index')
            ->has('notes')
            ->has('filters')
        );
    }

    public function test_create_displays_create_form()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->get(route('notes.create'));

        $response->assertInertia(fn (Assert $page) => $page
            ->component('Notes/Create')
            ->has('folders')
            ->has('tags')
        );
    }

    public function test_store_creates_note_from_pdf()
    {
        $user = User::factory()->create();
        $pdf = UploadedFile::fake()->create('document.pdf', 100);

        $this->noteService->shouldReceive('extractTextFromPdf')
            ->once()
            ->andReturn('PDF Content');

        $this->deepseekService->shouldReceive('createStudyNote')
            ->once()
            ->andReturn([
                'study_note' => [
                    'content' => 'Processed Content',
                    'title' => 'Generated Title',
                    'summary' => 'Generated Summary'
                ]
            ]);

        $this->noteService->shouldReceive('createNote')
            ->once()
            ->andReturn(Note::factory()->create(['user_id' => $user->id]));

        $response = $this->actingAs($user)
            ->post(route('notes.store'), [
                'pdf_file' => $pdf,
            ]);

        $response->assertRedirect(route('notes.edit', 1))
            ->assertSessionHas('success');

        Storage::disk('public')->assertExists('pdfs/' . $pdf->hashName());
    }

    public function test_store_fails_with_invalid_pdf()
    {
        $user = User::factory()->create();
        $invalidFile = UploadedFile::fake()->create('document.txt', 100);

        $response = $this->actingAs($user)
            ->post(route('notes.store'), [
                'pdf_file' => $invalidFile,
            ]);

        $response->assertStatus(Response::HTTP_UNPROCESSABLE_ENTITY);
        Storage::disk('public')->assertMissing('pdfs/' . $invalidFile->hashName());
    }

    public function test_store_requires_authentication()
    {
        $pdf = UploadedFile::fake()->create('document.pdf', 100);

        $response = $this->post(route('notes.store'), [
            'pdf_file' => $pdf,
        ]);

        $response->assertRedirect(route('login'));
        Storage::disk('public')->assertMissing('pdfs/' . $pdf->hashName());
    }

    public function test_store_creates_note_from_audio()
    {
        $user = User::factory()->create();
        $audio = UploadedFile::fake()->create('audio.mp3', 100);

        $this->transcriptionService->shouldReceive('transcribeAudio')
            ->once()
            ->andReturn(['text' => 'Transcribed Text']);

        $this->deepseekService->shouldReceive('createStudyNote')
            ->once()
            ->andReturn([
                'study_note' => [
                    'content' => 'Processed Content',
                    'title' => 'Generated Title',
                    'summary' => 'Generated Summary'
                ]
            ]);

        $this->noteService->shouldReceive('createNote')
            ->once()
            ->andReturn(Note::factory()->create(['user_id' => $user->id]));

        $response = $this->actingAs($user)
            ->post(route('notes.store'), [
                'audio_file' => $audio,
                'language' => 'en'
            ]);

        $response->assertRedirect(route('notes.edit', 1))
            ->assertSessionHas('success');

        Storage::disk('public')->assertExists('audio/' . $audio->hashName());
    }

    public function test_store_fails_with_invalid_audio()
    {
        $user = User::factory()->create();
        $invalidFile = UploadedFile::fake()->create('audio.txt', 100);

        $response = $this->actingAs($user)
            ->post(route('notes.store'), [
                'audio_file' => $invalidFile,
                'language' => 'en'
            ]);

        $response->assertStatus(Response::HTTP_UNPROCESSABLE_ENTITY);
        Storage::disk('public')->assertMissing('audio/' . $invalidFile->hashName());
    }

    public function test_store_fails_with_invalid_language()
    {
        $user = User::factory()->create();
        $audio = UploadedFile::fake()->create('audio.mp3', 100);

        $response = $this->actingAs($user)
            ->post(route('notes.store'), [
                'audio_file' => $audio,
                'language' => 'invalid'
            ]);

        $response->assertStatus(Response::HTTP_UNPROCESSABLE_ENTITY);
        Storage::disk('public')->assertMissing('audio/' . $audio->hashName());
    }

    public function test_store_creates_note_from_youtube_link()
    {
        $user = User::factory()->create();
        $link = 'https://youtube.com/watch?v=test';

        $this->youtubeAudioExtractor->shouldReceive('extractAudio')
            ->once()
            ->andReturn('audio_data');

        $this->transcriptionService->shouldReceive('transcribeAudio')
            ->once()
            ->andReturn(['text' => 'Transcribed Text']);

        $this->deepseekService->shouldReceive('createStudyNote')
            ->once()
            ->andReturn([
                'study_note' => [
                    'content' => 'Processed Content',
                    'title' => 'Generated Title',
                    'summary' => 'Generated Summary'
                ]
            ]);

        $this->noteService->shouldReceive('createNote')
            ->once()
            ->andReturn(Note::factory()->create(['user_id' => $user->id]));

        $response = $this->actingAs($user)
            ->post(route('notes.store'), [
                'link' => $link,
                'language' => 'en'
            ]);

        $response->assertRedirect(route('notes.edit', 1))
            ->assertSessionHas('success');
    }

    public function test_store_fails_with_invalid_youtube_link()
    {
        $user = User::factory()->create();
        $invalidLink = 'https://invalid-url.com';

        $response = $this->actingAs($user)
            ->post(route('notes.store'), [
                'link' => $invalidLink,
                'language' => 'en'
            ]);

        $response->assertStatus(Response::HTTP_UNPROCESSABLE_ENTITY);
    }

    public function test_store_handles_youtube_extraction_failure()
    {
        $user = User::factory()->create();
        $link = 'https://youtube.com/watch?v=test';

        $this->youtubeAudioExtractor->shouldReceive('extractAudio')
            ->once()
            ->andThrow(new \Exception('Failed to extract audio'));

        $response = $this->actingAs($user)
            ->post(route('notes.store'), [
                'link' => $link,
                'language' => 'en'
            ]);

        $response->assertStatus(Response::HTTP_INTERNAL_SERVER_ERROR)
            ->assertSessionHas('error');
    }

    public function test_show_displays_note()
    {
        $user = User::factory()->create();
        $note = Note::factory()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)
            ->get(route('notes.show', $note));

        $response->assertInertia(fn (Assert $page) => $page
            ->component('Notes/Show')
            ->has('note')
        );
    }

    public function test_show_requires_authentication()
    {
        $note = Note::factory()->create();

        $response = $this->get(route('notes.show', $note));

        $response->assertRedirect(route('login'));
    }

    public function test_show_returns_404_for_nonexistent_note()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->get(route('notes.show', 99999));

        $response->assertStatus(Response::HTTP_NOT_FOUND);
    }

    public function test_edit_displays_edit_form()
    {
        $user = User::factory()->create();
        $note = Note::factory()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)
            ->get(route('notes.edit', $note));

        $response->assertInertia(fn (Assert $page) => $page
            ->component('notes/edit')
            ->has('note')
            ->has('folders')
            ->has('tags')
        );
    }

    public function test_update_updates_note()
    {
        $user = User::factory()->create();
        $note = Note::factory()->create(['user_id' => $user->id]);

        $this->noteService->shouldReceive('updateNote')
            ->once()
            ->andReturn($note);

        $response = $this->actingAs($user)
            ->put(route('notes.update', $note), [
                'title' => 'Updated Title',
                'content' => 'Updated Content'
            ]);

        $response->assertRedirect()
            ->assertSessionHas('success');
    }

    public function test_update_fails_with_invalid_data()
    {
        $user = User::factory()->create();
        $note = Note::factory()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)
            ->put(route('notes.update', $note), [
                'title' => '',
                'content' => ''
            ]);

        $response->assertStatus(Response::HTTP_UNPROCESSABLE_ENTITY);
    }

    public function test_update_requires_authentication()
    {
        $note = Note::factory()->create();

        $response = $this->put(route('notes.update', $note), [
            'title' => 'Updated Title',
            'content' => 'Updated Content'
        ]);

        $response->assertRedirect(route('login'));
    }

    public function test_update_returns_404_for_nonexistent_note()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->put(route('notes.update', 99999), [
                'title' => 'Updated Title',
                'content' => 'Updated Content'
            ]);

        $response->assertStatus(Response::HTTP_NOT_FOUND);
    }

    public function test_destroy_deletes_note()
    {
        $user = User::factory()->create();
        $note = Note::factory()->create(['user_id' => $user->id]);

        $this->noteService->shouldReceive('deleteNote')
            ->once()
            ->with($note);

        $response = $this->actingAs($user)
            ->delete(route('notes.destroy', $note));

        $response->assertRedirect(route('notes.index'))
            ->assertSessionHas('success');
    }

    public function test_destroy_requires_authentication()
    {
        $note = Note::factory()->create();

        $response = $this->delete(route('notes.destroy', $note));

        $response->assertRedirect(route('login'));
    }

    public function test_destroy_returns_404_for_nonexistent_note()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->delete(route('notes.destroy', 99999));

        $response->assertStatus(Response::HTTP_NOT_FOUND);
    }

    public function test_destroy_prevents_unauthorized_deletion()
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $note = Note::factory()->create(['user_id' => $otherUser->id]);

        $response = $this->actingAs($user)
            ->delete(route('notes.destroy', $note));

        $response->assertStatus(Response::HTTP_FORBIDDEN);
    }

    public function test_toggle_pin_toggles_note_pin_status()
    {
        $user = User::factory()->create();
        $note = Note::factory()->create(['user_id' => $user->id, 'is_pinned' => false]);

        $this->noteService->shouldReceive('togglePin')
            ->once()
            ->with($note)
            ->andReturn($note);

        $response = $this->actingAs($user)
            ->post(route('notes.toggle-pin', $note));

        $response->assertRedirect()
            ->assertSessionHas('success');
    }

    public function test_toggle_pin_requires_authentication()
    {
        $note = Note::factory()->create(['is_pinned' => false]);

        $response = $this->post(route('notes.toggle-pin', $note));

        $response->assertRedirect(route('login'));
    }

    public function test_toggle_pin_returns_404_for_nonexistent_note()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->post(route('notes.toggle-pin', 99999));

        $response->assertStatus(Response::HTTP_NOT_FOUND);
    }

    public function test_toggle_pin_prevents_unauthorized_access()
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $note = Note::factory()->create(['user_id' => $otherUser->id, 'is_pinned' => false]);

        $response = $this->actingAs($user)
            ->post(route('notes.toggle-pin', $note));

        $response->assertStatus(Response::HTTP_FORBIDDEN);
    }

    public function test_generate_flashcards_creates_flashcard_set()
    {
        $user = User::factory()->create();
        $note = Note::factory()->create(['user_id' => $user->id]);

        $this->deepseekService->shouldReceive('generateFlashcardsFromNote')
            ->once()
            ->andReturn([
                ['question' => 'Q1', 'answer' => 'A1'],
                ['question' => 'Q2', 'answer' => 'A2']
            ]);

        $response = $this->actingAs($user)
            ->post(route('notes.generate-flashcards', $note));

        $response->assertJson([
            'success' => true,
            'flashcardSetId' => 1
        ]);

        $this->assertDatabaseHas('flashcard_sets', [
            'user_id' => $user->id,
            'name' => $note->title . ' Flashcards',
            'note_id' => $note->id
        ]);
    }

    public function test_generate_flashcards_requires_authentication()
    {
        $note = Note::factory()->create();

        $response = $this->post(route('notes.generate-flashcards', $note));

        $response->assertRedirect(route('login'));
    }

    public function test_generate_flashcards_returns_404_for_nonexistent_note()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->post(route('notes.generate-flashcards', 99999));

        $response->assertStatus(Response::HTTP_NOT_FOUND);
    }

    public function test_generate_flashcards_prevents_unauthorized_access()
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $note = Note::factory()->create(['user_id' => $otherUser->id]);

        $response = $this->actingAs($user)
            ->post(route('notes.generate-flashcards', $note));

        $response->assertStatus(Response::HTTP_FORBIDDEN);
    }

    public function test_generate_flashcards_handles_service_failure()
    {
        $user = User::factory()->create();
        $note = Note::factory()->create(['user_id' => $user->id]);

        $this->deepseekService->shouldReceive('generateFlashcardsFromNote')
            ->once()
            ->andThrow(new \Exception('Failed to generate flashcards'));

        $response = $this->actingAs($user)
            ->post(route('notes.generate-flashcards', $note));

        $response->assertStatus(Response::HTTP_INTERNAL_SERVER_ERROR)
            ->assertJson(['success' => false]);
    }

    public function test_upload_stores_image()
    {
        $user = User::factory()->create();
        $note = Note::factory()->create(['user_id' => $user->id]);
        $image = UploadedFile::fake()->image('test.jpg');

        $response = $this->actingAs($user)
            ->post(route('notes.upload', $note), [
                'file' => $image
            ]);

        $response->assertJson([
            'url' => true
        ]);

        Storage::disk('public')->assertExists('images/' . $image->hashName());
    }

    public function test_upload_requires_authentication()
    {
        $note = Note::factory()->create();
        $image = UploadedFile::fake()->image('test.jpg');

        $response = $this->post(route('notes.upload', $note), [
            'file' => $image
        ]);

        $response->assertRedirect(route('login'));
        Storage::disk('public')->assertMissing('images/' . $image->hashName());
    }

    public function test_upload_returns_404_for_nonexistent_note()
    {
        $user = User::factory()->create();
        $image = UploadedFile::fake()->image('test.jpg');

        $response = $this->actingAs($user)
            ->post(route('notes.upload', 99999), [
                'file' => $image
            ]);

        $response->assertStatus(Response::HTTP_NOT_FOUND);
        Storage::disk('public')->assertMissing('images/' . $image->hashName());
    }

    public function test_upload_prevents_unauthorized_access()
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $note = Note::factory()->create(['user_id' => $otherUser->id]);
        $image = UploadedFile::fake()->image('test.jpg');

        $response = $this->actingAs($user)
            ->post(route('notes.upload', $note), [
                'file' => $image
            ]);

        $response->assertStatus(Response::HTTP_FORBIDDEN);
        Storage::disk('public')->assertMissing('images/' . $image->hashName());
    }

    public function test_upload_validates_image_file()
    {
        $user = User::factory()->create();
        $note = Note::factory()->create(['user_id' => $user->id]);
        $invalidFile = UploadedFile::fake()->create('document.pdf');

        $response = $this->actingAs($user)
            ->post(route('notes.upload', $note), [
                'file' => $invalidFile
            ]);

        $response->assertStatus(Response::HTTP_UNPROCESSABLE_ENTITY);
        Storage::disk('public')->assertMissing('images/' . $invalidFile->hashName());
    }
}