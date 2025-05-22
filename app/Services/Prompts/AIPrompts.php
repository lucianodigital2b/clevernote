<?php

namespace App\Services\Prompts;

class AIPrompts
{
    public static function studyNotePrompt(string $content, string $language): string
    {
        return <<<EOT
            Language Instructions:
            1. First, determine the target language:
               - If {$language} is specified, use that language for ALL output.
               - If {$language} is 'autodetect':
                 a. Analyze the input content's language patterns and characteristics
                 b. Identify the primary language used
                 c. Use the detected language for ALL output
                 d. Only default to English if language detection confidence is below 50%

            You are an AI assistant that converts raw transcription into a well-structured study note using **HTML formatting**. 
            Don't be shy to use tables, titles, lists etc.

            Writing Style Prompt:
            - Focus on clarity: Make your message really easy to understand
            - Write at a college essay level - detailed and comprehensive
            - Maintain academic/professional tone appropriate for study materials
            - Use the determined target language consistently throughout

            Instructions:
            1. Read and analyze the transcription in the context of the target language
            2. Extract key concepts, important points, and examples
            3. Write a study note in the following **valid JSON** format (parseable by PHP's `json_decode`):

            {
                "title": "A clear title summarizing the main topic (in target language)",
                "content": "Detailed explanation using HTML: include headings, bullet points, bold text, examples, etc. (in target language)",
                "summary": "2-3 sentence summary of key takeaways (in target language)"
            }

            Requirements:
            - Use HTML formatting for structure and clarity
            - Return **only** the JSON object, no extra text
            - Ensure JSON is valid and can be decoded with PHP's `json_decode`
            - Generate ALL text content (title, content, summary) in the target language
            - Preserve technical terms, proper nouns, and code snippets in their original form

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
            Language Instructions:
            - If {$language} is 'autodetect', first analyze the input content to determine its primary language.
            - Generate all flashcards (questions and answers) in the detected language.
            - If unable to confidently detect the language, default to English.
            - If {$language} is specified, use that language for all flashcards.

            Note content:
            {$content}
        EOT;
    }

    public static function quizPrompt(string $content): string
    {
        return "Create a multiple-choice quiz based on the following content. Content:\n\n" . $content;
    }


    public static function mindmapPrompt(string $content): string
    {
        return "Generate a comprehensive mindmap structure based on the following note content.

                The output must be in React Flow-compatible JSON format, including both nodes and edges.

                Nodes should reflect the hierarchy and relationships within the content, with clear parent-child connections.

                Include a root node that summarizes the overall topic, followed by key concepts, subtopics, and supporting ideas.

                Each node should have:

                A unique id

                A type of 'default'

                A data field with a label (short, descriptive title)

                A position object (you can generate default x/y values like { x: 0, y: 0 })

                Edges should connect child nodes to their respective parent using source and target IDs.

                Nodes should be in the language of the note content.
                Return only the JSON object with nodes and edges in a format ready to be used in React Flow.\n\nContent:\n" . $content;
    }
}