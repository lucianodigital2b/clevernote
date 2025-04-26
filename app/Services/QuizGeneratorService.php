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
        $this->model = 'gpt-4';
    }

    protected function getSystemPrompt(): string
    {
        return 'You are a quiz generator that creates educational multiple-choice questions based on provided content.';
    }

    public function generateFromNote(Note $note): Quiz
    {
        $prompt = AIPrompts::quizPrompt($note->content);
        $questions = $this->sendRequest($prompt);

        return Quiz::create([
            'title' => "Quiz on " . Str::limit($note->title, 50),
            'description' => "Automatically generated quiz from note: {$note->title}",
            'questions' => $this->formatQuestions($questions),
            'user_id' => $note->user_id,
            'category_id' => null,
            'is_public' => false,
            'next_attempt_available_at' => now()
        ]);
    }

    protected function formatQuestions(array $questions): array
    {
        return array_map(function ($q) {
            return [
                'id' => Str::uuid(),
                'question' => $q['question'],
                'options' => array_map(function ($opt, $index) {
                    return [
                        'id' => (string)($index + 1),
                        'text' => $opt
                    ];
                }, $q['options'], array_keys($q['options'])),
                'correctOptionId' => (string)($q['correctIndex'] + 1),
                'explanation' => $q['explanation'] ?? null
            ];
        }, $questions);
    }
}