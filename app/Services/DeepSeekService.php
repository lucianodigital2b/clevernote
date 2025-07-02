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
        $this->apiKey = config('services.openai.api_key');
        $this->apiEndpoint = 'https://api.openai.com/v1/chat/completions';
        $this->model = 'gpt-4o';
    }

    protected function getSystemPrompt(): string
    {
        return 'You are an expert educational content creator and study assistant. Your role is to transform raw content into comprehensive, detailed study materials that help students deeply understand complex topics. Always respond in valid JSON format with rich, educational content that demonstrates mastery-level understanding of the subject matter.';
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


    public function createMindMap(Note $note)
    {
        $language = $language ?? $this->defaultLanguage;
        
        $prompt = AIPrompts::mindmapPrompt($note->content);
        return $this->sendRequest($prompt);
    }

    public function generateStudyPlan(array $surveyData, ?string $language = null): array
    {
        $language = $language ?? $this->defaultLanguage;
        $prompt = AIPrompts::studyPlanPrompt($surveyData, $language);
        
        return $this->sendRequest($prompt);
    }
}
