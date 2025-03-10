<?php

namespace App\Services;

use App\Models\Folder;
use Illuminate\Support\Collection;

class FolderService
{
    /**
     * Get root folders for a user
     */
    public function getRootFoldersForUser(int $userId): Collection
    {
        return Folder::where('user_id', $userId)
            ->where('parent_id', null)
            ->with(['notes', 'children'])
            ->get();
    }
    
    /**
     * Create a new folder
     */
    public function createFolder(array $data): Folder
    {
        return Folder::create($data);
    }
    
    /**
     * Update a folder
     */
    public function updateFolder(Folder $folder, array $data): bool
    {
        return $folder->update($data);
    }
    
    /**
     * Delete a folder
     */
    public function deleteFolder(Folder $folder): bool
    {
        // Add any complex logic here (handling children, etc.)
        return $folder->delete();
    }
    
    /**
     * Get available parent folders for a user
     * Optionally excluding a specific folder (for edit scenarios)
     */
    public function getAvailableParentFolders(int $userId, ?int $excludeFolderId = null): Collection
    {
        $query = Folder::where('user_id', $userId);
        
        if ($excludeFolderId) {
            $query->where('id', '!=', $excludeFolderId);
        }
        
        return $query->get();
    }
}