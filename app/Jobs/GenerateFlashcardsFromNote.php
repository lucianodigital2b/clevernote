<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Models\Note;
use App\Models\FlashcardSet;
use App\Models\Flashcard;
use App\Services\DeepSeekService;
use Illuminate\Support\Facades\Log;

class GenerateFlashcardsFromNote implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $noteId;
    protected $flashcardSetId;

    public function __construct(int $noteId, int $flashcardSetId)
    {
        $this->noteId = $noteId;
        $this->flashcardSetId = $flashcardSetId;
    }

    public function handle(DeepSeekService $deepSeekService)
    {
        $note = Note::findOrFail($this->noteId);
        $flashcardSet = FlashcardSet::findOrFail($this->flashcardSetId);

        try {
            // Update flashcard set status to generating
            $flashcardSet->update(['status' => 'generating']);
            
            $flashcards = $deepSeekService->generateFlashcardsFromNote($note->content);
            
            // Save flashcards and attach them to the flashcard set
            $createdFlashcards = collect($flashcards['flashcards'])->map(function ($card) use ($note) {
                return Flashcard::create([
                    'folder_id' => $note->folder_id ?? null,
                    'question' => $card['question'],
                    'answer' => $card['answer'],
                ]);
            });

            // Attach all flashcards to the flashcard set using the pivot table
            $flashcardSet->flashcards()->attach($createdFlashcards->pluck('id'));
            
            // Update flashcard set status to completed
            $flashcardSet->update(['status' => 'completed']);
            
            return $flashcardSet;
        } catch (\Exception $e) {
            // Update flashcard set status to failed
            $flashcardSet->update(['status' => 'failed']);
            Log::error('Failed to generate flashcards: ' . $e->getMessage());
            throw $e;
        }
    }
}