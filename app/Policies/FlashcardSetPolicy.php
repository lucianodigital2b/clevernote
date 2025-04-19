<?php

namespace App\Policies;

use App\Models\FlashcardSet;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class FlashcardSetPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return true; // Allow any authenticated user to view the list page
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, FlashcardSet $flashcardSet): bool
    {
        return $user->id === $flashcardSet->user_id;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return true; // Any authenticated user can create flashcard sets
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, FlashcardSet $flashcardSet): bool
    {
        return $user->id === $flashcardSet->user_id;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, FlashcardSet $flashcardSet): bool
    {
        return $user->id === $flashcardSet->user_id;
    }
}