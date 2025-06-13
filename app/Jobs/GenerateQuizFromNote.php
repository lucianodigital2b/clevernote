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
            
            $generatedQuiz = $quizGeneratorService->generateFromNote($note);
            
            // Copy questions from generated quiz to our existing quiz
            foreach ($generatedQuiz->questions as $question) {
                $newQuestion = $quiz->questions()->create([
                    'question' => $question->question,
                    'type' => $question->type,
                    'explanation' => $question->explanation,
                    'order' => $question->order
                ]);
                
                foreach ($question->options as $option) {
                    $newQuestion->options()->create([
                        'text' => $option->text,
                        'is_correct' => $option->is_correct,
                        'order' => $option->order
                    ]);
                }
            }
            
            // Delete the temporary generated quiz
            $generatedQuiz->delete();
            
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