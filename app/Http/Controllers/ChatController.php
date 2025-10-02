<?php

namespace App\Http\Controllers;

use App\Models\Note;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;
use EchoLabs\Prism\Prism;
use EchoLabs\Prism\ValueObjects\Messages\UserMessage;
use EchoLabs\Prism\ValueObjects\Messages\SystemMessage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ChatController extends Controller
{
    /**
     * Chat with a specific note using streaming response
     */
    public function chatWithNote(Request $request, Note $note): StreamedResponse
    {
        // Authorize user can access this note
        $this->authorize('view', $note);

        // Validate the request
        $validated = $request->validate([
            'message' => 'required|string|max:2000',
            'conversation_history' => 'sometimes|array|max:20',
            'conversation_history.*.role' => 'required_with:conversation_history|in:user,assistant',
            'conversation_history.*.content' => 'required_with:conversation_history|string|max:2000',
        ]);

        // Rate limiting
        $key = 'chat-note:' . Auth::id() . ':' . $note->id;
        if (RateLimiter::tooManyAttempts($key, 10)) {
            $seconds = RateLimiter::availableIn($key);
            throw ValidationException::withMessages([
                'message' => ["Too many chat requests. Please try again in {$seconds} seconds."]
            ]);
        }

        RateLimiter::hit($key, 60); // 10 requests per minute

        return new StreamedResponse(function () use ($validated, $note) {
            try {
                // Prepare the system message with note context
                $systemMessage = $this->buildSystemMessage($note);
                
                // Build conversation messages
                $messages = [$systemMessage];
                
                // Add conversation history if provided
                if (isset($validated['conversation_history'])) {
                    foreach ($validated['conversation_history'] as $historyMessage) {
                        if ($historyMessage['role'] === 'user') {
                            $messages[] = new UserMessage($historyMessage['content']);
                        } else {
                            $messages[] = new \EchoLabs\Prism\ValueObjects\Messages\AssistantMessage($historyMessage['content']);
                        }
                    }
                }
                
                // Add current user message
                $messages[] = new UserMessage($validated['message']);

                // Initialize Prism
                $prism = Prism::text()
                    ->using('openai', 'gpt-4o-mini')
                    ->withMessages($messages)
                    ->withMaxTokens(1000)
                    ->withTemperature(0.7);

                // Stream the response
                $prism->stream(function (string $text) {
                    $data = [
                        'type' => 'content',
                        'content' => $text,
                        'timestamp' => now()->toISOString()
                    ];
                    
                    echo "data: " . json_encode($data) . "\n\n";
                    
                    if (ob_get_level()) {
                        ob_flush();
                    }
                    flush();
                });

                // Send completion signal
                $completionData = [
                    'type' => 'complete',
                    'timestamp' => now()->toISOString()
                ];
                echo "data: " . json_encode($completionData) . "\n\n";
                
                if (ob_get_level()) {
                    ob_flush();
                }
                flush();

            } catch (\Exception $e) {
                Log::error('Chat streaming error', [
                    'user_id' => Auth::id(),
                    'note_id' => $note->id,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);

                $errorData = [
                    'type' => 'error',
                    'message' => 'An error occurred while processing your request.',
                    'timestamp' => now()->toISOString()
                ];
                echo "data: " . json_encode($errorData) . "\n\n";
                
                if (ob_get_level()) {
                    ob_flush();
                }
                flush();
            }
        }, 200, [
            'Content-Type' => 'text/plain; charset=utf-8',
            'Cache-Control' => 'no-cache',
            'Connection' => 'keep-alive',
            'X-Accel-Buffering' => 'no', // Disable nginx buffering
        ]);
    }

    /**
     * Get chat suggestions based on note content
     */
    public function getChatSuggestions(Request $request, Note $note): JsonResponse
    {
        $this->authorize('view', $note);

        // Rate limiting for suggestions
        $key = 'chat-suggestions:' . Auth::id();
        if (RateLimiter::tooManyAttempts($key, 5)) {
            $seconds = RateLimiter::availableIn($key);
            return response()->json([
                'error' => "Too many requests. Please try again in {$seconds} seconds."
            ], 429);
        }

        RateLimiter::hit($key, 60); // 5 requests per minute

        try {
            $systemMessage = new SystemMessage(
                "Based on the following note content, suggest 3-4 relevant questions a user might want to ask about this content. " .
                "Make the questions specific, insightful, and educational. Return only the questions as a JSON array.\n\n" .
                "Note Title: {$note->title}\n" .
                "Note Content: " . strip_tags($note->content)
            );

            $prism = Prism::text()
                ->using('openai', 'gpt-4o-mini')
                ->withMessages([$systemMessage])
                ->withMaxTokens(200)
                ->withTemperature(0.8);

            $response = $prism->generate();
            
            // Try to parse as JSON, fallback to simple array if needed
            $suggestions = json_decode($response->text, true);
            if (!is_array($suggestions)) {
                // Fallback: split by lines and clean up
                $suggestions = array_filter(
                    array_map('trim', explode("\n", $response->text)),
                    fn($line) => !empty($line) && !str_starts_with($line, '-')
                );
                $suggestions = array_slice(array_values($suggestions), 0, 4);
            }

            return response()->json([
                'suggestions' => array_slice($suggestions, 0, 4)
            ]);

        } catch (\Exception $e) {
            Log::error('Chat suggestions error', [
                'user_id' => Auth::id(),
                'note_id' => $note->id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'error' => 'Unable to generate suggestions at this time.'
            ], 500);
        }
    }

    /**
     * Build system message with note context
     */
    private function buildSystemMessage(Note $note): SystemMessage
    {
        $context = "You are an AI assistant helping a user understand and discuss their note. " .
                  "Be helpful, accurate, and educational. Answer questions based on the note content, " .
                  "but also provide additional context and explanations when helpful.\n\n" .
                  "Note Title: {$note->title}\n" .
                  "Note Content:\n" . strip_tags($note->content) . "\n\n" .
                  "Instructions:\n" .
                  "- Answer questions based primarily on the note content\n" .
                  "- Provide additional context and explanations when helpful\n" .
                  "- If asked about something not in the note, acknowledge this and provide general information if relevant\n" .
                  "- Keep responses concise but informative\n" .
                  "- Use a friendly, educational tone";

        return new SystemMessage($context);
    }
}