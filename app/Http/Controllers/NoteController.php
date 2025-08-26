<?php

namespace App\Http\Controllers;

use App\Models\Note;
use App\Services\NoteService;
use App\Services\TranscriptionService;
use App\Http\Requests\StoreNoteRequest;
use App\Http\Requests\UpdateNoteRequest;
use App\Jobs\GenerateFlashcardsFromNote;
use App\Jobs\GenerateNotePodcastJob;
use App\Jobs\ProcessAudioNote;
use App\Jobs\ProcessLinkNote;
use App\Jobs\ProcessPdfNote;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Services\{DeepSeekService, YouTubeAudioExtractor};
use Illuminate\Support\Facades\Log;
use App\Models\FlashcardSet;
use App\Models\Flashcard;

class NoteController extends Controller
{
    protected $noteService;
    protected $transcriptionService;
    protected $deepseekService;
    protected $youtubeAudioExtractor;

    public function __construct(
        NoteService $noteService, 
        TranscriptionService $transcriptionService,
        DeepSeekService $deepseekService,
        YouTubeAudioExtractor $youtubeAudioExtractor,
    ) {
        $this->noteService = $noteService;
        $this->transcriptionService = $transcriptionService;
        $this->deepseekService = $deepseekService;
        $this->youtubeAudioExtractor = $youtubeAudioExtractor;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {

        $notes = $this->noteService->getUserNotes(Auth::id(), $request->all());

        if($request->wantsJson()){
            return $notes;
        }

        return Inertia::render('Notes/Index', [
            'notes' => $notes,
            'filters' => $request->all()
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('Notes/Create', [
            'folders' => Auth::user()->folders,
            'tags' => Auth::user()->tags
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreNoteRequest $request)
    {
        \Log::error(print_r($request->all(), true));
        try {
            $validated = $request->validated();
            $user = Auth::user();
            $validated['user_id'] = $user->id;

            // Check subscription status and note count
            if ($user->notes_count >= 3 && $user->activeSubscriptions->isEmpty()) {
                if ($request->wantsJson()) {
                    return response()->json(['error' => 'You have reached the maximum number of notes for free users. Please subscribe to create more notes.'], 403);
                }
                return redirect()
                    ->back()
                    ->withErrors(['error' => 'You have reached the maximum number of notes for free users. Please subscribe to create more notes.']);
            }
            
            // Determine if this note requires processing
            $requiresProcessing = isset($validated['pdf_file']) || isset($validated['audio_file']) || isset($validated['link']);
            
            // Create the note with appropriate status
            $note = Note::create([
                'user_id' => $validated['user_id'],
                'title' => $validated['title'] ?? ($requiresProcessing ? 'Processing Note' : 'New Note'),
                'content' => $validated['content'] ?? '', // Use provided content or empty string
                'status' => $requiresProcessing ? 'processing' : 'completed',
                'folder_id' => $validated['folder_id'] ?? null,
                'icon' => $validated['icon'] ?? 'file',
                'transcription' => $validated['transcription'] ?? null,
                'summary' => $validated['summary'] ?? null,
                'is_pinned' => $validated['is_pinned'] ?? false,
            ]);

            // Increment user's notes count
            $user->increment('notes_count');

            if (isset($validated['pdf_file'])) {
                $file = $validated['pdf_file'];
                $extension = $file->getClientOriginalExtension();
                $storageDir = match($extension) {
                    'pdf' => 'pdfs',
                    'txt' => 'texts',
                    'ppt', 'pptx' => 'presentations',
                    default => 'docs'
                };
                $path = $file->store($storageDir, 'public');

                // Remove file instance from validated data
                unset($validated['pdf_file']);

                // Dispatch job for PDF/Doc processing
                ProcessPdfNote::dispatch($note->id, $validated, $path, $extension);

            } else if (isset($validated['audio_file'])) {
                $audioFile = $validated['audio_file'];
                $path = $audioFile->store('audio', 'public');

                // Remove file instance from validated data
                unset($validated['audio_file']);

                // Dispatch job for audio processing
                ProcessAudioNote::dispatch($note->id, $validated, $path);

            } else if (isset($validated['link'])) {
                // Dispatch job for link processing
                ProcessLinkNote::dispatch($note->id, $validated);
            }


            
            // Return the created note object immediately
            if ($request->wantsJson()) {
                return response()->json($note);
            }

            // Redirect to the edit page of the newly created note with appropriate message
            $successMessage = $requiresProcessing 
                ? 'Note processing started. You will be redirected to the note once it\'s ready.'
                : 'Note created successfully.';
                
            return redirect()->route('notes.edit', $note->id)
                ->with('success', $successMessage);
        } catch (\Exception $e) {

            Log::error($e->getMessage());

            if ($request->wantsJson()) {
                return response()->json(['error' => 'Failed to create note'], 500);
            }

            return redirect()
            ->back()
            ->withErrors('create', $e->getMessage());

        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Note $note, Request $request)
    {
        $this->authorize('view', $note);

        if($request->wantsJson()){
            return $note->load(['tags', 'folder', 'flashcardSets', 'quizzes', 'mindmaps', 'media']);
        }

        return Inertia::render('Notes/Show', [
            'note' => $note->load(['tags', 'folder'])
        ]);
    }

    /**
     * Display a note by UUID for public sharing.
     */
    public function showByUuid(string $uuid, Request $request)
    {
        $note = Note::where('uuid', $uuid)->firstOrFail();
        // Only show processed and public notes
        if ($note->status !== 'processed' || !$note->is_public) {
            abort(404, 'Note not found or not available for sharing.');
        }

        if($request->wantsJson()){
            return $note->load(['tags', 'folder', 'media']);
        }

        return Inertia::render('notes/show', [
            'note' => $note->load(['tags', 'folder'])
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Note $note)
    {
        $this->authorize('update', $note);

        return Inertia::render('notes/edit', [
            'note' => $note->load(['tags', 'folder', 'flashcardSets', 'quizzes', 'mindmaps', 'media', 'crosswords']),
            'folders' => Auth::user()->folders,
            'tags' => Auth::user()->tags
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateNoteRequest $request, Note $note)
    {
        $this->authorize('update', $note);

        // $studyNote = $this->deepseekService->createStudyNote($note->content);
        // $validated['content'] = $studyNote['study_note'];
        // $validated['metadata'] = [
        //     'audio_duration' => $transcription['duration'] ?? null,
        //     'language' => $transcription['language'] ?? 'en',
        //     'type' => 'audio_transcription',
        //     'original_transcription' => $studyNote['original_transcription']
        // ];

        $note = $this->noteService->updateNote($note, $request->validated());

        if($request->wantsJson()) {
            return response()->json(['success' => true]);
        }

        return redirect()
            ->back()
            ->with('success', 'Note updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, Note $note)
    {
        $this->authorize('delete', $note);

        $delete_related_items = $request->input('delete_related_items', false);
        $this->noteService->deleteNote($note, $delete_related_items);

        if($request->wantsJson()){
            return response()->json(['success' => true]);
        }

        return redirect()
            ->route('dashboard')
            ->with('success', 'Note deleted successfully.');
    }

    /**
     * Toggle pin status of a note
     */
    public function togglePin(Note $note)
    {
        // $this->authorize('update', $note);

        $note = $this->noteService->togglePin($note);

        return back()->with('success', 
            $note->is_pinned ? 'Note pinned successfully.' : 'Note unpinned successfully.'
        );
    }

    public function generateFlashcards(Request $request, Note $note)
    {
        $this->authorize('update', $note);

        // 1. Create a new FlashcardSet with pending status
        $flashcardSet = FlashcardSet::create([
            'user_id' => $note->user_id,
            'name' => $note->title . ' Flashcards',
            'folder_id' => $note->folder_id ?? null,
            'note_id' => $note->id,
            'status' => 'pending'
        ]);

        // 2. Dispatch the job to generate flashcards
        GenerateFlashcardsFromNote::dispatch($note->id, $flashcardSet->id);

        return response()->json([
            'success' => true,
            'flashcardSetId' => $flashcardSet->id,
        ]);
    }

    /**
     * Generate a podcast from the note content
     */
    public function generatePodcast(Request $request, Note $note)
    {
        $this->authorize('update', $note);

        // Validate the request
        $validated = $request->validate([
            'voice_id' => 'nullable|string|max:50',
            'language_code' => 'nullable|string|max:10',
            'engine' => 'nullable|string|in:standard,neural',
            'include_intro' => 'nullable|boolean',
            'include_conclusion' => 'nullable|boolean',
            'use_ssml' => 'nullable|boolean',
        ]);

        // Check if note is already being processed or has a podcast
        if ($note->podcast_status === 'processing') {
            return response()->json([
                'error' => 'Podcast generation is already in progress for this note.'
            ], 409);
        }

        if ($note->podcast_status === 'completed') {
            return response()->json([
                'error' => 'This note already has a podcast. Delete the existing podcast first if you want to regenerate it.'
            ], 409);
        }

        // Check if note has content
        if (empty($note->content)) {
            return response()->json([
                'error' => 'Cannot generate podcast from an empty note.'
            ], 400);
        }

        // Check if note is processed (if using status field)
        if (isset($note->status) && $note->status !== 'processed') {
            return response()->json([
                'error' => 'Note must be fully processed before generating a podcast.'
            ], 400);
        }

        // Set default options from config
        $options = array_merge([
            'voice_id' => config('tts.providers.amazon_polly.defaults.voice_id'),
            'language_code' => config('tts.providers.amazon_polly.defaults.language_code'),
            'engine' => config('tts.providers.amazon_polly.defaults.engine'),
            'include_intro' => config('tts.settings.podcast_defaults.include_intro'),
            'include_conclusion' => config('tts.settings.podcast_defaults.include_conclusion'),
            'use_ssml' => config('tts.settings.podcast_defaults.use_ssml'),
        ], $validated);

        // Update note status to processing
        $note->update([
            'podcast_status' => 'processing',
            'podcast_failure_reason' => null,
        ]);

        // Dispatch the podcast generation job
        GenerateNotePodcastJob::dispatch($note->id, $options);

        return response()->json([
            'success' => true,
            'message' => 'Podcast generation started. You will be notified when it\'s ready.',
            'note_id' => $note->id,
            'podcast_status' => 'processing',
        ]);
    }

    /**
     * Get the podcast status for a note
     */
    public function podcastStatus(Note $note)
    {
        $this->authorize('view', $note);

        return response()->json([
            'podcast_status' => $note->podcast_status,
            'podcast_file_path' => $note->podcast_file_path,
            'podcast_url' => $note->podcast_url,
            'podcast_duration' => $note->podcast_duration,
            'podcast_file_size' => $note->podcast_file_size,
            'podcast_failure_reason' => $note->podcast_failure_reason,
            'podcast_generated_at' => $note->podcast_generated_at,
            'podcast_metadata' => $note->podcast_metadata,
        ]);
    }

    /**
     * Delete the podcast for a note
     */
    public function deletePodcast(Note $note)
    {
        $this->authorize('update', $note);

        if (!$note->hasPodcast() && $note->podcast_status !== 'failed') {
            return response()->json([
                'error' => 'No podcast found for this note.'
            ], 404);
        }

        // Delete the audio file if it exists
        $podcastMedia = $note->getFirstMedia('note-podcasts');
        if ($podcastMedia) {
            // Delete from media library
            $podcastMedia->delete();
        } elseif ($note->podcast_file_path) {
            // Delete from legacy storage
            \Storage::disk(config('tts.settings.storage.disk'))->delete($note->podcast_file_path);
        }

        // Reset podcast-related fields
        $note->update([
            'podcast_file_path' => null,
            'podcast_duration' => null,
            'podcast_file_size' => null,
            'podcast_status' => null,
            'podcast_failure_reason' => null,
            'podcast_metadata' => null,
            'podcast_generated_at' => null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Podcast deleted successfully.',
        ]);
    }

    /**
     * Serve the podcast file for a note
     */
    public function servePodcast(Note $note, $filename)
    {
        $this->authorize('view', $note);

        if (!$note->hasPodcast()) {
            abort(404, 'Podcast not found');
        }

        // Try to get the media from the media library first
        $podcastMedia = $note->getFirstMedia('note-podcasts');
        if ($podcastMedia && $podcastMedia->file_name === $filename) {
            // Get the file path from the media library
            $filePath = $podcastMedia->getPath();
            
            if (file_exists($filePath)) {
                return response()->file($filePath, [
                    'Content-Type' => 'audio/mpeg',
                    'Content-Disposition' => 'inline; filename="' . $filename . '"',
                ]);
            }
        }

        // Fallback to direct storage for backward compatibility
        if ($note->podcast_file_path) {
            $disk = \Storage::disk('r2');
            if ($disk->exists($note->podcast_file_path)) {
                return response()->stream(function () use ($disk, $note) {
                    echo $disk->get($note->podcast_file_path);
                }, 200, [
                    'Content-Type' => 'audio/mpeg',
                    'Content-Disposition' => 'inline; filename="' . $filename . '"',
                ]);
            }
        }

        abort(404, 'Podcast file not found');
    }

    public function upload(Request $request, Note $note)
    {
        $request->validate([
            'file' => 'required|image|max:5120', // max 5MB
        ]);

        $media = $note->addMediaFromRequest('file')->toMediaCollection('note-images');

        return response()->json([
            'url' => $media->getUrl(),
        ]);
    }

    public function retryProcessing(Note $note)
    {
        // Check if the note is in failed status
        if ($note->status !== 'failed') {
            return response()->json(['error' => 'Note is not in failed status'], 400);
        }

        // Reset the note status to processing
        $note->update([
            'status' => 'processing',
            'failure_reason' => null
        ]);

        // Determine which job to dispatch based on note type/content
        // You'll need to store the original job type or determine it from the note
        $this->dispatchAppropriateJob($note);

        return response()->json(['message' => 'Job retry initiated successfully']);
    }

    private function dispatchAppropriateJob(Note $note)
    {
        // You'll need to determine which job to run based on the note's original data
        // This could be stored in a new field like 'job_type' or determined from existing data
        
        // Example logic (you'll need to adapt this based on your note structure):
        if ($note->link) {
            // This was a link note
            ProcessLinkNote::dispatch($note->id, [
                'language' => $note->language ?? 'en',
                'link' => $note->link,
                // Add other necessary data
            ]);
        } elseif ($note->file_path) {
            // This was a file upload (audio or PDF)
            $extension = pathinfo($note->file_path, PATHINFO_EXTENSION);
            if (in_array($extension, ['mp3', 'wav', 'ogg'])) {
                ProcessAudioNote::dispatch($note->id, [
                    'language' => $note->language ?? 'en',
                    // Add other necessary data
                ], $note->file_path);
            } else {
                ProcessPdfNote::dispatch($note->id, [
                    'language' => $note->language ?? 'en',
                    // Add other necessary data
                ], $note->file_path, $extension);
            }
        }
    }

    public function status(Note $note)
    {
        return [
            'status' => $note->status,
        ];
    }

    public function updateStatus(Request $request, Note $note)
    {
        $this->authorize('update', $note);

        $request->validate([
            'status' => 'required|string|in:processing,processed,failed',
            'failure_reason' => 'nullable|string'
        ]);

        $note->update([
            'status' => $request->status,
            'failure_reason' => $request->failure_reason
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Note status updated successfully'
        ]);
    }

}
