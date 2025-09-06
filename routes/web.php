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
use App\Http\Controllers\CrosswordController;
use App\Http\Controllers\GroupController;
use App\Http\Controllers\FocusController;
use App\Http\Controllers\DebugController;
use App\Http\Controllers\ToolsController;
use App\Models\User;
use App\Notifications\NewUserFeedback;
use Laravel\Horizon\Horizon;

Route::get('/', [App\Http\Controllers\WelcomeController::class, 'index'])->name('home');

// Blog routes (internationalized)
Route::get('/blog/{locale}', [App\Http\Controllers\BlogController::class, 'index'])->name('blog.index');
Route::get('/blog/{locale}/{slug}', [App\Http\Controllers\BlogController::class, 'show'])->name('blog.show');

// Free Tools routes
Route::get('/tools/{locale}', [ToolsController::class, 'index'])->name('tools.index');
Route::get('/tools/{locale}/note-template-generator', [ToolsController::class, 'noteTemplateGenerator'])->name('tools.note-template-generator');
Route::get('/tools/{locale}/study-schedule-planner', [ToolsController::class, 'studySchedulePlanner'])->name('tools.study-schedule-planner');
Route::get('/tools/{locale}/flashcard-creator', [ToolsController::class, 'flashcardCreator'])->name('tools.flashcard-creator');
Route::get('/tools/{locale}/note-taking-style-quiz', [ToolsController::class, 'noteTakingStyleQuiz'])->name('tools.note-taking-style-quiz');
Route::get('/tools/{locale}/productivity-calculator', [ToolsController::class, 'productivityCalculator'])->name('tools.productivity-calculator');

// Public note routes (UUID-based)
Route::get('/notes/{uuid}', [NoteController::class, 'showByUuid'])->name('notes.public.show');

// Billing checkout route (accessible to both authenticated and non-authenticated users)
Route::get('/billing/checkout', fn () => Inertia::render('Billing/Checkout'))->name('billing.checkout');

// Billing subscription routes (accessible to both authenticated and non-authenticated users)
Route::post('/subscribe', [SubscriptionController::class, 'subscribe'])->name('billing.subscribe');
Route::get('/setup-intent', [SubscriptionController::class, 'createSetupIntent'])->name('billing.setup-intent');

Route::middleware(['auth'])->group(function () {
    // Folder routes
    Route::resource('folders', FolderController::class);
    
    // Tags routes
    Route::resource('tags', \App\Http\Controllers\TagController::class);
    
    // Groups routes
    Route::resource('groups', GroupController::class);
    Route::post('groups/{group}/invite', [GroupController::class, 'invite'])->name('groups.invite');
    Route::delete('groups/{group}/members/{user}', [GroupController::class, 'removeMember'])->name('groups.remove-member');
    
    // Notes routes
    Route::resource('notes', NoteController::class);
    Route::resource('feedback', FeedbackController::class);
    Route::post('/notes/{note}/retry', [NoteController::class, 'retryProcessing'])->name('notes.retry');
    
    // Crossword routes
    Route::resource('crosswords', CrosswordController::class);
    Route::post('/notes/{note}/generate-crossword', [CrosswordController::class, 'generateFromNote'])->name('notes.generate-crossword');
    Route::get('/crosswords/{crossword}/status', [CrosswordController::class, 'status'])->name('crosswords.status');
    Route::post('/crosswords/{crossword}/retry', [CrosswordController::class, 'retry'])->name('crosswords.retry');
    

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
    
    // Podcast routes
    Route::post('notes/{note}/generate-podcast', [NoteController::class, 'generatePodcast'])->name('notes.generate-podcast');
    Route::get('notes/{note}/podcast-status', [NoteController::class, 'podcastStatus'])->name('notes.podcast-status');
    Route::delete('notes/{note}/podcast', [NoteController::class, 'deletePodcast'])->name('notes.delete-podcast');
    Route::get('notes/{note}/podcasts/{filename}', [NoteController::class, 'servePodcast'])->name('notes.serve-podcast');

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

    // Focus routes
    Route::prefix('focus')->group(function () {
        Route::get('/', [FocusController::class, 'index'])->name('focus.index');
        Route::post('/start', [FocusController::class, 'start'])->name('focus.start');
        Route::post('/pause', [FocusController::class, 'pause'])->name('focus.pause');
        Route::post('/resume', [FocusController::class, 'resume'])->name('focus.resume');
        Route::post('/complete', [FocusController::class, 'complete'])->name('focus.complete');
        Route::post('/cancel', [FocusController::class, 'cancel'])->name('focus.cancel');
        Route::get('/status', [FocusController::class, 'status'])->name('focus.status');
        Route::get('/statistics', [FocusController::class, 'statistics'])->name('focus.statistics');
        Route::get('/leaderboard', [FocusController::class, 'leaderboard'])->name('focus.leaderboard');
        Route::get('/level-leaderboard', [FocusController::class, 'levelLeaderboard'])->name('focus.level-leaderboard');
        Route::get('/history', [FocusController::class, 'history'])->name('focus.history');
    });
    
    // How page route
    Route::get('/how', fn () => Inertia::render('how'))->name('how');
});

// Public quiz routes (UUID-based) - Must come after resource routes to avoid conflicts
Route::get('/quizzes/{uuid}', [QuizSharingController::class, 'showByUuid'])->name('quizzes.public.show');
Route::post('/quizzes/{uuid}/public/attempt', [QuizController::class, 'submitPublicAttempt'])->name('quizzes.public.attempt');



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

// Debug routes - restricted to specific admin email
Route::middleware(['auth', 'admin.email'])->group(function () {
    Route::get('/debug/bucket-contents', [DebugController::class, 'bucketContents'])
        ->name('debug.bucket-contents');
    
    Route::get('/debug/download-file', [DebugController::class, 'downloadFile'])
        ->name('debug.download-file');
    
    Route::get('/debug/download-note-files', [DebugController::class, 'downloadNoteFiles'])
        ->name('debug.download-note-files');
    
    Route::get('/debug/export-notes', [DebugController::class, 'exportNotesData'])
        ->name('debug.export-notes');
    
    // Admin news management
    Route::get('/admin/news', function () {
        return \Inertia\Inertia::render('admin/news');
    })->name('admin.news');
});

require __DIR__.'/settings.php';

require __DIR__.'/auth.php';



Horizon::auth(function ($request) {
    // return auth()->check() && auth()->user()->email == 'husky15@hotmail.com';
    return true;
});
