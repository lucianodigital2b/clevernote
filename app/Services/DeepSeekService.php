<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Client\RequestException;

class DeepSeekService
{
    protected $apiKey;
    protected $apiEndpoint = 'https://api.deepseek.com/v1/chat/completions';

    public function __construct()
    {
        $this->apiKey = config('services.deepseek.api_key');
        
        if (empty($this->apiKey)) {
            throw new \RuntimeException('DeepSeek API key is not configured');
        }
    }

    public function createStudyNote(string $transcription): array
    {
        if (empty($transcription)) {
            throw new \InvalidArgumentException('Transcription cannot be empty');
        }

        try {
            $prompt = <<<EOT
                You are an AI assistant that converts raw transcription into a well-structured study note using **HTML formatting**. 
                MAKE IT BEAUTIFUL! Dont be shy to use tables, titles, lists etc.

                Writing Style Prompt
                    Focus on clarity: Make your message really easy to understand.
                    Example: "Please send the file by Monday."
                    Be direct and concise: Get to the point; remove unnecessary words.
                    Example: "We should meet tomorrow."
                    Use simple language: Write plainly with short sentences.
                    Example: "I need help with this issue."
                    Stay away from fluff: Avoid unnecessary adjectives and adverbs.
                    Example: "We finished the task."
                    Avoid marketing language: Don't use hype or promotional words.
                    Avoid: "This revolutionary product will transform your life."
                    Use instead: "This product can help you."
                    Keep it real: Be honest; don't force friendliness.
                    Example: "I don't think that's the best idea."
                    Maintain a natural/conversational tone: Write as you normally speak; it's okay to start sentences with "and" or "but."
                    Example: "And that's why it matters."
                    Simplify grammar: Don't stress about perfect grammar; it's fine not to capitalize "i" if that's your style.
                    Example: "i guess we can try that."
                    Avoid AI-giveaway phrases: Don't use clichés like "dive into," "unleash your potential," etc.
                    Avoid: "Let's dive into this game-changing solution."
                    Use instead: "Here's how it works."
                    Vary sentence structures (short, medium, long) to create rhythm
                    Address readers directly with "you" and "your"
                    Example: "This technique works best when you apply it consistently."
                    Use active voice
                    Instead of: "The report was submitted by the team."
                    Use: "The team submitted the report."
                    Avoid:
                    Filler phrases
                    Instead of: "It's important to note that the deadline is approaching."
                    Use: "The deadline is approaching."
                    Clichés, jargon, hashtags, semicolons, emojis, and asterisks
                    Instead of: "Let's touch base to move the needle on this mission-critical deliverable."
                    Use: "Let's meet to discuss how to improve this important project."
                    Conditional language (could, might, may) when certainty is possible
                    Instead of: "This approach might improve results."
                    Use: "This approach improves results."
                    Redundancy and repetition (remove fluff!)
                    Forced keyword placement that disrupts natural reading

                Instructions:
                1. Read and analyze the transcription provided.
                2. Extract key concepts, important points, and examples.
                3. Write a study note in the following **valid JSON** format (parseable by PHP's `json_decode`):

                {
                    "title": "A short, clear title summarizing the main topic.",
                    "content": "Detailed explanation using HTML: include headings, bullet points, bold text, examples, etc.",
                    "summary": "2-3 sentence summary of the key takeaways."
                }

                Requirements:
                - Use HTML formatting for structure and clarity.
                - Return **only** the JSON object, no extra text.
                - Make sure the JSON is valid and can be decoded with PHP’s `json_decode`.

                Transcription:
                {$transcription}
                EOT;


            // dump($prompt);

            $response = Http::timeout(30)->withHeaders([
                'Authorization' => "Bearer {$this->apiKey}",
                'Content-Type' => 'application/json',
            ])->post($this->apiEndpoint, [
                'model' => 'deepseek-chat',
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => 'You are a study assistant that always responds in valid JSON format.'
                    ],
                    [
                        'role' => 'user',
                        'content' => $prompt
                    ]
                ],
                'temperature' => 0.7,
                'max_tokens' => 4000
            ]);

            // Get response content and clean it
            $content = $response->json('choices.0.message.content');
            // Remove 'json' prefix and any HTML code block indicators
            $content = preg_replace('/^(json|\`\`\`json|\`\`\`)\s*/i', '', trim($content));
            $content = preg_replace('/\`\`\`\s*$/i', '', trim($content));
            
            $studyNote = json_decode($content, true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                Log::error('JSON Parsing Error', [
                    'error' => json_last_error_msg(),
                    'response' => $content
                ]);
                throw new \Exception('Invalid JSON response from DeepSeek: ' . json_last_error_msg());
            }


            // Validate study note structure
            if (!isset($studyNote['title']) || !isset($studyNote['content']) || !isset($studyNote['summary'])) {
                throw new \Exception('Incomplete study note structure received from DeepSeek');
            }

            return [
                'original_transcription' => $transcription,
                'study_note' => $studyNote,
            ];

        } catch (RequestException $e) {
            Log::error('HTTP Request Failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw new \Exception('Failed to connect to DeepSeek API: ' . $e->getMessage());
        } catch (\Exception $e) {
            Log::error('Study note generation failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }

    public function generateStudyNote($text)
    {
        $prompt = "Create a comprehensive study note from the following text. Include:
        - Key concepts and definitions
        - Main points and arguments
        - Important examples
        - Summary and conclusions
        
        Text: " . $text;

        // Call DeepSeek API with the prompt
        $response = $this->sendPrompt($prompt);
        
        return $response;
    }

    protected function sendPrompt(string $prompt): string
    {
        if (empty($prompt)) {
            throw new \InvalidArgumentException('Prompt cannot be empty');
        }

        try {
            $response = Http::timeout(30)->withHeaders([
                'Authorization' => "Bearer {$this->apiKey}",
                'Content-Type' => 'application/json',
            ])->post($this->apiEndpoint, [
                'model' => 'deepseek-chat',
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => 'You are a study assistant that helps create comprehensive study notes.'
                    ],
                    [
                        'role' => 'user',
                        'content' => $prompt
                    ]
                ],
                'temperature' => 0.7,
                'max_tokens' => 4000
            ]);

            if (!$response->successful()) {
                throw new RequestException($response);
            }

            $content = $response->json('choices.0.message.content');
            
            if (empty($content)) {
                throw new \Exception('Empty response received from DeepSeek API');
            }

            return $content;

        } catch (RequestException $e) {
            Log::error('DeepSeek API Request Failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw new \Exception('Failed to connect to DeepSeek API: ' . $e->getMessage());
        } catch (\Exception $e) {
            Log::error('Prompt processing failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }
}
