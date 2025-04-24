<?php

namespace App\Services;

use App\Models\Quiz;
use App\Models\Note;
use OpenAI\Client;
use Illuminate\Support\Str;

class QuizGeneratorService
{
    protected $openai;

    public function __construct(Client $openai)
    {
        $this->openai = $openai;
    }

    public function generateFromNote(Note $note): Quiz
    {
        $prompt = $this->buildPrompt($note->content);
        $response = $this->openai->chat()->create([
            'model' => 'gpt-4',
            'messages' => [
                ['role' => 'system', 'content' => 'You are a quiz generator that creates educational multiple-choice questions based on provided content.'],
                ['role' => 'user', 'content' => $prompt]
            ],
            'temperature' => 0.7
        ]);

        $questions = $this->parseResponse($response);

        return Quiz::create([
            'title' => "Quiz on " . Str::limit($note->title, 50),
            'description' => "Automatically generated quiz from note: {$note->title}",
            'questions' => $questions,
            'user_id' => $note->user_id,
            'category_id' => null, // Can be set based on note's folder or tags
            'is_public' => false,
            'next_attempt_available_at' => now()
        ]);
    }

    protected function buildPrompt(string $content): string
    {
        return "Create a comprehensive multiple-choice quiz based on the following content. " .
               "Generate questions that test understanding of key concepts. " .
               "For each question, provide 4 options with one correct answer and an explanation. " .
               "Format the response as a JSON array of questions. Content: \n\n" . $content;
    }

    protected function parseResponse($response): array
    {
        $questions = json_decode($response->choices[0]->message->content, true);
        
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