<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\FolderController;
use App\Http\Controllers\NoteController;


Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');


Route::middleware(['auth'])->group(function () {

    Route::resource('notes', NoteController::class);
    Route::get('/folders-with-counts', [FolderController::class, 'getFoldersWithCounts']);

});

