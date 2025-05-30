<?php

namespace App\Http\Controllers;

use App\Models\FlashcardSet;
use App\Models\Flashcard;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class FlashcardSetController extends Controller
{

    public function index(Request $request)
    {
        $flashcards = FlashcardSet::where('user_id', Auth::id())
            ->withCount('flashcards')
            ->latest()
            ->paginate(10);


        return Inertia::render('FlashcardSets/index', [
            'flashcardSets' => $flashcards,
        ]);
    }
    
    public function create()
    {
        return Inertia::render('FlashcardSets/create');
    }
    
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'flashcard_ids' => 'nullable|array',
        ]);

        $flashcardSet = FlashcardSet::create([
            'user_id' => Auth::id(),
            'name' => $validated['name'],
            'description' => $validated['description'],
        ]);

        if (!empty($validated['flashcard_ids'])) {
            $flashcardSet->flashcards()->attach($validated['flashcard_ids']);
        }

        return redirect()->route('flashcard-sets.index')->with('success', 'Flashcard set created successfully.');
    }

    public function show(FlashcardSet $flashcardSet)
    {
        $this->authorize('view', $flashcardSet);

        $flashcardSet->load('flashcards');

        return Inertia::render('FlashcardSets/show', [
            'flashcardSet' => $flashcardSet,
            'flashcards' => $flashcardSet->flashcards
        ]);
    }

    public function edit(FlashcardSet $flashcardSet)
    {
        $this->authorize('update', $flashcardSet);

        $flashcardSet->load('flashcards');

        return Inertia::render('FlashcardSets/edit', [
            'flashcardSet' => $flashcardSet
        ]);
    }

    public function update(Request $request, FlashcardSet $flashcardSet)
    {
        $this->authorize('update', $flashcardSet);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'flashcards' => 'required|array',
            'flashcards.*.question' => 'required|string|max:255',
            'flashcards.*.answer' => 'required|string|max:255',
        ]);

        // Update the set
        $flashcardSet->update([
            'name' => $validated['name'],
            'description' => $validated['description'],
        ]);

        // Get current flashcard IDs in the set
        $currentIds = $flashcardSet->flashcards()->pluck('flashcards.id')->toArray();
        
        // Update or create flashcards
        $updatedIds = [];
        foreach ($validated['flashcards'] as $flashcardData) {
            $flashcard = $flashcardSet->flashcards()->updateOrCreate(
                ['flashcards.id' => $flashcardData['id'] ?? null],
                $flashcardData
            );
            $updatedIds[] = $flashcard->id;
        }

        // Detach only flashcards that were removed from the set
        $removedIds = array_diff($currentIds, $updatedIds);
        if (!empty($removedIds)) {
            $flashcardSet->flashcards()->detach($removedIds);
        }

        return redirect()->back()->with('success', 'Flashcard set updated successfully.');
    }

    public function destroy(FlashcardSet $flashcardSet) {

        $this->authorize('delete', $flashcardSet);
    
        // Delete all flashcards associated with the flashcard set
        $flashcardSet->flashcards()->delete();
    
        // Delete the flashcard set
        $flashcardSet->delete();
    
        return redirect()->route('flashcard-sets.index')
            ->with('success', 'Flashcard set and its flashcards deleted successfully.');
    }

    public function study(FlashcardSet $flashcardSet)
    {
        $this->authorize('view', $flashcardSet);
    
        $flashcardSet->load('flashcards');
    
        return Inertia::render('FlashcardSets/study', [
            'flashcardSet' => $flashcardSet
        ]);
    }

    public function saveProgress(Request $request, FlashcardSet $flashcardSet)
    {
   
        $validated = $request->validate([
            'flashcard_id' => 'required|exists:flashcards,id',
            'interval' => 'required|integer',
            'repetition' => 'required|integer',
            'efactor' => 'required|numeric',
            'next_review' => 'required|date'
        ]);


        Flashcard::find($validated['flashcard_id'])
            ->userProgress()
            ->updateOrCreate(
                ['user_id' => Auth::id()],
                $validated
            );

        return response()->json(['success' => true]);
    }
    
    public function getFlashcards(Request $request)
    {
        $flashcards = Flashcard::where('user_id', Auth::id())
            ->latest()
            ->paginate(10);

        return response()->json($flashcards);
    }
}