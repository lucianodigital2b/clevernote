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
            You are an AI assistant that creates COLLEGE-LEVEL flashcards for advanced studying. 
            Given the following note content, generate a JSON array of challenging, academically rigorous flashcards.
            
            DIFFICULTY REQUIREMENTS - COLLEGE GRADE LEVEL:
            - Create questions that require critical thinking, analysis, and synthesis
            - Focus on complex concepts, theoretical frameworks, and advanced applications
            - Include questions that test understanding of relationships between concepts
            - Ask for explanations of processes, mechanisms, and underlying principles
            - Require students to compare, contrast, evaluate, and apply knowledge
            - Use higher-order thinking skills (analysis, synthesis, evaluation)
            - Avoid simple recall or definition-based questions
            
            QUESTION TYPES TO INCLUDE:
            - "Explain the relationship between X and Y and how it affects Z"
            - "Analyze the implications of [concept] in the context of [scenario]"
            - "Compare and contrast [concept A] with [concept B], highlighting key differences"
            - "Evaluate the effectiveness of [method/theory] and justify your reasoning"
            - "Apply [principle] to solve [complex scenario] and explain your approach"
            - "Synthesize information from multiple sources to explain [phenomenon]"
            - "Critically assess the strengths and limitations of [theory/approach]"
            
            ANSWER REQUIREMENTS:
            - Provide comprehensive, detailed explanations (not just brief definitions)
            - Include multiple components or steps when applicable
            - Explain the reasoning behind concepts
            - Connect ideas to broader theoretical frameworks
            - Include examples or applications where relevant
            - Demonstrate deep understanding rather than surface-level knowledge

            Language Instructions:
            1. First, determine the target language:
               - If {$language} is specified, use that language for ALL flashcard content.
               - If {$language} is 'autodetect':
                 a. Analyze the input content's language patterns and characteristics
                 b. Identify the primary language used in the content
                 c. Use the detected language for ALL flashcard questions and answers
                 d. Only default to English if language detection confidence is below 50%
            2. Generate ALL flashcard content (questions and answers) in the determined target language
            3. Preserve technical terms and proper nouns in their original form

            Requirements:
            - Return only a valid JSON array, no extra text.
            - Each item in the array must be an object with "question" and "answer" fields.
            - Generate flashcards in the same language as the input content
            - Ensure ALL flashcards are college-level difficulty with complex, analytical questions

            Note content:
            {$content}
        EOT;
    }

    public static function quizPrompt(string $content): string
    {
        return <<<EOT
            Generate a comprehensive multiple-choice quiz based on the following content.
            
            Requirements:
            - Create 10-15 questions that test understanding of key concepts
            - Only one option should be correct
            - Include a mix of difficulty levels (easy, medium, hard)
            - Focus on important concepts, facts, and relationships from the content
            - Avoid trivial or overly specific details
            - Make incorrect options plausible but clearly wrong
            
            Output Format:
            Return a valid JSON object with the following structure:
            {
                [
                    {
                        "question": "Question text",
                        "type": "multiple_choice",
                        "explanation": "Brief explanation of why the correct answer is right",
                        "options": [
                            {
                                "text": "First option",
                                "is_correct": true or false,
                                "order": 1
                            },
                            {
                                "text": "Second option",
                                "is_correct": 1,
                                "order": 2
                            },
                            {
                                "text": "Third option",
                                "is_correct": true or false,
                                "order": 3
                            },
                            {
                                "text": "Fourth option",
                                "is_correct": true or false,
                                "order": 4
                            }
                        ]
                    }
                ]
            }
            
            Important Notes:
            - Set "is_correct" to "1" for the correct answer, empty string "" for incorrect answers
            - Each question must have exactly 4 options
            - Order should be numbered 1, 2, 3, 4
            - Type should always be "multiple_choice"
            
            Language Instructions:
            - Analyze the content to determine its primary language
            - Generate all quiz content (questions, options, explanations) in the detected language
            - If unable to detect language confidently, default to English
            
            Content to analyze:
            {$content}
            EOT;
    }


    public static function mindmapPrompt(string $content): string
    {
        return "Generate a comprehensive mindmap structure in a TREE LAYOUT based on the following note content.

                The output must be in React Flow-compatible JSON format, including both nodes and edges.

                Language Instructions:
                1. Analyze the input content to determine its primary language
                2. Generate ALL node labels and content in the same language as the input content
                3. Preserve technical terms and proper nouns in their original form
                4. If unable to detect the language confidently, default to English

                IMPORTANT: Structure the mindmap as a hierarchical tree with the root node at the top center, and child nodes branching downward and outward in a tree-like pattern.

                POSITIONING GUIDELINES:
                - Root node (Level 0): Position at { x: 400, y: 50 }
                - Level 1 nodes: Spread horizontally below root (y: 150), with x positions like 100, 300, 500, 700
                - Level 2 nodes: Position below their parents (y: 250), distributed under each Level 1 node
                - Level 3+ nodes: Continue the tree pattern downward (y: 350, 450, etc.)
                - Maintain 200px horizontal spacing between sibling nodes
                - Maintain 100px vertical spacing between levels

                Each node should have:

                A unique id

                A type of 'default'

                A data field with a label (short, descriptive title in the content's language)

                A position object with calculated x/y coordinates following the tree structure above

                A style object with backgroundColor, color, and borderRadius properties based on hierarchy level:
                - Level 0 (root): backgroundColor: '#E0F2FE', color: '#0F172A', borderRadius: '20px'
                - Level 1 (main topics): backgroundColor: '#DCFCE7', color: '#0F172A', borderRadius: '20px'
                - Level 2 (subtopics): backgroundColor: '#FEF3C7', color: '#0F172A', borderRadius: '20px'
                - Level 3 (details): backgroundColor: '#FEE2E2', color: '#0F172A', borderRadius: '20px'
                - Level 4+ (further details): backgroundColor: '#F3E8FF', color: '#0F172A', borderRadius: '20px'

                Edges should connect child nodes to their respective parent using source and target IDs.

                Return only the JSON object with nodes and edges in a format ready to be used in React Flow.\n\nContent:\n" . $content;
    }
}