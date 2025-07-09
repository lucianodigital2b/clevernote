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