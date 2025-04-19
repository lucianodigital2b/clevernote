<?php

namespace App\Policies;

use App\Models\Flashcard;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class FlashcardPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return true; // Allow any authenticated user to view the list page (will be filtered later)
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Flashcard $flashcard): bool
    {
        return $user->id === $flashcard->user_id;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return true; // Any authenticated user can create flashcards
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Flashcard $flashcard): bool
    {
        return $user->id === $flashcard->user_id;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Flashcard $flashcard): bool
    {
        return $user->id === $flashcard->user_id;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Flashcard $flashcard): bool
    {
        return $user->id === $flashcard->user_id;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Flashcard $flashcard): bool
    {
        return $user->id === $flashcard->user_id;
    }
}
