<?php

namespace App\Http\Controllers;

use App\Models\Folder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use App\Http\Requests\StoreFlashcardRequest; // Import the request

class FolderFlashcardController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Folder $folder)
    {
        $this->authorize('view', $folder); // Ensure user can view the folder

        $flashcards = $folder->flashcards()->where('user_id', Auth::id())->latest()->paginate(10);

        return Inertia::render('folders/flashcards/index', [
            'folder' => $folder,
            'flashcards' => $flashcards,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(Folder $folder)
    {
        $this->authorize('update', $folder); // Ensure user can update (add flashcards to) the folder

        // Return the Inertia view for creating a flashcard within a folder
        return Inertia::render('folders/flashcards/create', [
            'folder' => $folder,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreFlashcardRequest $request, Folder $folder)
    {
        $this->authorize('update', $folder); // Ensure user can update the folder

        // Create the flashcard associated with the folder
        $flashcard = $folder->flashcards()->create(
            array_merge($request->validated(), ['user_id' => Auth::id()])
        );

        // Redirect to the folder's flashcards index page with a success message
        return redirect()->route('folders.flashcards.index', $folder)->with('success', 'Flashcard created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Folder $folder, string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Folder $folder, string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Folder $folder, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Folder $folder, string $id)
    {
        //
    }
}
