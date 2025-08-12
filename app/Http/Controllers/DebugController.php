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
    public function bucketContents(Request $request)
    {
        // Double-check authorization
        if (Auth::user()->email !== 'husky15@hotmail.com') {
            abort(403, 'Unauthorized access');
        }

        $perPage = $request->get('per_page', 50);
        $notesPage = $request->get('notes_page', 1);
        $bucketPage = $request->get('bucket_page', 1);
        $mediaPage = $request->get('media_page', 1);

        // Get paginated notes with their file information
        $notes = Note::with(['tags', 'folder'])
            ->select([
                'id', 'title', 'content', 'transcription', 'summary', 
                'status', 'source_type', 'source_url', 'created_at',
                'podcast_file_path', 'podcast_status', 'user_id', 'folder_id'
            ])
            ->orderBy('created_at', 'desc')
            ->paginate($perPage, ['*'], 'notes_page', $notesPage);

        // Get bucket files information with pagination
        $bucketFiles = [];
        $bucketFilesTotal = 0;
        $bucketFilesPagination = null;
        try {
            $disk = Storage::disk('r2');
            $allFiles = $disk->allFiles();
            
            $allBucketFiles = [];
            foreach ($allFiles as $file) {
                $allBucketFiles[] = [
                    'path' => $file,
                    'size' => $disk->size($file),
                    'last_modified' => $disk->lastModified($file),
                    'url' => $disk->url($file),
                ];
            }
            
            // Sort bucket files by last_modified in descending order
            usort($allBucketFiles, function($a, $b) {
                return $b['last_modified'] <=> $a['last_modified'];
            });
            
            // Implement pagination for bucket files
            $bucketFilesTotal = count($allBucketFiles);
            $bucketOffset = ($bucketPage - 1) * $perPage;
            $bucketFiles = array_slice($allBucketFiles, $bucketOffset, $perPage);
            
            $bucketFilesPagination = [
                'current_page' => $bucketPage,
                'per_page' => $perPage,
                'total' => $bucketFilesTotal,
                'last_page' => ceil($bucketFilesTotal / $perPage),
                'from' => $bucketOffset + 1,
                'to' => min($bucketOffset + $perPage, $bucketFilesTotal)
            ];
        } catch (\Exception $e) {
            $bucketFiles = ['error' => 'Could not retrieve bucket files: ' . $e->getMessage()];
        }

        // Get paginated media library files
        $mediaFiles = [];
        $mediaFilesTotal = 0;
        $mediaFilesPagination = null;
        try {
            $allMediaItems = \Spatie\MediaLibrary\MediaCollections\Models\Media::orderBy('created_at', 'desc')->get();
            
            $allMediaFiles = [];
            foreach ($allMediaItems as $media) {
                $allMediaFiles[] = [
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
            
            // Implement pagination for media files
            $mediaFilesTotal = count($allMediaFiles);
            $mediaOffset = ($mediaPage - 1) * $perPage;
            $mediaFiles = array_slice($allMediaFiles, $mediaOffset, $perPage);
            
            $mediaFilesPagination = [
                'current_page' => $mediaPage,
                'per_page' => $perPage,
                'total' => $mediaFilesTotal,
                'last_page' => ceil($mediaFilesTotal / $perPage),
                'from' => $mediaOffset + 1,
                'to' => min($mediaOffset + $perPage, $mediaFilesTotal)
            ];
        } catch (\Exception $e) {
            $mediaFiles = ['error' => 'Could not retrieve media files: ' . $e->getMessage()];
        }

        return Inertia::render('Debug/BucketContents', [
            'notes' => $notes,
            'bucketFiles' => $bucketFiles,
            'mediaFiles' => $mediaFiles,
            'bucketFilesPagination' => $bucketFilesPagination,
            'mediaFilesPagination' => $mediaFilesPagination,
            'totalNotes' => $notes->total(),
            'totalBucketFiles' => $bucketFilesTotal,
            'totalMediaFiles' => $mediaFilesTotal,
            'pagination' => [
                'per_page' => $perPage,
                'notes_page' => $notesPage,
                'bucket_page' => $bucketPage,
                'media_page' => $mediaPage,
            ],
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
     * Download all files related to a specific note
     */
    public function downloadNoteFiles(Request $request)
    {
        // Double-check authorization
        if (Auth::user()->email !== 'husky15@hotmail.com') {
            abort(403, 'Unauthorized access');
        }

        $noteId = $request->get('note_id');
        
        if (!$noteId) {
            abort(400, 'Note ID is required');
        }

        $note = Note::with(['tags', 'folder'])->find($noteId);
        
        if (!$note) {
            abort(404, 'Note not found');
        }

        try {
            $zip = new \ZipArchive();
            $zipFileName = 'note_' . $noteId . '_files_' . now()->format('Y-m-d_H-i-s') . '.zip';
            $zipPath = storage_path('app/temp/' . $zipFileName);
            
            // Ensure temp directory exists
            if (!file_exists(dirname($zipPath))) {
                mkdir(dirname($zipPath), 0755, true);
            }

            if ($zip->open($zipPath, \ZipArchive::CREATE) !== TRUE) {
                abort(500, 'Cannot create zip file');
            }

            $disk = Storage::disk('r2');
            $filesAdded = 0;
            $debugInfo = [];

            // Add note data as JSON
            $noteData = [
                'id' => $note->id,
                'title' => $note->title,
                'content' => $note->content,
                'transcription' => $note->transcription,
                'summary' => $note->summary,
                'status' => $note->status,
                'source_type' => $note->source_type,
                'source_url' => $note->source_url,
                'podcast_file_path' => $note->podcast_file_path,
                'podcast_status' => $note->podcast_status,
                'created_at' => $note->created_at,
                'updated_at' => $note->updated_at,
                'tags' => $note->tags->pluck('name'),
                'folder' => $note->folder ? $note->folder->name : null,
            ];
            $zip->addFromString('note_data.json', json_encode($noteData, JSON_PRETTY_PRINT));
            $filesAdded++;
            $debugInfo[] = 'Added note_data.json';

            // Add podcast file if exists
            if ($note->podcast_file_path) {
                $debugInfo[] = 'Podcast file path: ' . $note->podcast_file_path;
                if ($disk->exists($note->podcast_file_path)) {
                    $podcastContent = $disk->get($note->podcast_file_path);
                    $zip->addFromString('podcast_' . basename($note->podcast_file_path), $podcastContent);
                    $filesAdded++;
                    $debugInfo[] = 'Added podcast file: ' . basename($note->podcast_file_path);
                } else {
                    $debugInfo[] = 'Podcast file not found in R2: ' . $note->podcast_file_path;
                }
            } else {
                $debugInfo[] = 'No podcast file path for this note';
            }

            // Look for related media files
            $mediaFiles = \Spatie\MediaLibrary\MediaCollections\Models\Media::where('model_type', 'App\\Models\\Note')
                ->where('model_id', $noteId)
                ->get();

            $debugInfo[] = 'Found ' . $mediaFiles->count() . ' media files for note ' . $noteId;

            foreach ($mediaFiles as $media) {
                try {
                    $debugInfo[] = 'Processing media file: ' . $media->file_name . ' (disk: ' . $media->disk . ')';
                    
                    // For R2 storage, we need to get the file content from the disk
                    if ($media->disk === 'r2') {
                        $mediaPath = $media->getPathRelativeToRoot();
                        $debugInfo[] = 'R2 media path: ' . $mediaPath;
                        
                        if ($disk->exists($mediaPath)) {
                            $mediaContent = $disk->get($mediaPath);
                            $zip->addFromString('media_' . $media->file_name, $mediaContent);
                            $filesAdded++;
                            $debugInfo[] = 'Added R2 media file: ' . $media->file_name;
                        } else {
                            $debugInfo[] = 'R2 media file not found: ' . $mediaPath;
                        }
                    } else {
                        // For local storage, use the original method
                        $mediaPath = $media->getPath();
                        $debugInfo[] = 'Local media path: ' . $mediaPath;
                        
                        if (file_exists($mediaPath)) {
                            $zip->addFile($mediaPath, 'media_' . $media->file_name);
                            $filesAdded++;
                            $debugInfo[] = 'Added local media file: ' . $media->file_name;
                        } else {
                            $debugInfo[] = 'Local media file not found: ' . $mediaPath;
                        }
                    }
                } catch (\Exception $e) {
                    $debugInfo[] = 'Error processing media file ' . $media->file_name . ': ' . $e->getMessage();
                    continue;
                }
            }

            // Add debug information to the zip
            $zip->addFromString('debug_info.txt', implode("\n", $debugInfo));
            $filesAdded++;

            $zip->close();

            if ($filesAdded <= 2) { // Only note_data.json and debug_info.txt
                unlink($zipPath);
                abort(404, 'No files found for this note. Check debug_info.txt for details.');
            }

            return Response::download($zipPath, $zipFileName)->deleteFileAfterSend(true);

        } catch (\Exception $e) {
            abort(500, 'Error creating download package: ' . $e->getMessage());
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