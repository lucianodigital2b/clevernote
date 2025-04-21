<?php

namespace App\Http\Controllers;

use App\Models\FlashcardSet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class FlashcardSetController extends Controller
{

    public function index(Request $request)
    {
        
    }
    
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
        ]);

        $flashcardSet = FlashcardSet::create([
            'user_id' => Auth::id(),
            'name' => $validated['name'],
            'description' => $validated['description'],
        ]);

        return redirect()->back()->with('success', 'Flashcard set created successfully.');
    }

    public function show(FlashcardSet $flashcardSet)
    {
        $this->authorize('view', $flashcardSet);

        $flashcardSet->load('flashcards');

        return Inertia::render('FlashcardSets/Show', [
            'flashcardSet' => $flashcardSet,
            'flashcards' => $flashcardSet->flashcards
        ]);
    }

    public function edit(FlashcardSet $flashcardSet)
    {
        $this->authorize('update', $flashcardSet);

        $flashcardSet->load('flashcards');

        return Inertia::render('FlashcardSets/Edit', [
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

        // Update flashcards
        $existingIds = [];
        foreach ($validated['flashcards'] as $flashcardData) {
            $flashcard = $flashcardSet->flashcards()->updateOrCreate(
                ['id' => $flashcardData['id'] ?? null],
                $flashcardData
            );
            $existingIds[] = $flashcard->id;
        }

        // Delete removed flashcards
        $flashcardSet->flashcards()
            ->whereNotIn('id', $existingIds)
            ->delete();

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
    
        return Inertia::render('FlashcardSets/Study', [
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


        $flashcardSet->flashcards()
            ->find($validated['flashcard_id'])
            ->userProgress()
            ->updateOrCreate(
                ['user_id' => Auth::id()],
                $validated
            );

        return response()->json(['success' => true]);
    }
}