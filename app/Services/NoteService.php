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

        $fullPath = storage_path('app/public/' . $path);
        
        // Check file size - increased limit but with chunking strategy
        $fileSize = filesize($fullPath);
        if ($fileSize > 200 * 1024 * 1024) { // 200MB hard limit
            throw new \RuntimeException('PDF file is too large (max 200MB allowed)');
        }

        try {
            // Set memory limit and execution time for large files
            $originalMemoryLimit = ini_get('memory_limit');
            $originalTimeLimit = ini_get('max_execution_time');
            
            ini_set('memory_limit', '1024M'); // Increased memory limit
            ini_set('max_execution_time', 600); // 10 minutes
            
            // Use chunked processing for large files
            if ($fileSize > 50 * 1024 * 1024) {
                $text = $this->extractTextFromLargePdf($fullPath);
            } else {
                $text = $this->extractTextFromStandardPdf($fullPath);
            }
            
            // Restore original limits
            ini_set('memory_limit', $originalMemoryLimit);
            ini_set('max_execution_time', $originalTimeLimit);
            
            if (empty($text)) {
                throw new \RuntimeException('Could not extract text from PDF');
            }
            
            // Limit text size to prevent downstream issues
            if (strlen($text) > 2000000) { // 2MB of text
                $text = substr($text, 0, 2000000) . '\n\n[Text truncated due to size limits]';
            }
            
            return $text;
        } catch (\Exception $e) {
            // Restore original limits on error
            if (isset($originalMemoryLimit)) {
                ini_set('memory_limit', $originalMemoryLimit);
            }
            if (isset($originalTimeLimit)) {
                ini_set('max_execution_time', $originalTimeLimit);
            }
            
            // Handle specific regex compilation error
            if (strpos($e->getMessage(), 'preg_match') !== false && strpos($e->getMessage(), 'regular expression is too large') !== false) {
                throw new \RuntimeException('PDF file is too complex or large to process. Please try with a smaller or simpler PDF file.');
            }
            
            throw new \RuntimeException('Failed to process PDF file: ' . $e->getMessage());
        }
    }

    /**
     * Extract text from standard-sized PDF files
     */
    private function extractTextFromStandardPdf($fullPath)
    {
        $parser = new Parser();
        $pdf = $parser->parseFile($fullPath);
        return $pdf->getText();
    }

    /**
     * Extract text from large PDF files using page-by-page processing
     */
    private function extractTextFromLargePdf($fullPath)
    {
        try {
            $config = new \Smalot\PdfParser\Config();
            $config->setRetainImageContent(false); // Disable image processing to save memory
            $config->setDecodeMemoryLimit(100 * 1024 * 1024); // 100MB decode limit
            
            $parser = new Parser([], $config);
            $pdf = $parser->parseFile($fullPath);
            
            $pages = $pdf->getPages();
            $totalPages = count($pages);
            $text = '';
            $processedPages = 0;
            
            // Process pages in chunks to manage memory
            $chunkSize = 10; // Process 10 pages at a time
            
            for ($i = 0; $i < $totalPages; $i += $chunkSize) {
                $chunkText = '';
                $endIndex = min($i + $chunkSize, $totalPages);
                
                // Process chunk of pages
                for ($j = $i; $j < $endIndex; $j++) {
                    try {
                        $pageText = $pages[$j]->getText();
                        if (!empty(trim($pageText))) {
                            $chunkText .= $pageText . "\n";
                        }
                        $processedPages++;
                    } catch (\Exception $e) {
                        \Log::warning("Failed to extract text from page " . ($j + 1) . ": " . $e->getMessage());
                        continue;
                    }
                }
                
                $text .= $chunkText;
                
                // Force garbage collection after each chunk
                if (function_exists('gc_collect_cycles')) {
                    gc_collect_cycles();
                }
                
                // Check memory usage and break if getting too high
                $memoryUsage = memory_get_usage(true);
                if ($memoryUsage > 800 * 1024 * 1024) { // 800MB threshold
                    \Log::warning("Memory usage too high, stopping at page " . ($processedPages + 1));
                    $text .= "\n\n[Processing stopped due to memory constraints after " . $processedPages . " pages]";
                    break;
                }
            }
            
            \Log::info("Successfully processed " . $processedPages . " out of " . $totalPages . " pages");
            return $text;
            
        } catch (\Exception $e) {
            // Fallback to standard processing if chunked processing fails
            \Log::warning("Chunked processing failed, attempting standard processing: " . $e->getMessage());
            return $this->extractTextFromStandardPdf($fullPath);
        }
    }

    /**
     * Extract text from PowerPoint files (PPT/PPTX)
     */
    public function extractTextFromPowerPoint($fullPath)
    {
        if (empty($fullPath)) {
            throw new \InvalidArgumentException('PowerPoint file path is required');
        }

        try {
            // Try PhpOffice first
            $phpPresentation = \PhpOffice\PhpPresentation\IOFactory::load($fullPath);
            $text = '';
            
            foreach ($phpPresentation->getAllSlides() as $slide) {
                foreach ($slide->getShapeCollection() as $shape) {
                    if ($shape instanceof \PhpOffice\PhpPresentation\Shape\RichText) {
                        foreach ($shape->getParagraphs() as $paragraph) {
                            foreach ($paragraph->getRichTextElements() as $element) {
                                if ($element instanceof \PhpOffice\PhpPresentation\Shape\RichText\TextElement) {
                                    $text .= $element->getText() . "\n";
                                }
                            }
                        }
                    }
                }
            }
            
            return $text;
        } catch (\TypeError $e) {
            \Log::warning("PowerPoint processing failed with type error, attempting alternative extraction: " . $e->getMessage());
            return $this->extractTextFromPowerPointFallback($fullPath);
        } catch (\Exception $e) {
            \Log::warning("PowerPoint processing failed, attempting fallback extraction: " . $e->getMessage());
            return $this->extractTextFromPowerPointFallback($fullPath);
        }
    }

    /**
     * Fallback method to extract text from PowerPoint using ZipArchive
     */
    private function extractTextFromPowerPointFallback($fullPath)
    {
        try {
            $zip = new \ZipArchive();
            $text = '';
            
            if ($zip->open($fullPath) === TRUE) {
                // Extract from slides
                for ($i = 0; $i < $zip->numFiles; $i++) {
                    $filename = $zip->getNameIndex($i);
                    
                    // Process slide files
                    if (preg_match('/ppt\/slides\/slide\d+\.xml$/', $filename)) {
                        $slideContent = $zip->getFromIndex($i);
                        if ($slideContent) {
                            $text .= $this->extractTextFromSlideXml($slideContent);
                        }
                    }
                    
                    // Also check slide layouts and masters for additional text
                    if (preg_match('/ppt\/(slideLayouts|slideMasters)\/.*\.xml$/', $filename)) {
                        $slideContent = $zip->getFromIndex($i);
                        if ($slideContent) {
                            $text .= $this->extractTextFromSlideXml($slideContent);
                        }
                    }
                }
                $zip->close();
            }
            
            if (empty(trim($text))) {
                throw new \RuntimeException('Could not extract text from PowerPoint file');
            }
            
            return $text;
        } catch (\Exception $e) {
            throw new \RuntimeException('Failed to process PowerPoint file: ' . $e->getMessage());
        }
    }

    /**
     * Extract text from slide XML content
     */
    private function extractTextFromSlideXml($xmlContent)
    {
        $text = '';
        
        try {
            // Suppress XML errors and use internal error handling
            libxml_use_internal_errors(true);
            
            $xml = simplexml_load_string($xmlContent);
            if ($xml === false) {
                return '';
            }
            
            // Register namespaces
            $xml->registerXPathNamespace('a', 'http://schemas.openxmlformats.org/drawingml/2006/main');
            $xml->registerXPathNamespace('p', 'http://schemas.openxmlformats.org/presentationml/2006/main');
            
            // Extract text from various elements
            $textElements = $xml->xpath('//a:t');
            if ($textElements) {
                foreach ($textElements as $textElement) {
                    $elementText = trim((string)$textElement);
                    if (!empty($elementText)) {
                        $text .= $elementText . " ";
                    }
                }
            }
            
            // Also try to get text from paragraph elements
            $paragraphs = $xml->xpath('//a:p');
            if ($paragraphs) {
                foreach ($paragraphs as $paragraph) {
                    $pText = trim((string)$paragraph);
                    if (!empty($pText)) {
                        $text .= $pText . "\n";
                    }
                }
            }
            
        } catch (\Exception $e) {
            \Log::debug("Error parsing slide XML: " . $e->getMessage());
        }
        
        return $text;
    }

    /**
     * Extract text from Word documents (DOC/DOCX)
     */
    public function extractTextFromWord($fullPath)
    {
        if (empty($fullPath)) {
            throw new \InvalidArgumentException('Word document path is required');
        }

        try {
            $phpWord = \PhpOffice\PhpWord\IOFactory::load($fullPath);
            $text = '';
            
            foreach ($phpWord->getSections() as $section) {
                foreach ($section->getElements() as $element) {
                    if (method_exists($element, 'getText')) {
                        $text .= $element->getText() . "\n";
                    }
                }
            }
            
            if (empty(trim($text))) {
                throw new \RuntimeException('Could not extract text from Word document');
            }
            
            return $text;
        } catch (\Exception $e) {
            throw new \RuntimeException('Failed to process Word document: ' . $e->getMessage());
        }
    }

    /**
     * Extract text from text files
     */
    public function extractTextFromTextFile($path)
    {
        if (empty($path)) {
            throw new \InvalidArgumentException('Text file path is required');
        }

        try {
            $text = \Storage::disk('public')->get($path);
            
            if (empty(trim($text))) {
                throw new \RuntimeException('Text file is empty or could not be read');
            }
            
            return $text;
        } catch (\Exception $e) {
            throw new \RuntimeException('Failed to read text file: ' . $e->getMessage());
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
                    ->paginate(5);
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