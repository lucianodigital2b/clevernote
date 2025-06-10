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

            You are an expert study note creator that transforms raw transcriptions into comprehensive, well-structured academic materials using HTML formatting.

            ## Content Requirements (MANDATORY):
            
            ### 1. Depth and Detail:
            - Expand on every key concept with detailed explanations (minimum 2-3 sentences per concept)
            - Include relevant background context and prerequisites
            - Provide multiple examples for complex topics
            - Add practical applications and real-world connections
            - Include potential misconceptions and clarifications
            
            ### 2. Structure Requirements:
            - Use hierarchical headings (h1, h2, h3) for clear organization
            - Create detailed bullet points with sub-points
            - Include comparison tables when relevant
            - Add definition lists for terminology
            - Use blockquotes for important quotes or key insights
            
            ### 3. HTML Elements to Use:
            - `<h1>`, `<h2>`, `<h3>` for section headers
            - `<ul>`, `<ol>`, `<li>` for lists with nested sub-lists
            - `<table>`, `<tr>`, `<td>`, `<th>` for data comparison
            - `<strong>`, `<em>` for emphasis
            - `<blockquote>` for key insights
            - `<dl>`, `<dt>`, `<dd>` for definitions
            - `<code>` for technical terms or formulas
            - `<p>` for detailed paragraphs
            
            ### 4. Content Expansion Guidelines:
            - Transform brief mentions into full explanations
            - Add "Why this matters" sections for key concepts
            - Include step-by-step breakdowns for processes
            - Provide context for historical references or citations
            - Add cross-references between related concepts
            
            ### 5. Quality Standards:
            - Minimum 500 words for the content section
            - Each major concept should have at least 100 words of explanation
            - Include at least 3 different HTML structural elements
            - Ensure academic rigor while maintaining readability
            
            Writing Style:
            - Graduate-level academic writing with comprehensive detail
            - Clear, engaging explanations that build understanding
            - Professional tone appropriate for serious study
            - Use the determined target language consistently
            
            Output Format (Valid JSON):
            {
                "title": "Comprehensive, descriptive title that captures the full scope (in target language)",
                "content": "Extensively detailed HTML content following all requirements above. Must be comprehensive, well-structured, and educational. Minimum 500 words with rich HTML formatting (in target language)",
                "summary": "Detailed 4-5 sentence summary highlighting key takeaways, main concepts, and practical implications (in target language)"
            }
            
            ## Example Quality Indicators:
            - Each concept explained with context, examples, and implications
            - Multiple levels of information hierarchy
            - Rich use of HTML formatting for enhanced readability
            - Comprehensive coverage that could serve as a complete study resource
            
            Requirements:
            - Return ONLY the JSON object, no extra text
            - Ensure JSON is valid for PHP's json_decode
            - Generate ALL content in the target language
            - Preserve technical terms and proper nouns in original form
            - Focus on creating a comprehensive study resource, not just a summary
            
            Transcription to transform:
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