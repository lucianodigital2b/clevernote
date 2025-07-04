<?php

namespace App\Http\Controllers;

use App\Models\Note;
use App\Services\NoteService;
use App\Services\TranscriptionService;
use App\Http\Requests\StoreNoteRequest;
use App\Http\Requests\UpdateNoteRequest;
use App\Jobs\GenerateFlashcardsFromNote;
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
            
            // Create a placeholder note immediately
            $note = Note::create([
                'user_id' => $validated['user_id'],
                'title' => $validated['title'] ?? 'Processing Note',
                'content' => '', // Placeholder content
                'status' => 'processing', // Add a status column to the notes table
                'folder_id' => $validated['folder_id'] ?? null,
                'icon' => $validated['icon'] ?? 'file',
            ]);

            // Increment user's notes count
            $user->increment('notes_count');


            if (isset($validated['pdf_file'])) {
                $file = $validated['pdf_file'];
                $extension = $file->getClientOriginalExtension();
                $storageDir = $extension === 'pdf' ? 'pdfs' : 'docs';
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

            // Redirect to the edit page of the newly created note
            return redirect()->route('notes.edit', $note->id)
                ->with('success', 'Note processing started. You will be redirected to the note once it\'s ready.');
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
            return $note->load(['tags', 'folder']);
        }

        return Inertia::render('Notes/Show', [
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
            'note' => $note->load(['tags', 'folder', 'flashcardSets', 'quizzes', 'mindmaps', 'media']),
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
