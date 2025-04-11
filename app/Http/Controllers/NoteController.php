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
use App\Services\DeepSeekService;

class NoteController extends Controller
{
    protected $noteService;
    protected $transcriptionService;
    protected $deepseekService;

    public function __construct(
        NoteService $noteService, 
        TranscriptionService $transcriptionService,
        DeepSeekService $deepseekService
    ) {
        $this->noteService = $noteService;
        $this->transcriptionService = $transcriptionService;
        $this->deepseekService = $deepseekService;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $filters = $request->only(['folder_id', 'search', 'tag_id']);
        $notes = $this->noteService->getUserNotes(Auth::id(), $filters);

        if($request->wantsJson()){
            return $notes;
        }

        return Inertia::render('Notes/Index', [
            'notes' => $notes,
            'filters' => $filters
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
            $type = $request->input('type');
            $title = $request->input('title');
            $folderId = $request->input('folder_id');
            
            if ($type === 'pdf') {
                if (!$request->hasFile('pdf_file')) {
                    return response()->json([
                        'errors' => ['pdf_file' => 'PDF file is required']
                    ], 422);
                }

                $file = $request->file('pdf_file');
                $path = $file->store('pdfs', 'public');
                
                $pdfText = $this->noteService->extractTextFromPdf($path);
                $studyNote = $this->deepseekService->generateStudyNote($pdfText);
                
                $note = $this->noteService->createNote([
                    'user_id' => Auth::id(),
                    'title' => $title,
                    'folder_id' => $folderId,
                    'content' => $studyNote,
                    'type' => 'pdf',
                    'file_path' => $path,
                    'icon' => 'file-text'
                ]);

                return response()->json($note);
            }
            
            if ($request->hasFile('audio_file')) {
                $path = $request->file('audio_file')->store('audio', 'public');
                $validated['file_path'] = $path;
                
                // Process audio file and get transcription
                $transcription = $this->transcriptionService->transcribeAudio($request->file('audio_file'), $validated['language']);
                
                // Generate study note using DeepSeek
                // try {
                    $studyNote = $this->deepseekService->createStudyNote($transcription['text']);
                    $validated['content'] = $studyNote['study_note']['content'];
                    $validated['title']   = $studyNote['study_note']['title'];
                    $validated['summary']   = $studyNote['study_note']['summary'];
                    $validated['metadata'] = [
                        'audio_duration' => $transcription['duration'] ?? null,
                        'language' => $transcription['language'] ?? 'en',
                        'type' => 'audio_transcription',
                        'original_transcription' => $studyNote['original_transcription']
                    ];
                // } catch (\Exception $e) {
                //     // Fallback to original transcription if study note generation fails
                //     $validated['content'] = $transcription['text'] ?? 'Audio transcription in progress...';
                //     $validated['metadata'] = [
                //         'audio_duration' => $transcription['duration'] ?? null,
                //         'language' => $transcription['language'] ?? 'en',
                //         'type' => 'audio_transcription'
                //     ];
                // }
            }

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
            return response()->json(['error' => 'Failed to create note'], 500);
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
