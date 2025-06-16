<?php

namespace App\Http\Controllers;

use App\Models\Note;
use App\Models\Mindmap;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Services\DeepSeekService;
use App\Jobs\GenerateMindmapFromNote;

class MindmapController extends Controller
{
    protected $deepseekService;

    public function __construct(DeepSeekService $deepseekService)
    {
        $this->deepseekService = $deepseekService;
    }

    public function show(Mindmap $mindmap)
    {
        return Inertia::render('mindmaps/show', [
            'mindmap' => $mindmap->load('note'),
        ]);
    }

    public function generate(Note $note)
    {
        // Create a new mindmap record with pending status
        $mindmap = Mindmap::create([
            'note_id' => $note->id,
            'user_id' => auth()->id(),
            'title' => $note->title . ' - Mindmap',
            'nodes' => [],
            'edges' => [],
            'status' => 'pending'
        ]);

        // Dispatch the job to generate the mindmap
        GenerateMindmapFromNote::dispatch($note->id, $mindmap->id);

        return response()->json(['mindmap' => $mindmap]);
    }

    public function getMindmap(Mindmap $mindmap)
    {
        return response()->json(['mindmap' => $mindmap]);
    }

    public function update(Request $request, Mindmap $mindmap)
    {
        $validated = $request->validate([
            'nodes' => 'required|array',
            'edges' => 'required|array',
        ]);

        $mindmap->update($validated);

        return response()->json(['mindmap' => $mindmap]);
    }
}