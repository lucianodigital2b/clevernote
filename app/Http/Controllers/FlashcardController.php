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
        $flashcard = FlashcardSet::find($request->flashcard_set_id)->flashcards()->create($request->validated());
        
        if ($request->wantsJson()) {
            return response()->json([
                'flashcard' => $flashcard,
                'message' => 'Flashcard created successfully.'
            ]);
        }
        
        // For Inertia requests, return the current page with the new flashcard
        $flashcardSet = FlashcardSet::with('flashcards')->find($request->flashcard_set_id);
        
        return Inertia::render('FlashcardSets/show', [
            'flashcardSet' => $flashcardSet,
            'flashcards' => $flashcardSet->flashcards,
            'flashcard' => $flashcard, // The newly created flashcard
            'success' => 'Flashcard created successfully.'
        ]);
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
    public function update(StoreFlashcardRequest $request, Flashcard $flashcard) // Use form request for validation
    {
        $this->authorize('update', $flashcard);

        $flashcard->update($request->validated());

        return redirect()->route('flashcards.index')->with('success', 'Flashcard updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, Flashcard $flashcard)
    {
        // $this->authorize('delete', $flashcard);

        $flashcard->delete();

        return redirect()->back()->with('success', 'Flashcard deleted successfully.');
    }
}
