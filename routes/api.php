<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\FlashcardAIController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\FolderController;
use App\Http\Controllers\NoteController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\SubscriptionController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// AI Flashcard Generation Routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/flashcards/generate', [FlashcardAIController::class, 'generate']);
    Route::post('/folders/{folder}/flashcards/generate', [FlashcardAIController::class, 'generateForFolder']);
});


Route::middleware(['auth'])->group(function () {

    Route::post('/check-subscription', [SubscriptionController::class, 'checkSubscription']);
    Route::resource('notes', NoteController::class);
    Route::post('/notes/{note}/media', [NoteController::class, 'upload']);
    Route::post('/flashcard-sets/{flashcardSet}/media', [\App\Http\Controllers\FlashcardSetController::class, 'uploadMedia']);
    Route::post('/flashcards/{flashcard}/media', [\App\Http\Controllers\FlashcardController::class, 'uploadMedia']);

    Route::get('/folders-with-counts', [FolderController::class, 'getFoldersWithCounts']);

});

// Public pricing plans route (no auth required)
Route::get('/pricing-plans', [ProductController::class, 'getPricingPlans']);

Route::post('login', [AuthenticatedSessionController::class, 'store']);
Route::post('register', [RegisteredUserController::class, 'store']);


Route::get('/test', function(){
    return 'test';
});
