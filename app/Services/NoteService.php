<?php

namespace App\Services;

use App\Models\Note;
use Illuminate\Support\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

class NoteService
{
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
     * Delete a note
     */
    public function deleteNote(Note $note): bool
    {
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