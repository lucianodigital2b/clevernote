<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\FlashcardAIController;
use App\Http\Controllers\FolderController;
use App\Http\Controllers\NoteController;
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
    Route::get('/folders-with-counts', [FolderController::class, 'getFoldersWithCounts']);

});

