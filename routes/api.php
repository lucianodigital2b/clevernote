<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\FeedbackController;
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

Route::middleware('auth:sanctum')->post('/feedback', [FeedbackController::class, 'store']);
Route::middleware('auth:sanctum')->get('/feedback/stats', [FeedbackController::class, 'stats']);

// AI Flashcard Generation Routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/flashcards/generate', [FlashcardAIController::class, 'generate']);
    Route::post('/folders/{folder}/flashcards/generate', [FlashcardAIController::class, 'generateForFolder']);
    // Folder routes
    Route::resource('folders', FolderController::class)->names('api.folders');
    
    // Notes routes
    Route::resource('notes', NoteController::class)->names('api.notes');
    Route::post('/notes/{note}/retry', [NoteController::class, 'retryProcessing']);
    Route::get('/notes/{note}/status', [NoteController::class, 'status']);
    Route::patch('/notes/{note}/status', [NoteController::class, 'updateStatus']);
    
    Route::get('/mindmaps/{mindmap}/status', [MindmapController::class, 'status']);

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
    Route::resource('flashcards', FlashcardController::class)->names('api.flashcards');
    // Route::resource('folders.flashcards', FolderFlashcardController::class)->names('api.flashcard-sets');
    Route::resource('flashcard-sets', FlashcardSetController::class)->names('api.flashcard-sets');
    Route::get('flashcard-sets/{flashcardSet}/study', [FlashcardSetController::class, 'study']);
    Route::post('flashcard-sets/{flashcardSet}/progress', [FlashcardSetController::class, 'saveProgress']);
    Route::post('notes/{note}/generate-flashcards', [NoteController::class, 'generateFlashcards']);

    // Quiz routes
    Route::resource('quizzes', QuizController::class)->names('api.quizzes');
    Route::prefix('quizzes')->group(function () {
        Route::post('/{quiz}/attempt', [QuizController::class, 'submitAttempt']);
        Route::post('/generate-from-note/{note}', [QuizController::class, 'generateFromNote']);
        
        // Quiz Sharing and Leaderboard routes
        Route::get('/shared', [QuizSharingController::class, 'index']);
        Route::get('/shared/{quiz}', [QuizSharingController::class, 'show']);
        Route::post('/{quiz}/toggle-sharing', [QuizSharingController::class, 'toggleSharing']);
        Route::get('/{quiz}/leaderboard', [QuizSharingController::class, 'leaderboard']);
    });

    Route::post('/subscribe', [SubscriptionController::class, 'subscribe']);
    Route::get('/setup-intent', [SubscriptionController::class, 'createSetupIntent']);
    Route::get('/billing/success', [SubscriptionController::class, 'success']);
    Route::get('/billing/cancel', [SubscriptionController::class, 'cancel']);

    Route::get('/onboarding', [OnboardingController::class, 'show']);
    Route::post('/onboarding', [OnboardingController::class, 'store']);

    Route::post('/notes/{note}/generate-mindmap', [MindmapController::class, 'generate']);
    Route::get('/mindmaps/{mindmap}', [MindmapController::class, 'show']);
    Route::patch('/mindmaps/{mindmap}', [MindmapController::class, 'update']);

    
    Route::get('/statistics', [StatisticsController::class, 'index']);
    Route::get('/statistics/daily', [StatisticsController::class, 'daily']);
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

Route::post('auth/google/callback', [\App\Http\Controllers\Auth\GoogleController::class, 'handleMobileGoogleAuth']);

    
Route::get('/test', function(){
    return 'test';
});
