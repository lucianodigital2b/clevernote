<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Jobs\UpdateUserStatistics;
use App\Models\Note;
use App\Models\Quiz;
use App\Models\QuizQuestion;
use App\Models\QuizOption;
use Spatie\MediaLibrary\MediaCollections\Models\Media;
use App\Models\QuizAttempt;
use App\Models\QuizAnswer;
use App\Services\QuizGeneratorService;
use App\Jobs\GenerateQuizFromNote;
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

    public function index(Request $request)
    {
        $quizzes = Quiz::with(['questions.options'])
            ->where('user_id', Auth::id())
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        if ($request->wantsJson()) {
            return response()->json([
                'quizzes' => $quizzes
            ]);
        }

        return Inertia::render('Quizzes/Index', [
            'quizzes' => $quizzes
        ]);
    }

    public function create(Request $request)
    {
        if ($request->wantsJson()) {
            return response()->json([
                'message' => 'Create quiz form data'
            ]);
        }

        return Inertia::render('Quizzes/Create');
    }

    public function edit(Request $request, Quiz $quiz)
    {
        return Inertia::render('Quizzes/Edit',[
            'quiz' => $quiz->load('questions.options',),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_published' => 'boolean|nullable',
            // 'questions' => 'required|array|min:1',
            // 'questions.*.question' => 'required|string',
            // 'questions.*.type' => 'required|string|in:multiple_choice,true_false,fill-in-blank',
            // 'questions.*.explanation' => 'nullable|string',
            // 'questions.*.options' => 'required|array|min:2',
            // 'questions.*.options.*.id' => 'required|string',
            // 'questions.*.options.*.text' => 'required|string',
            // 'questions.*.options.*.is_correct' => 'required_if:questions.*.type,multiple_choice,true_false|boolean'
        ]);

        try {
            DB::beginTransaction();

            $quiz = Quiz::create([
                'title' => $validated['title'],
                'description' => $validated['description'] ?? null,
                'is_published' => $validated['is_published'] ?? false,
                'user_id' => Auth::id(),
            ]);

            // foreach ($validated['questions'] as $index => $questionData) {
            //     $question = $quiz->questions()->create([
            //         'question' => $questionData['question'],
            //         'type' => $questionData['type'],
            //         'explanation' => $questionData['explanation'] ?? null,
            //         'order' => $index,
            //     ]);

            //     foreach ($questionData['options'] as $optionIndex => $option) {
            //         $question->options()->create([
            //             'text' => $option['text'],
            //             'is_correct' => $option['is_correct'] ?? false,
            //             'order' => $optionIndex,
            //         ]);
            //     }
            // }

            DB::commit();
            
            if ($request->wantsJson()) {
                return response()->json([
                    'message' => 'Quiz created successfully!',
                    'quiz' => $quiz->load(['questions.options'])
                ], 201);
            }

            // Redirect to quiz index with success message
            return redirect()->route('quizzes.edit', $quiz->id)
                ->with('success', 'Quiz created successfully!');

        } catch (\Exception $e) {
            DB::rollBack();
            
            if ($request->wantsJson()) {
                return response()->json([
                    'message' => "Failed to create quiz. {$e->getMessage()}"
                ], 500);
            }
            
            // Return back with errors for Inertia
            return back()->withErrors([
                'general' => "Failed to create quiz. {$e->getMessage()}"
            ])->withInput();
        }
    }

    public function show(Request $request, Quiz $quiz)
    {
        $this->authorize('view', $quiz);

        if ($request->wantsJson()) {
            return response()->json([
                'quiz' => $quiz->load(['questions.options'])
            ]);
        }

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
            // 'questions.*.id' => 'nullable|exists:quiz_questions,id',
            'questions.*.question' => 'required|string',
            'questions.*.type' => 'required|string|in:multiple_choice,true_false,fill-in-blank',
            'questions.*.explanation' => 'nullable|string',
            'questions.*.options' => 'required|array|min:2',
            // 'questions.*.options.*.id' => 'nullable|exists:quiz_options,id',
            'questions.*.options.*.text' => 'required|string',
            'questions.*.options.*.is_correct' => 'required_if:questions.*.type,multiple_choice,true_false|boolean'
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
                            'is_correct' => $option['is_correct'] ?? false,
                            'order' => $optionIndex,
                        ]
                    );
                }
            }

            DB::commit();
            if($request->wantsJson()){
                return response()->json($quiz->load('questions.options'));

            }

            return redirect()->back()->with('success', 'Quiz created successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            
            if ($request->wantsJson()) {
                return response()->json(['message' => 'Failed to update quiz'], 500);
            }
            
            return back()->withErrors([
                'general' => 'Failed to update quiz'
            ])->withInput();
        }
    }

    public function destroy(Request $request, Quiz $quiz)
    {
        $this->authorize('delete', $quiz);

        $quiz->delete();
        if ($request->wantsJson()) {
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

            UpdateUserStatistics::dispatch(Auth::user()->id, Carbon::today());
    
            
            DB::commit();
            return response()->json([
                'score' => $score,
                'total' => $totalQuestions,
                'percentage' => ($score / $totalQuestions) * 100,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            
            if ($request->wantsJson()) {
                return response()->json(['message' => 'Failed to submit quiz attempt'], 500);
            }
            
            return back()->withErrors([
                'general' => 'Failed to submit quiz attempt'
            ]);
        }
    }

    public function generateFromNote(Request $request, Note $note)
    {
        try {
            // Create quiz immediately with pending status
            $quiz = Quiz::create([
                'title' => $note->title,
                'user_id' => Auth::id(),
                'note_id' => $note->id,
                'is_published' => false,
                'status' => 'generating' // Add status field to track generation
            ]);
            
            // Dispatch job to generate questions in background
            GenerateQuizFromNote::dispatch($note->id, $quiz->id);
            
            return response()->json([
                'message' => 'Quiz generation started',
                'quiz_id' => $quiz->id,
                'note' => $note
            ]);

        } catch (\Exception $e) {
            if ($request->wantsJson()) {
                return response()->json(['message' => 'Failed to start quiz generation: ' . $e->getMessage()], 500);
            }
            
            return back()->withErrors([
                'general' => 'Failed to start quiz generation: ' . $e->getMessage()
            ]);
        }
    }


}
