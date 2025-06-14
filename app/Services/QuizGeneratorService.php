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
        $this->apiKey = config('services.deepseek.api_key');
        $this->apiEndpoint = 'https://api.deepseek.com/v1/chat/completions';
        $this->model = 'deepseek-chat';
    }

    protected function getSystemPrompt(): string
    {
        return "You are a quiz generator that creates educational multiple-choice questions based on provided content. For each question:\n" .
               "1. Include a clear question text\n" .
               "2. Provide exactly 4 options or true or false questions\n" .
               "3. Mark one option as correct\n" .
               "4. Include an explanation for the correct answer\n" .
               "5. Return as JSON array with this structure:\n" .
               "6. Create at least 10 questions:\n" .
               "[\n" .
               "  {\n" .
               "    \"question\": \"question text\",\n" .
               "    \"type\": \"multiple_choice\",\n" .
               "    \"explanation\": \"explanation for the correct answer\",\n" .
               "    \"options\": [\n" .
               "      {\"text\": \"option text\", \"is_correct\": true|false, \"order\": 1},\n" .
               "      {\"text\": \"option text\", \"is_correct\": false, \"order\": 2},\n" .
               "      {\"text\": \"option text\", \"is_correct\": false, \"order\": 3},\n" .
               "      {\"text\": \"option text\", \"is_correct\": false, \"order\": 4}\n" .
               "    ]\n" .
               "  }\n
               ]";

               
    }

    public function generateFromNote(Note $note)
    {
        $prompt = AIPrompts::quizPrompt($note->content);
        
        return $this->sendRequest($prompt);
    }


}