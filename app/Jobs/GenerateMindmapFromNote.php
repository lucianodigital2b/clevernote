<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Models\Note;
use App\Models\Mindmap;
use App\Services\DeepSeekService;
use Illuminate\Support\Facades\Log;

class GenerateMindmapFromNote implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $noteId;
    protected $mindmapId;

    public function __construct(int $noteId, int $mindmapId)
    {
        $this->noteId = $noteId;
        $this->mindmapId = $mindmapId;
    }

    public function handle(DeepSeekService $deepSeekService)
    {
        $note = Note::findOrFail($this->noteId);
        $mindmap = Mindmap::findOrFail($this->mindmapId);

        try {
            // Update mindmap status to generating
            $mindmap->update(['status' => 'generating']);
            
            $response = $deepSeekService->createMindMap($note);
            
            // Log::info('Mindmap generation response: ' . print_r($response, true));
            
            // Update mindmap with the generated data
            $mindmap->update([
                'nodes' => $response['nodes'] ?? [],
                'edges' => $response['edges'] ?? [],
                'status' => 'completed'
            ]);
            
            return $mindmap;
        } catch (\Exception $e) {
            // Update mindmap status to failed
            $mindmap->update(['status' => 'failed']);
            Log::error('Failed to generate mindmap: ' . $e->getMessage());
            throw $e;
        }
    }
}