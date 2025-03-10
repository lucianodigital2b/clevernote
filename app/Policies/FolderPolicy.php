<?php

namespace App\Policies;

use App\Models\Folder;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class FolderPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view the folder.
     */
    public function view(User $user, Folder $folder)
    {
        return $user->id === $folder->user_id;
    }

    /**
     * Determine whether the user can create folders.
     */
    public function create(User $user)
    {
        return true; // All authenticated users can create folders
    }

    /**
     * Determine whether the user can update the folder.
     */
    public function update(User $user, Folder $folder)
    {
        return $user->id === $folder->user_id;
    }

    /**
     * Determine whether the user can delete the folder.
     */
    public function delete(User $user, Folder $folder)
    {
        return $user->id === $folder->user_id;
    }
}
