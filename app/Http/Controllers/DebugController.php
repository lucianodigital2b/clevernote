<?php

namespace App\Http\Controllers;

use App\Models\Note;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Illuminate\Support\Facades\Response;
use Illuminate\Support\Facades\Auth;

class DebugController extends Controller
{
    /**
     * Display a listing of all note contents from the bucket for debugging
     * Only accessible to husky15@hotmail.com
     */
    public function bucketContents()
    {
        // Double-check authorization
        if (Auth::user()->email !== 'husky15@hotmail.com') {
            abort(403, 'Unauthorized access');
        }

        // Get all notes with their file information
        $notes = Note::with(['tags', 'folder'])
            ->select([
                'id', 'title', 'content', 'transcription', 'summary', 
                'status', 'source_type', 'source_url', 'created_at',
                'podcast_file_path', 'podcast_status', 'user_id', 'folder_id'
            ])
            ->orderBy('created_at', 'desc')
            ->get();

        // Get bucket files information
        $bucketFiles = [];
        try {
            $disk = Storage::disk('r2');
            $allFiles = $disk->allFiles();
            
            foreach ($allFiles as $file) {
                $bucketFiles[] = [
                    'path' => $file,
                    'size' => $disk->size($file),
                    'last_modified' => $disk->lastModified($file),
                    'url' => $disk->url($file),
                ];
            }
        } catch (\Exception $e) {
            $bucketFiles = ['error' => 'Could not retrieve bucket files: ' . $e->getMessage()];
        }

        // Get media library files
        $mediaFiles = [];
        try {
            $mediaItems = \Spatie\MediaLibrary\MediaCollections\Models\Media::all();
            foreach ($mediaItems as $media) {
                $mediaFiles[] = [
                    'id' => $media->id,
                    'model_type' => $media->model_type,
                    'model_id' => $media->model_id,
                    'collection_name' => $media->collection_name,
                    'name' => $media->name,
                    'file_name' => $media->file_name,
                    'disk' => $media->disk,
                    'size' => $media->size,
                    'created_at' => $media->created_at,
                    'url' => $media->getUrl(),
                ];
            }
        } catch (\Exception $e) {
            $mediaFiles = ['error' => 'Could not retrieve media files: ' . $e->getMessage()];
        }

        return Inertia::render('Debug/BucketContents', [
            'notes' => $notes,
            'bucketFiles' => $bucketFiles,
            'mediaFiles' => $mediaFiles,
            'totalNotes' => $notes->count(),
            'totalBucketFiles' => is_array($bucketFiles) ? count($bucketFiles) : 0,
            'totalMediaFiles' => is_array($mediaFiles) ? count($mediaFiles) : 0,
        ]);
    }

    /**
     * Download a specific file from the bucket
     */
    public function downloadFile(Request $request)
    {
        // Double-check authorization
        if (Auth::user()->email !== 'husky15@hotmail.com') {
            abort(403, 'Unauthorized access');
        }

        $filePath = $request->get('file_path');
        
        if (!$filePath) {
            abort(400, 'File path is required');
        }

        try {
            $disk = Storage::disk('r2');
            
            if (!$disk->exists($filePath)) {
                abort(404, 'File not found in bucket');
            }

            $fileContent = $disk->get($filePath);
            $fileName = basename($filePath);
            $mimeType = $disk->mimeType($filePath);

            return Response::make($fileContent, 200, [
                'Content-Type' => $mimeType,
                'Content-Disposition' => 'attachment; filename="' . $fileName . '"',
                'Content-Length' => strlen($fileContent),
            ]);

        } catch (\Exception $e) {
            abort(500, 'Error downloading file: ' . $e->getMessage());
        }
    }

    /**
     * Export all notes data as JSON
     */
    public function exportNotesData()
    {
        // Double-check authorization
        if (Auth::user()->email !== 'husky15@hotmail.com') {
            abort(403, 'Unauthorized access');
        }

        $notes = Note::with(['tags', 'folder', 'flashcardSets', 'quizzes', 'mindmaps'])
            ->get()
            ->map(function ($note) {
                return [
                    'id' => $note->id,
                    'title' => $note->title,
                    'content' => $note->content,
                    'transcription' => $note->transcription,
                    'summary' => $note->summary,
                    'status' => $note->status,
                    'source_type' => $note->source_type,
                    'source_url' => $note->source_url,
                    'external_metadata' => $note->external_metadata,
                    'podcast_file_path' => $note->podcast_file_path,
                    'podcast_status' => $note->podcast_status,
                    'created_at' => $note->created_at,
                    'updated_at' => $note->updated_at,
                    'tags' => $note->tags->pluck('name'),
                    'folder' => $note->folder ? $note->folder->name : null,
                    'flashcard_sets_count' => $note->flashcardSets->count(),
                    'quizzes_count' => $note->quizzes->count(),
                    'mindmaps_count' => $note->mindmaps->count(),
                ];
            });

        $exportData = [
            'export_date' => now()->toISOString(),
            'total_notes' => $notes->count(),
            'notes' => $notes,
        ];

        $fileName = 'clevernote_debug_export_' . now()->format('Y-m-d_H-i-s') . '.json';

        return Response::json($exportData, 200, [
            'Content-Type' => 'application/json',
            'Content-Disposition' => 'attachment; filename="' . $fileName . '"',
        ]);
    }
}