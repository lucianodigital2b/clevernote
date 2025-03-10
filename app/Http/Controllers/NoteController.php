<?php

namespace App\Http\Controllers;

use App\Models\Note;
use App\Services\NoteService;
use App\Http\Requests\StoreNoteRequest;
use App\Http\Requests\UpdateNoteRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class NoteController extends Controller
{
    protected $noteService;

    public function __construct(NoteService $noteService)
    {
        $this->noteService = $noteService;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $filters = $request->only(['folder_id', 'search', 'tag_id']);
        $notes = $this->noteService->getUserNotes(Auth::id(), $filters);

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
        $validated = $request->validated();
        $validated['user_id'] = Auth::id();

        $note = $this->noteService->createNote($validated);

        return redirect()->route('notes.show', $note)
            ->with('success', 'Note created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Note $note)
    {
        $this->authorize('view', $note);

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

        return Inertia::render('Notes/Edit', [
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
        $this->authorize('update', $note);

        $note = $this->noteService->updateNote($note, $request->validated());

        return redirect()->route('notes.show', $note)
            ->with('success', 'Note updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Note $note)
    {
        $this->authorize('delete', $note);

        $this->noteService->deleteNote($note);

        return redirect()->route('notes.index')
            ->with('success', 'Note deleted successfully.');
    }

    /**
     * Toggle pin status of a note
     */
    public function togglePin(Note $note)
    {
        $this->authorize('update', $note);

        $note = $this->noteService->togglePin($note);

        return back()->with('success', 
            $note->is_pinned ? 'Note pinned successfully.' : 'Note unpinned successfully.'
        );
    }
}
