<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Models\Note;
use App\Models\Quiz;
use App\Services\QuizGeneratorService;
use Illuminate\Support\Facades\Log;

class GenerateQuizFromNote implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $noteId;
    protected $quizId;

    public function __construct(int $noteId, int $quizId)
    {
        $this->noteId = $noteId;
        $this->quizId = $quizId;
    }

    public function handle(QuizGeneratorService $quizGeneratorService)
    {
        $note = Note::findOrFail($this->noteId);
        $quiz = Quiz::findOrFail($this->quizId);

        try {
            // Update quiz status to generating
            $quiz->update(['status' => 'generating']);
            
            $response = $quizGeneratorService->generateFromNote($note);
            
            // Log::error(print_r($response, true));
            // Extract questions from the JSON response
            $questions = $response['quiz'] ?? [];
            
            // Create questions from the JSON response
            foreach ($questions as $index => $questionData) {
                $newQuestion = $quiz->questions()->create([
                    'question' => $questionData['question'],
                    'type' => $questionData['type'] ?? 'multiple_choice',
                    'explanation' => $questionData['explanation'] ?? '',
                    'order' => $index + 1
                ]);
                
                // Create options from the JSON response
                foreach ($questionData['options'] as $optionData) {
                    $newQuestion->options()->create([
                        'text' => $optionData['text'],
                        'is_correct' => $optionData['is_correct'] === '1' || $optionData['is_correct'] === 1,
                        'order' => $optionData['order']
                    ]);
                }
            }
            
            // Update quiz status to completed
            $quiz->update(['status' => 'completed']);
            
            return $quiz;
        } catch (\Exception $e) {
            // Update quiz status to failed
            $quiz->update(['status' => 'failed']);
            Log::error('Failed to generate quiz: ' . $e->getMessage());
            throw $e;
        }
    }
}