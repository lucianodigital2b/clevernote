<?php

namespace App\Http\Controllers;

use App\Models\Note;
use App\Models\Mindmap;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Services\DeepSeekService;

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
        
        $mindmap = $this->deepseekService->createMindMap($note);

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