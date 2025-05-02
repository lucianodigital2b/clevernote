<?php

namespace App\Http\Controllers;

use App\Models\Folder;
use App\Http\Requests\StoreFolderRequest;
use App\Http\Requests\UpdateFolderRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Services\FolderService;


class FolderController extends Controller
{

    protected $folderService;

    public function __construct(FolderService $folderService)
    {
        $this->folderService = $folderService;
    }


    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {

        $folders = $this->folderService->getRootFoldersForUser(Auth::id());
            
        if($request->wantsJson()) {
            return response()->json($folders);
        }
        
        return Inertia::render('Folders/Index', [
            'folders' => $folders
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $parentFolders = Folder::where('user_id', Auth::id())->get();
        
        return Inertia::render('Folders/Create', [
            'parentFolders' => $parentFolders
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreFolderRequest $request)
    {
        $validated = $request->validated();
        $validated['user_id'] = Auth::id();
        
        $folder = $this->folderService->createFolder($validated);
        
        return redirect()->back()
            ->with('success', 'Folder created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Folder $folder)
    {
        // Authorize that the user owns this folder
        $this->authorize('view', $folder);
        
        $folder->load(['notes', 'children']);
        
        return Inertia::render('Folders/Show', [
            'folder' => $folder
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Folder $folder)
    {
        // Authorize that the user owns this folder
        $this->authorize('update', $folder);
        
        $parentFolders = Folder::where('user_id', Auth::id())
            ->where('id', '!=', $folder->id)
            ->get();
            
        return Inertia::render('Folders/Edit', [
            'folder' => $folder,
            'parentFolders' => $parentFolders
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateFolderRequest $request, Folder $folder)
    {
        // Authorize that the user owns this folder
        $this->authorize('update', $folder);
        
        $folder = $this->folderService->updateFolder($folder, $request->validated());
        
        return redirect()->route('folders.show', $folder)
            ->with('success', 'Folder updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Folder $folder)
    {
        // Authorize that the user owns this folder
        $this->authorize('delete', $folder);
        
        // Handle child folders and notes before deletion
        // You might want to implement a more sophisticated approach
        // like moving them to parent folder or trash
        $folder->delete();
        
        return redirect()->route('folders.index')
            ->with('success', 'Folder deleted successfully.');
    }

    /**
     * Get folders with note counts for the sidebar
     */
    public function getFoldersWithCounts()
    {
        $folders = Folder::where('user_id', Auth::id())->withCount('notes')->get();
        

        return response()->json(['folders' => $folders]);
    }
}
