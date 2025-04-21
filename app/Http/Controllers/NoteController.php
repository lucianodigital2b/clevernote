<?php

namespace App\Http\Controllers;

use App\Models\Note;
use App\Services\NoteService;
use App\Services\TranscriptionService;
use App\Http\Requests\StoreNoteRequest;
use App\Http\Requests\UpdateNoteRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Services\{DeepSeekService, YouTubeAudioExtractor};
use Illuminate\Support\Facades\Log;

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

        // dd($request->all());
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
            $validated['user_id'] = Auth::id();
            
            if (isset($validated['pdf_file'])) {
                $file = $validated['pdf_file'];
                $path = $file->store('pdfs', 'public');
                
                $pdfText = $this->noteService->extractTextFromPdf($path);
                $studyNote = $this->deepseekService->createStudyNote($pdfText);
            } else if (isset($validated['audio_file'])) {
                $path = $validated['audio_file']->store('audio', 'public');
                $validated['file_path'] = $path;
                
                // Process audio file and get transcription
                $transcription = $this->transcriptionService->transcribeAudio($validated['audio_file'], $validated['language']);
                $studyNote = $this->deepseekService->createStudyNote($transcription['text'], $validated['language']);
            } else if (isset($validated['link'])) {

                $audio = $this->youtubeAudioExtractor->extractAudio($validated['link']);

                $transcription = $this->transcriptionService->transcribeAudio($audio, $validated['language'] ?? 'en');
                $studyNote = $this->deepseekService->createStudyNote($transcription['text'], $validated['language'] ?? 'en');
            }


            $validated['content'] = $studyNote['study_note']['content'];
            $validated['title']   = $studyNote['study_note']['title'];
            $validated['summary']   = $studyNote['study_note']['summary'];
            // $validated['metadata'] = [
            //     'audio_duration' => $transcription['duration'] ?? null,
            //     'language' => $transcription['language'] ?? 'en',
            //     'type' => 'audio_transcription',
            //     'original_transcription' => $studyNote['original_transcription']
            // ];
            
            $note = $this->noteService->createNote($validated);


            if ($request->wantsJson()) {
                return response()->json([
                    'message' => 'Note created successfully',
                    'note' => $note
                ]);
            }

            // Redirect to the edit page of the newly created note
            return redirect()->route('notes.edit', $note)
                ->with('success', 'Note created successfully.');
        } catch (\Exception $e) {

            Log::error($e->getTrace());

            if ($request->wantsJson()) {
                return response()->json(['error' => 'Failed to create note'], 500);
            }

            return redirect()
            ->back()
            ->with('error', $e->getMessage());

        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Note $note)
    {
        // $this->authorize('view', $note);

        return Inertia::render('Notes/Show', [
            'note' => $note->load(['tags', 'folder'])
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Note $note)
    {
        // $this->authorize('update', $note);

        return Inertia::render('notes/edit', [
            'note' => $note->load(['tags', 'folder']),
            'folders' => Auth::user()->folders,
            'tags' => Auth::user()->tags
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateNoteRequest $request, Note $note)
    {
        // $this->authorize('update', $note);

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
    public function destroy(Note $note)
    {
        // $this->authorize('delete', $note);

        $this->noteService->deleteNote($note);

        return redirect()->route('notes.index')
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
}
