<?php

namespace App\Services;

use App\Models\Note;
use App\Models\FlashcardSet;
use Illuminate\Support\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Smalot\PdfParser\Parser;

class NoteService
{
    public function extractTextFromPdf($path)
    {
        if (empty($path)) {
            throw new \InvalidArgumentException('PDF file path is required');
        }

        try {
            $parser = new Parser();
            $pdf = $parser->parseFile(storage_path('app/public/' . $path));
            
            $text = $pdf->getText();
            
            if (empty($text)) {
                throw new \RuntimeException('Could not extract text from PDF');
            }
            
            return $text;
        } catch (\Exception $e) {
            throw new \RuntimeException('Failed to process PDF file: ' . $e->getMessage());
        }
    }
    
    /**
     * Get paginated notes for a user
     */
    public function getUserNotes(int $userId, array $filters = []): LengthAwarePaginator
    {
        $query = Note::where('user_id', $userId);

        if (isset($filters['folder_id'])) {
            $query->where('folder_id', $filters['folder_id']);
        }

        if (isset($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('title', 'like', "%{$filters['search']}%")
                  ->orWhere('content', 'like', "%{$filters['search']}%");
            });
        }

        if (isset($filters['tag_id'])) {
            $query->whereHas('tags', function ($q) use ($filters) {
                $q->where('tags.id', $filters['tag_id']);
            });
        }

        return $query->with(['tags', 'folder'])
                    ->orderBy('is_pinned', 'desc')
                    ->orderBy('updated_at', 'desc')
                    ->paginate(15);
    }

    /**
     * Create a new note
     */
    public function createNote(array $data): Note
    {
        $note = Note::create($data);

        if (isset($data['tags'])) {
            $note->tags()->sync($data['tags']);
        }

        return $note->load(['tags', 'folder']);
    }

    /**
     * Update an existing note
     */
    public function updateNote(Note $note, array $data): Note
    {
        $note->update($data);

        if (isset($data['tags'])) {
            $note->tags()->sync($data['tags']);
        }

        return $note->load(['tags', 'folder']);
    }

    /**
     * Delete a note and its related resources
     */
    public function deleteNote(Note $note, bool $delete_related_items = false): bool
    {
        // Delete associated flashcard sets and quizzes if requested
        if ($delete_related_items) {
            // Delete flashcard sets and their relationships
            $note->flashcardSets->each(function ($set) {
                $set->flashcards()->detach();
                $set->delete();
            });
            
            // Delete associated quizzes
            $note->quizzes()->delete();
        }

        // Delete all media collections
        $note->clearMediaCollection('note-images');
        $note->clearMediaCollection('note-audio');
        $note->clearMediaCollection('note-videos');
        $note->clearMediaCollection('note-docs');
        $note->clearMediaCollection('note-texts');

        // Delete the note itself
        return $note->delete();
    }

    /**
     * Toggle pin status
     */
    public function togglePin(Note $note): Note
    {
        $note->update(['is_pinned' => !$note->is_pinned]);
        return $note;
    }
}