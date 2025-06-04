<?php

namespace App\Http\Controllers;

use App\Models\Flashcard;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use App\Http\Requests\StoreFlashcardRequest; // Import the request
use App\Models\FlashcardSet;

class FlashcardController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {

        $flashcards = Flashcard::whereHas('flashcardSets', function($query) {
            $query->where('user_id', Auth::id());
        })
        ->latest()
        ->paginate(12);

        if($request->wantsJson()) {
            return response()->json($flashcards);
        }

        return Inertia::render('flashcards/index', [
            'flashcards' => $flashcards,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        // Return the Inertia view for creating a flashcard
        return Inertia::render('flashcards/create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreFlashcardRequest $request) // Use the form request for validation
    {
        $flashcardSet = FlashcardSet::find($request->flashcard_set_id);
        $flashcard = $flashcardSet->flashcards()->create($request->validated());
        
        // Handle image uploads if present in the request
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $image) {
                $flashcard->addMedia($image)->toMediaCollection('flashcard-images');
            }
        }
        
        if ($request->wantsJson()) {
            return response()->json([
                'flashcard' => $flashcard,
                'message' => 'Flashcard created successfully.'
            ]);
        }
        
        // For Inertia requests, redirect back to the flashcard set with the new flashcard data
        return redirect()->route('flashcard-sets.show', $flashcard->flashcardSets->first()->id)
                        ->with('success', 'Flashcard created successfully.')
                        ->with('flashcard', $flashcard);
    }

    /**
     * Display the specified resource.
     */
    public function show(Flashcard $flashcard)
    {
        $this->authorize('view', $flashcard);

        return Inertia::render('flashcards/show', [
            'flashcard' => $flashcard,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Flashcard $flashcard)
    {
        $this->authorize('update', $flashcard);

        return Inertia::render('flashcards/edit', [
            'flashcard' => $flashcard,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Flashcard $flashcard) // Use form request for validation
    {
        // $this->authorize('update', $flashcard);

        $flashcard->update($request->all());

        return redirect()->route('flashcards.index')->with('success', 'Flashcard updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, Flashcard $flashcard)
    {
        // $this->authorize('delete', $flashcard);

        $flashcard->delete();

        if($request->wantsJson()) {
            return response()->json([
                'message' => 'Flashcard deleted successfully.'
            ]);
        }

        return redirect()->back()->with('success', 'Flashcard deleted successfully.');
    }

    /**
     * Upload media for a specific flashcard.
     */
    public function uploadMedia(Request $request, Flashcard $flashcard)
    {
        // $this->authorize('update', $flashcard);

        $request->validate([
            'file' => 'required|image|max:5120', // max 5MB
        ]);

        $media = $flashcard->addMediaFromRequest('file')->toMediaCollection('flashcard-images');

        return response()->json([
            'url' => $media->getUrl(),
        ]);
    }
}
