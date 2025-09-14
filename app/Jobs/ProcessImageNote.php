<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Models\Note;
use App\Services\DeepSeekService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Http;

class ProcessImageNote implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $noteId;
    protected $validatedData;
    protected $filePath;

    /**
     * The number of seconds the job can run before timing out.
     *
     * @var int
     */
    public $timeout = 300; // 5 minutes

    /**
     * The number of times the job may be attempted.
     *
     * @var int
     */
    public $tries = 3;

    /**
     * Create a new job instance.
     */
    public function __construct(int $noteId, array $validatedData, string $filePath)
    {
        $this->noteId = $noteId;
        $this->validatedData = $validatedData;
        $this->filePath = $filePath;
    }

    /**
     * Execute the job.
     */
    public function handle(DeepSeekService $deepseekService): void
    {
        $note = Note::findOrFail($this->noteId);
        $fullPath = Storage::disk('public')->path($this->filePath);

        try {
            $language = $this->validatedData['language'] ?? 'en';

            // Analyze image using OpenAI Vision API
            $imageAnalysis = $this->analyzeImageWithVision($fullPath, $language);
            
            if (!$imageAnalysis) {
                throw new \Exception('Failed to analyze image content');
            }

            // Create study note from image analysis
            $studyNote = $deepseekService->createStudyNote($imageAnalysis, $language);

            // Upload image to R2 storage using media collections
            $mediaCollection = 'note-images';
            $media = $note->addMediaFromDisk($this->filePath, 'public')
                ->toMediaCollection($mediaCollection);

            $noteData = array_merge($this->validatedData, [
                'content' => $studyNote['study_note']['content'],
                'title' => $studyNote['study_note']['title'],
                'summary' => $studyNote['study_note']['summary'],
                'transcription' => $imageAnalysis, // Store the original image analysis
                'status' => 'processed'
            ]);

            $note->update($noteData);

            // Clean up the temporary file from public storage after uploading to R2
            Storage::disk('public')->delete($this->filePath);

        } catch (\Exception $e) {
            Log::error("Failed to process image note: " . $e->getMessage());
            Log::error("Stack trace: " . $e->getTraceAsString());
            
            // Provide user-friendly error messages
            $userMessage = $this->getUserFriendlyErrorMessage($e->getMessage());
            
            $note->update([
                'status' => 'failed',
                'failure_reason' => $userMessage
            ]);
            
            // Clean up the temporary file on failure as well
            if (Storage::disk('public')->exists($this->filePath)) {
                Storage::disk('public')->delete($this->filePath);
            }
        }
    }

    /**
     * Analyze image using OpenAI Vision API
     */
    private function analyzeImageWithVision(string $imagePath, string $language): ?string
    {
        try {
            // Read and encode image
            $imageData = file_get_contents($imagePath);
            $base64Image = base64_encode($imageData);
            $mimeType = mime_content_type($imagePath);

            $apiKey = config('services.openai.api_key');
            
            if (!$apiKey) {
                throw new \Exception('OpenAI API key not configured');
            }

            $prompt = $this->getVisionPrompt($language);

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $apiKey,
                'Content-Type' => 'application/json',
            ])->timeout(120)->post('https://api.openai.com/v1/chat/completions', [
                'model' => 'gpt-4o',
                'messages' => [
                    [
                        'role' => 'user',
                        'content' => [
                            [
                                'type' => 'text',
                                'text' => $prompt
                            ],
                            [
                                'type' => 'image_url',
                                'image_url' => [
                                    'url' => "data:{$mimeType};base64,{$base64Image}",
                                    'detail' => 'high'
                                ]
                            ]
                        ]
                    ]
                ],
                'max_tokens' => 4000,
                'temperature' => 0.7
            ]);

            if (!$response->successful()) {
                $error = $response->json()['error']['message'] ?? 'Unknown API error';
                throw new \Exception("OpenAI Vision API error: {$error}");
            }

            $result = $response->json();
            return $result['choices'][0]['message']['content'] ?? null;

        } catch (\Exception $e) {
            Log::error("Vision API error: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Get vision analysis prompt based on language
     */
    private function getVisionPrompt(string $language): string
    {
        $prompts = [
            'en' => 'Analyze this image thoroughly and extract all visible text, diagrams, charts, formulas, and educational content. Describe what you see in detail, including any mathematical equations, scientific diagrams, text content, or study materials. If this appears to be educational content (like notes, textbooks, whiteboards, presentations), provide a comprehensive transcription and explanation of all visible information that could be useful for studying.',
            'es' => 'Analiza esta imagen minuciosamente y extrae todo el texto visible, diagramas, gráficos, fórmulas y contenido educativo. Describe lo que ves en detalle, incluyendo cualquier ecuación matemática, diagrama científico, contenido de texto o materiales de estudio. Si parece ser contenido educativo (como notas, libros de texto, pizarras, presentaciones), proporciona una transcripción y explicación completa de toda la información visible que podría ser útil para estudiar.',
            'fr' => 'Analysez cette image en détail et extrayez tout le texte visible, les diagrammes, les graphiques, les formules et le contenu éducatif. Décrivez ce que vous voyez en détail, y compris toute équation mathématique, diagramme scientifique, contenu textuel ou matériel d\'étude. Si cela semble être du contenu éducatif (comme des notes, des manuels, des tableaux, des présentations), fournissez une transcription et une explication complètes de toutes les informations visibles qui pourraient être utiles pour étudier.',
            'pt' => 'Analise esta imagem minuciosamente e extraia todo o texto visível, diagramas, gráficos, fórmulas e conteúdo educacional. Descreva o que você vê em detalhes, incluindo qualquer equação matemática, diagrama científico, conteúdo de texto ou materiais de estudo. Se parecer ser conteúdo educacional (como notas, livros didáticos, quadros, apresentações), forneça uma transcrição e explicação abrangente de todas as informações visíveis que possam ser úteis para estudar.'
        ];

        return $prompts[$language] ?? $prompts['en'];
    }

    /**
     * Get user-friendly error message
     */
    private function getUserFriendlyErrorMessage(string $errorMessage): string
    {
        if (strpos($errorMessage, 'file is too large') !== false) {
            return 'The image file is too large to process. Please try with a file smaller than 10MB.';
        } elseif (strpos($errorMessage, 'unsupported image format') !== false) {
            return 'The image format is not supported. Please use JPG, PNG, GIF, BMP, or WebP format.';
        } elseif (strpos($errorMessage, 'OpenAI Vision API error') !== false) {
            return 'Failed to analyze the image content. Please try again or use a different image.';
        } elseif (strpos($errorMessage, 'API key not configured') !== false) {
            return 'Image processing is not available at the moment. Please contact support.';
        } elseif (strpos($errorMessage, 'Failed to analyze image content') !== false) {
            return 'Could not extract meaningful content from the image. Please ensure the image contains readable text or educational material.';
        }

        return 'Failed to process the image. Please try again with a different image.';
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error("Image note processing job failed: " . $exception->getMessage());
        Log::error("Stack trace: " . $exception->getTraceAsString());
        
        try {
            $note = Note::find($this->noteId);
            if ($note) {
                $userMessage = $this->getUserFriendlyErrorMessage($exception->getMessage());
                
                $note->update([
                    'status' => 'failed',
                    'failure_reason' => $userMessage
                ]);
            }
            
            // Clean up the temporary file
            if (Storage::disk('public')->exists($this->filePath)) {
                Storage::disk('public')->delete($this->filePath);
            }
        } catch (\Exception $e) {
            Log::error("Failed to update note status on job failure: " . $e->getMessage());
        }
    }
}