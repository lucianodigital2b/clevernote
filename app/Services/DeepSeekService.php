<?php

namespace App\Services;

use App\Models\Mindmap;
use App\Models\Note;
use App\Services\Prompts\AIPrompts;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Client\RequestException;

class DeepSeekService extends AbstractAIService
{
    protected function initialize()
    {
        $this->apiKey = config('services.deepseek.api_key');
        $this->apiEndpoint = 'https://api.deepseek.com/v1/chat/completions';
        $this->model = 'deepseek-chat';
        
        if (empty($this->apiKey)) {
            throw new \RuntimeException('DeepSeek API key is not configured');
        }
    }

    protected function getSystemPrompt(): string
    {
        return 'You are a study assistant that always responds in valid JSON format.';
    }

    public function createStudyNote(string $transcription, ?string $language = null): array
    {
        $language = $language ?? $this->defaultLanguage;
        // dump($transcription);
        $prompt = AIPrompts::studyNotePrompt($transcription, $language);
        
        $studyNote = $this->sendRequest($prompt);
        
        return [
            'original_transcription' => $transcription,
            'study_note' => $studyNote,
        ];
    }

    public function generateFlashcardsFromNote(string $content, ?string $language = null): array
    {
        $language = $language ?? $this->defaultLanguage;
        $prompt = AIPrompts::flashcardPrompt($content, $language);
        
        return $this->sendRequest($prompt);
    }


    public function createMindMap(Note $note): Mindmap
    {
        $language = $language ?? $this->defaultLanguage;
        
        $prompt = AIPrompts::mindmapPrompt($note->content);
        $mindmapData = $this->sendRequest($prompt);

        $mindmap = Mindmap::create([
            'note_id' => $note->id,
            'title' => $note->title . ' Mindmap',
            'nodes' => $mindmapData['nodes'],
            'edges' => $mindmapData['edges'],
            'user_id' => $note->user_id,
        ]);

        return $mindmap;

    }
}
