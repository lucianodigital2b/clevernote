<?php

namespace App\Http\Controllers;

use App\Models\Crossword;
use App\Models\Note;
use App\Jobs\GenerateCrosswordFromNote;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class CrosswordController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $crosswords = Crossword::where('user_id', Auth::id())
            ->with('note')
            ->orderBy('created_at', 'desc')
            ->paginate(12);

        return Inertia::render('Crosswords/Index', [
            'crosswords' => $crosswords
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(Crossword $crossword)
    {
        // Check if user owns this crossword
        if ($crossword->user_id !== Auth::id()) {
            abort(403);
        }

        $crossword->load('note');

        return Inertia::render('crosswords/Show', [
            'crossword' => $crossword
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Crossword $crossword)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Crossword $crossword)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Crossword $crossword)
    {
        // Check if user owns this crossword
        if ($crossword->user_id !== Auth::id()) {
            abort(403);
        }

        $crossword->delete();

        return redirect()->route('crosswords.index')
            ->with('success', 'Crossword deleted successfully');
    }

    /**
     * Generate a crossword from a note
     */
    public function generateFromNote(Request $request, Note $note)
    {
        // Check if user owns this note
        if ($note->user_id !== Auth::id()) {
            abort(403);
        }

        try {
            // Check if crossword already exists for this note
            $existingCrossword = Crossword::where('note_id', $note->id)
                ->where('user_id', Auth::id())
                ->first();

            if ($existingCrossword) {
                return response()->json([
                    'crossword_id' => $existingCrossword->id,
                    'message' => 'Crossword already exists for this note'
                ]);
            }

            // Create new crossword
            $crossword = Crossword::create([
                'note_id' => $note->id,
                'user_id' => Auth::id(),
                'title' => 'Crossword for: ' . $note->title,
                'puzzle_data' => [],
                'status' => 'pending'
            ]);

            // Dispatch job to generate crossword
            $language = $request->input('language', 'autodetect');
            GenerateCrosswordFromNote::dispatch($crossword, $language);

            Log::info('Crossword generation initiated', [
                'crossword_id' => $crossword->id,
                'note_id' => $note->id,
                'user_id' => Auth::id()
            ]);

            return response()->json([
                'crossword_id' => $crossword->id,
                'message' => 'Crossword generation started'
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to initiate crossword generation', [
                'note_id' => $note->id,
                'user_id' => Auth::id(),
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'error' => 'Failed to start crossword generation'
            ], 500);
        }
    }

    /**
     * Get crossword status
     */
    public function status(Crossword $crossword)
    {
        // Check if user owns this crossword
        if ($crossword->user_id !== Auth::id()) {
            abort(403);
        }

        return response()->json([
            'status' => $crossword->status,
            'title' => $crossword->title,
            'failure_reason' => $crossword->failure_reason,
            'puzzle_data' => $crossword->puzzle_data
        ]);
    }

    /**
     * Retry failed crossword generation
     */
    public function retry(Crossword $crossword)
    {
        // Check if user owns this crossword
        if ($crossword->user_id !== Auth::id()) {
            abort(403);
        }

        if ($crossword->status !== 'failed') {
            return response()->json([
                'error' => 'Crossword is not in failed state'
            ], 400);
        }

        try {
            // Reset crossword status
            $crossword->update([
                'status' => 'pending',
                'failure_reason' => null
            ]);

            // Dispatch job to regenerate crossword
            GenerateCrosswordFromNote::dispatch($crossword);

            return response()->json([
                'message' => 'Crossword regeneration started'
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to retry crossword generation', [
                'crossword_id' => $crossword->id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'error' => 'Failed to retry crossword generation'
            ], 500);
        }
    }
}