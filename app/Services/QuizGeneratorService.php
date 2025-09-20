<?php

namespace App\Services;

use App\Models\Quiz;
use App\Models\Note;
use OpenAI\Client;
use Illuminate\Support\Str;
use App\Services\Prompts\AIPrompts;

class QuizGeneratorService extends AbstractAIService
{
    protected function initialize()
    {
        $this->apiKey = config('services.openai.api_key');
        $this->apiEndpoint = 'https://api.openai.com/v1/chat/completions';
        $this->model = 'gpt-4o';
    }

    protected function getSystemPrompt(): string
    {
        return "You are a quiz generator that creates educational multiple-choice questions based on provided content. For each question:\n" .
               "1. Include a clear question text\n" .
               "2. Provide exactly 4 options or true or false questions\n" .
               "3. Mark one option as correct\n" .
               "4. Include an explanation for the correct answer\n" .
               "5. Return as JSON array with this structure:\n" .
               "6. Create at least 10 questions:\n";
               
    }

    public function generateFromNote(Note $note)
    {
        $prompt = AIPrompts::quizPrompt($note->content);
        
        return $this->sendRequest($prompt);
    }

    protected function getServiceName(): string
    {
        return 'QuizGeneratorService';
    }
}