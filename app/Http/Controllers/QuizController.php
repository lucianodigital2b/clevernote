<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Jobs\UpdateUserStatistics;
use App\Models\Note;
use App\Models\Quiz;
use App\Models\QuizQuestion;
use App\Models\QuizOption;
use App\Models\QuizAttempt;
use App\Models\QuizAnswer;
use App\Services\QuizGeneratorService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class QuizController extends Controller
{
    protected $quizGeneratorService;

    public function __construct(QuizGeneratorService $quizGeneratorService)
    {
        $this->quizGeneratorService = $quizGeneratorService;
    }

    public function index()
    {
        $quizzes = Quiz::with(['questions.options'])
            ->where('user_id', Auth::id())
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return Inertia::render('Quizzes/Index', [
            'quizzes' => $quizzes
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'questions' => 'required|array|min:1',
            'questions.*.question' => 'required|string',
            'questions.*.type' => 'required|string|in:multiple-choice,true-false,fill-in-blank',
            'questions.*.explanation' => 'nullable|string',
            'questions.*.options' => 'required|array|min:2',
            'questions.*.options.*.text' => 'required|string',
            'questions.*.correctOptionId' => 'required|string'
        ]);

        try {
            DB::beginTransaction();

            $quiz = Quiz::create([
                'title' => $validated['title'],
                'description' => $validated['description'] ?? null,
                'user_id' => Auth::id(),
            ]);

            foreach ($validated['questions'] as $index => $questionData) {
                $question = $quiz->questions()->create([
                    'question' => $questionData['question'],
                    'type' => $questionData['type'],
                    'explanation' => $questionData['explanation'] ?? null,
                    'order' => $index,
                ]);

                foreach ($questionData['options'] as $optionIndex => $option) {
                    $question->options()->create([
                        'text' => $option['text'],
                        'is_correct' => $option['id'] === $questionData['correctOptionId'],
                        'order' => $optionIndex,
                    ]);
                }
            }

            DB::commit();
            return response()->json($quiz->load('questions.options'), 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to create quiz'], 500);
        }
    }

    public function show(Quiz $quiz)
    {
        $this->authorize('view', $quiz);

        return Inertia::render('Quizzes/Show', [
            'quiz' => $quiz->load(['questions.options'])
        ]);
    }

    public function update(Request $request, Quiz $quiz)
    {
        $this->authorize('update', $quiz);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_published' => 'boolean',
            'questions' => 'required|array|min:1',
            'questions.*.id' => 'nullable|exists:quiz_questions,id',
            'questions.*.question' => 'required|string',
            'questions.*.type' => 'required|string|in:multiple-choice,true-false,fill-in-blank',
            'questions.*.explanation' => 'nullable|string',
            'questions.*.options' => 'required|array|min:2',
            'questions.*.options.*.id' => 'nullable|exists:quiz_options,id',
            'questions.*.options.*.text' => 'required|string',
            'questions.*.correctOptionId' => 'required|string'
        ]);

        try {
            DB::beginTransaction();

            $quiz->update([
                'title' => $validated['title'],
                'description' => $validated['description'] ?? null,
                'is_published' => $validated['is_published'] ?? false,
            ]);

            // Remove questions and options not in the update
            $questionIds = collect($validated['questions'])->pluck('id')->filter();
            $quiz->questions()->whereNotIn('id', $questionIds)->delete();

            foreach ($validated['questions'] as $index => $questionData) {
                $question = $quiz->questions()->updateOrCreate(
                    ['id' => $questionData['id'] ?? null],
                    [
                        'question' => $questionData['question'],
                        'type' => $questionData['type'],
                        'explanation' => $questionData['explanation'] ?? null,
                        'order' => $index,
                    ]
                );

                $optionIds = collect($questionData['options'])->pluck('id')->filter();
                $question->options()->whereNotIn('id', $optionIds)->delete();

                foreach ($questionData['options'] as $optionIndex => $option) {
                    $question->options()->updateOrCreate(
                        ['id' => $option['id'] ?? null],
                        [
                            'text' => $option['text'],
                            'is_correct' => $option['id'] === $questionData['correctOptionId'],
                            'order' => $optionIndex,
                        ]
                    );
                }
            }

            DB::commit();
            return response()->json($quiz->load('questions.options'));

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to update quiz'], 500);
        }
    }

    public function destroy(Request $request, Quiz $quiz)
    {
        $this->authorize('delete', $quiz);

        $quiz->delete();
        if($request->wantsJson()) {
            return response()->json([
                'message' => __('quiz_deleted_successfully')
            ]);
        }

        return redirect()->back()->with('success', __('quiz_deleted_successfully'));

    }

    public function submitAttempt(Request $request, Quiz $quiz)
    {
        $validated = $request->validate([
            'answers' => 'required|array',
            'answers.*.question_id' => 'required|exists:quiz_questions,id',
            'answers.*.option_id' => 'required|exists:quiz_options,id',
        ]);

        try {
            DB::beginTransaction();

            $score = 0;
            $totalQuestions = count($validated['answers']);

            $attempt = QuizAttempt::create([
                'quiz_id' => $quiz->id,
                'user_id' => Auth::id(),
                'total_questions' => $totalQuestions,
                'completed_at' => now(),
                'score' => 0,
            ]);

            foreach ($validated['answers'] as $answer) {
                $option = QuizOption::find($answer['option_id']);
                $isCorrect = $option->is_correct;

                if ($isCorrect) {
                    $score++;
                }

                QuizAnswer::create([
                    'quiz_attempt_id' => $attempt->id,
                    'quiz_question_id' => $answer['question_id'],
                    'quiz_option_id' => $answer['option_id'],
                    'is_correct' => $isCorrect,
                ]);
            }

            $attempt->update(['score' => $score]);

            UpdateUserStatistics::dispatch(auth()->id(), Carbon::today());
    
            
            DB::commit();
            return response()->json([
                'score' => $score,
                'total' => $totalQuestions,
                'percentage' => ($score / $totalQuestions) * 100,
            ]);

        } catch (\Exception $e) {
            dd($e->getMessage());
            DB::rollBack();
            return response()->json(['message' => 'Failed to submit quiz attempt'], 500);
        }
    }

    public function generateFromNote(Request $request, Note $note)
    {
        try {
            DB::beginTransaction();

            $quiz = $this->quizGeneratorService->generateFromNote($note);

            DB::commit();
            return response()->json([
                'message' => 'Quiz generated successfully',
                'quiz' => $quiz
            ]);

        } catch (\Exception $e) {
            dd($e->getMessage());
            DB::rollBack();
            return response()->json(['message' => 'Failed to submit quiz attempt: ' . $e->getMessage()], 500);
        }
    }
}