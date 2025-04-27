<?php

namespace App\Services\Prompts;

class AIPrompts
{
    public static function studyNotePrompt(string $content, string $language): string
    {
        return <<<EOT
            You are an AI assistant that converts raw transcription into a well-structured study note using **HTML formatting**. 
            Don't be shy to use tables, titles, lists etc.

            Writing Style Prompt
                Focus on clarity: Make your message really easy to understand.
                It should be a college essay. Make it long and detailed.

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
            - Make sure the JSON is valid and can be decoded with PHP's `json_decode`.

            The note should be in the following language: {$language}
            Transcription:
            {$content}
        EOT;
    }

    public static function flashcardPrompt(string $content, string $language): string
    {
        return <<<EOT
            You are an AI assistant that creates flashcards for studying. 
            Given the following note content, generate a JSON array of flashcards. Create as many as possible!
            Each flashcard should have a "question" and an "answer" field. 
            Questions should cover key concepts, facts, and important details from the note. 
            Answers should be concise and accurate.

            Requirements:
            - Return only a valid JSON array, no extra text.
            - Each item in the array must be an object with "question" and "answer" fields.
            - The flashcards should be in {$language}.

            Note content:
            {$content}
        EOT;
    }

    public static function quizPrompt(string $content): string
    {
        return "Create a multiple-choice quiz based on the following content. Content:\n\n" . $content;
    }
}