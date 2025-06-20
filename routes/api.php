<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\FlashcardAIController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\FolderController;
use App\Http\Controllers\NoteController;
use App\Http\Controllers\FlashcardController;
use App\Http\Controllers\FlashcardSetController;
use App\Http\Controllers\FolderFlashcardController;
use App\Http\Controllers\MindmapController;
use App\Http\Controllers\OnboardingController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\SubscriptionController;
use App\Http\Controllers\QuizController;
use App\Http\Controllers\QuizSharingController;
use App\Http\Controllers\StatisticsController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// AI Flashcard Generation Routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/flashcards/generate', [FlashcardAIController::class, 'generate']);
    Route::post('/folders/{folder}/flashcards/generate', [FlashcardAIController::class, 'generateForFolder']);
    // Folder routes
    Route::resource('folders', FolderController::class);
    
    // Notes routes
    Route::resource('notes', NoteController::class);
    Route::post('/notes/{note}/retry', [NoteController::class, 'retryProcessing'])->name('notes.retry');
    
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

    Route::get('/onboarding', [OnboardingController::class, 'show'])
        ->name('onboarding.show');
    Route::post('/onboarding', [OnboardingController::class, 'store'])
        ->name('onboarding.store');

    Route::post('/notes/{note}/generate-mindmap', [MindmapController::class, 'generate']);
    Route::get('/mindmaps/{mindmap}', [MindmapController::class, 'show'])->name('mindmaps.show');
    Route::patch('/mindmaps/{mindmap}', [MindmapController::class, 'update'])->name('mindmaps.update');

    
    Route::get('/statistics', [StatisticsController::class, 'index'])->name('statistics.index');
});


Route::middleware(['auth'])->group(function () {

    Route::post('/check-subscription', [SubscriptionController::class, 'checkSubscription']);
    Route::post('/notes/{note}/media', [NoteController::class, 'upload']);
    Route::post('/flashcard-sets/{flashcardSet}/media', [\App\Http\Controllers\FlashcardSetController::class, 'uploadMedia']);
    Route::post('/flashcards/{flashcard}/media', [\App\Http\Controllers\FlashcardController::class, 'uploadMedia']);

    Route::get('/folders-with-counts', [FolderController::class, 'getFoldersWithCounts']);

});

// Public pricing plans route (no auth required)
Route::get('/pricing-plans', [ProductController::class, 'getPricingPlans']);

Route::post('login', [AuthenticatedSessionController::class, 'store']);
Route::post('register', [RegisteredUserController::class, 'store']);


// Apple OAuth Routes
Route::get('auth/apple', [\App\Http\Controllers\Auth\AppleController::class, 'redirectToApple'])
    ->name('auth.apple');
Route::get('auth/apple/callback', [\App\Http\Controllers\Auth\AppleController::class, 'handleAppleCallback'])
    ->name('auth.apple.callback');
    
Route::get('/test', function(){
    return 'test';
});
