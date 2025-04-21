<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\FolderController;
use App\Http\Controllers\NoteController;
use App\Http\Controllers\FlashcardController;
use App\Http\Controllers\FlashcardSetController;
use App\Http\Controllers\FolderFlashcardController;
use App\Http\Controllers\DashboardController;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');


Route::middleware(['auth'])->group(function () {
    // Folder routes
    Route::resource('folders', FolderController::class);
    
    // Notes routes
    Route::resource('notes', NoteController::class);
    
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');


     
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
    Route::get('flashcard-sets/{flashcardSet}/study', [FlashcardSetController::class, 'study'])
        ->name('flashcard-sets.study');
    Route::post('flashcard-sets/{flashcardSet}/progress', [FlashcardSetController::class, 'saveProgress'])
        ->name('flashcard-sets.progress.store');


});




require __DIR__.'/settings.php';

require __DIR__.'/auth.php';

