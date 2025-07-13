<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\FolderController;
use App\Http\Controllers\NoteController;
use App\Http\Controllers\FlashcardController;
use App\Http\Controllers\FlashcardSetController;
use App\Http\Controllers\FolderFlashcardController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FeedbackController;
use App\Http\Controllers\MindmapController;
use App\Http\Controllers\OnboardingController;
use App\Http\Controllers\SubscriptionController;
use App\Http\Controllers\QuizController;
use App\Http\Controllers\QuizSharingController;
use App\Http\Controllers\StatisticsController;
use App\Models\User;
use App\Notifications\NewUserFeedback;
use Laravel\Horizon\Horizon;

Route::get('/', [App\Http\Controllers\WelcomeController::class, 'index'])->name('home');

// Public quiz routes (UUID-based)
Route::get('/quizzes/{uuid}', [QuizSharingController::class, 'showByUuid'])->name('quizzes.public.show');
Route::post('/quizzes/{uuid}/public/attempt', [QuizController::class, 'submitPublicAttempt'])->name('quizzes.public.attempt');

// Public note routes (UUID-based)
Route::get('/notes/{uuid}', [NoteController::class, 'showByUuid'])->name('notes.public.show');


Route::middleware(['auth'])->group(function () {
    // Folder routes
    Route::resource('folders', FolderController::class);
    
    // Notes routes
    Route::resource('notes', NoteController::class);
    Route::resource('feedback', FeedbackController::class);
    Route::post('/notes/{note}/retry', [NoteController::class, 'retryProcessing'])->name('notes.retry');
    

    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::post('/subscriptions/resume/{subscriptionId}', [SubscriptionController::class, 'resume']);
    Route::get('/subscriptions/list', [SubscriptionController::class, 'list']);
    Route::post('/subscriptions/cancel/{subscriptionId}', [SubscriptionController::class, 'cancel']);

    // Route::get('/chat', function () {
    //     return response()->eventStream(function () {
    //         $stream = OpenAI::client()->chat()->createStreamed(...);
    //         foreach ($stream as $response) {
    //             yield new StreamedEvent(
    //                 event: 'message',
    //                 data: json_encode($response->choices[0])
    //             );
    //         }
    //     });
    // });

    // Flashcard Routes
    Route::resource('flashcards', FlashcardController::class);
    Route::resource('folders.flashcards', FolderFlashcardController::class);
    Route::resource('flashcard-sets', FlashcardSetController::class);
    Route::get('flashcard-sets/{flashcardSet}/study', [FlashcardSetController::class, 'study'])->name('flashcard-sets.study');
    Route::post('flashcard-sets/{flashcardSet}/progress', [FlashcardSetController::class, 'saveProgress'])->name('flashcard-sets.progress.store');
    Route::post('notes/{note}/generate-flashcards', [NoteController::class, 'generateFlashcards'])->name('notes.generate-flashcards');

    // Quiz routes
    Route::resource('quizzes', QuizController::class);
    Route::prefix('quizzes')->group(function () {
        Route::post('/{quiz}/attempt', [QuizController::class, 'submitAttempt'])->name('quizzes.submit-attempt');
        Route::post('/generate-from-note/{note}', [QuizController::class, 'generateFromNote'])->name('quizzes.generate-from-note');
        Route::get('/{quiz}/study', [QuizController::class, 'show']);
        
        // Quiz Sharing and Leaderboard routes
        Route::get('/shared', [QuizSharingController::class, 'index'])->name('quizzes.shared');
        Route::get('/shared/{quiz}', [QuizSharingController::class, 'show'])->name('quizzes.shared.show');
        Route::post('/{quiz}/toggle-sharing', [QuizSharingController::class, 'toggleSharing'])->name('quizzes.toggle-sharing');
        Route::get('/{quiz}/leaderboard', [QuizSharingController::class, 'leaderboard'])->name('quizzes.leaderboard');
    });


    Route::post('/subscribe', [SubscriptionController::class, 'subscribe'])->name('billing.subscribe');
    Route::get('/setup-intent', [SubscriptionController::class, 'createSetupIntent'])->name('billing.setup-intent');
    Route::get('/billing/success', [SubscriptionController::class, 'success'])->name('billing.success');
    Route::get('/billing/cancel', [SubscriptionController::class, 'cancel'])->name('billing.cancel');
    Route::get('/checkout', fn () => Inertia::render('Billing/Checkout'))->middleware('auth');


    Route::get('/onboarding', [OnboardingController::class, 'show'])
        ->name('onboarding.show');
    Route::post('/onboarding', [OnboardingController::class, 'store'])
        ->name('onboarding.store');

    Route::post('/notes/{note}/generate-mindmap', [MindmapController::class, 'generate']);
    Route::get('/mindmaps/{mindmap}', [MindmapController::class, 'show'])->name('mindmaps.show');
    Route::patch('/mindmaps/{mindmap}', [MindmapController::class, 'update'])->name('mindmaps.update');

    
    Route::get('/statistics', [StatisticsController::class, 'index'])->name('statistics.index');

    // How page route
    Route::get('/how', fn () => Inertia::render('how'))->name('how');

});



Route::get('/terms', fn () => Inertia::render('Terms'))->name('terms');
Route::get('/policy', fn () => Inertia::render('Policy'))->name('policy');

// Google OAuth Routes
Route::get('auth/google', [\App\Http\Controllers\Auth\GoogleController::class, 'redirectToGoogle'])
    ->name('auth.google');
Route::get('auth/google/callback', [\App\Http\Controllers\Auth\GoogleController::class, 'handleGoogleCallback'])
    ->name('auth.google.callback');

// Apple OAuth Routes
Route::get('auth/apple', [\App\Http\Controllers\Auth\AppleController::class, 'redirectToApple'])
    ->name('auth.apple');
Route::get('auth/apple/callback', [\App\Http\Controllers\Auth\AppleController::class, 'handleAppleCallback'])
    ->name('auth.apple.callback');

// Apple JWT generation (for testing/admin purposes)
Route::get('/auth/apple/generate-jwt', [\App\Http\Controllers\Auth\AppleController::class, 'generateClientSecret'])
    ->name('auth.apple.generate-jwt')
    ->middleware(['auth', 'admin']); // Add appropriate middleware

require __DIR__.'/settings.php';

require __DIR__.'/auth.php';



Horizon::auth(function ($request) {
    return auth()->check() && auth()->user()->email == 'husky15@hotmail.com';
});
