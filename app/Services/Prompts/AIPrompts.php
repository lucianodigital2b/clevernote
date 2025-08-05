<?php

namespace App\Services\Prompts;

class AIPrompts
{
    public static function studyNotePrompt(string $content, string $language): string
    {
        // Force English for autodetect to prevent AI misinterpretation
        $targetLanguage = ($language === 'autodetect') ? 'English' : $language;
        
        return <<<EOT

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
        // Force English for autodetect to prevent AI misinterpretation
        $targetLanguage = ($language === 'autodetect') ? "LANGUAGE INSTRUCTION: You MUST generate ALL content in the language of the CONTENT. Do not translate or use any other language." : 
        "LANGUAGE INSTRUCTION: You MUST generate ALL content in {$language}. Do not translate or use any other language.";
        
        return <<<EOT
            
            $targetLanguage 
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
            
            CONCISENESS REQUIREMENTS:
            - Questions: Maximum 15-20 words, clear and direct
            - Answers: 2-4 sentences maximum, focused and insightful
            - Eliminate unnecessary words while preserving meaning
            - Use precise, academic vocabulary
            - Get straight to the core concept
            
            QUESTION FORMATS (keep concise):
            - "How does X affect Y?"
            - "Why is [concept] significant in [context]?"
            - "What distinguishes [A] from [B]?"
            - "When would you apply [principle]?"
            - "What are the key limitations of [theory]?"
            
            ANSWER REQUIREMENTS:
            - Provide focused, insightful explanations (2-4 sentences max)
            - Include only the most essential points
            - Use clear, direct language
            - Connect to broader concepts when relevant
            - Demonstrate deep understanding concisely

            Requirements:
            - Return only a valid JSON array, no extra text.
            - Each item in the array must be an object with "question" and "answer" fields.
            - Generate flashcards in the same language as the input content
            - Ensure ALL flashcards are college-level difficulty with concise, insightful content

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
                "quiz": [
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


                IMPORTANT: Structure the mindmap as a hierarchical tree with the root node at the top center, and child nodes branching downward and outward in a tree-like pattern.

                POSITIONING GUIDELINES:
                - Root node (Level 0): Position at { x: 600, y: 50 }
                - Level 1 nodes: Spread horizontally below root (y: 200), with x positions like 100, 400, 700, 1000
                - Level 2 nodes: Position below their parents (y: 350), distributed under each Level 1 node
                - Level 3+ nodes: Continue the tree pattern downward (y: 500, 650, etc.)
                - Maintain 300px horizontal spacing between sibling nodes
                - Maintain 150px vertical spacing between levels

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

    public static function crosswordPrompt(string $content, string $language): string
    {
        // Force English for autodetect to prevent AI misinterpretation
        $targetLanguage = ($language === 'autodetect') ? "LANGUAGE INSTRUCTION: You MUST generate ALL content in the language of the CONTENT. Do not translate or use any other language." : 
        "LANGUAGE INSTRUCTION: You MUST generate ALL content in {$language}. Do not translate or use any other language.";
        
        return <<<EOT

            $targetLanguage
            You are an AI assistant that creates educational crossword puzzles from study content.
            Given the following note content, generate a crossword puzzle with clues and answers.

            TASK: Generate a valid educational crossword puzzle in **strict** JSON format based on the content below.

            STEP 1: KEY TERM EXTRACTION
            - Extract 8 to 15 **important concepts**, definitions, names, or short phrases (max 2–4 words).
            - Focus on educational value: use terms relevant to learning and memory.
            - Remove **spaces and special characters** from answers (e.g., "WORLD WAR" → "WORLDWAR").
            - Answers MUST vary in length between 3 and 12 characters.

            STEP 2: CLUE CREATION
            - Create one educational clue per term.
            - Clues MUST:
            - Be 5–15 words long.
            - Be definitions, descriptions, or “fill in the blank” style.
            - Be clear, factual, and refer directly to the original content.
            - Avoid riddles, puns, or vague descriptions.

            STEP 3: GRID CONSTRUCTION
            - Grid size: Max 15x15. Top-left is (0,0).
            - Begin with the **longest word placed horizontally in the center**.
            - Then, place each additional word one by one following these rules:
            - It MUST intersect with an already-placed word by **sharing a letter**.
            - Intersection must happen at the **correct grid coordinates** (row/col) with **matching letters**.
            - Placement MUST be at a right angle (across intersects down).
            - There MUST be **no overlapping with incorrect letters**, and **no words without at least one intersection**.
            - Leave **at least one empty cell between parallel words** that don’t intersect.
            - Every word MUST be connected to the grid — no isolated placements.
            - Aim for 2–3 intersections per word if possible.

            ❗️STRICT VALIDATION:
            - Reject any word that cannot intersect with existing ones.
            - Do NOT allow placement unless a valid, accurate intersection exists.
            - Words that are disconnected or floating are strictly forbidden.
            - All words must build a **fully connected crossword** with proper layout and letter accuracy.

            EXAMPLE:
            - "SCIENCE" is placed horizontally at row 5, col 2 → spans cols 2–8.
            - "CHEMISTRY" shares a "C" at index 2.
            - It is placed vertically (down) starting at row 3, col 4 so that the “C” aligns with the one in “SCIENCE”.

            STEP 4: OUTPUT FORMAT
            Return **only a valid JSON object**, compatible with PHP’s `json_decode`. No extra text.

            ```json
            {
            "title": "Crossword title based on content (in target language)",
            "across": {
                "1": {
                "clue": "Clue for across word (in target language)",
                "answer": "ANSWER",
                "row": 5,
                "col": 2
                }
            },
            "down": {
                "2": {
                "clue": "Clue for down word (in target language)",
                "answer": "ANSWER",
                "row": 3,
                "col": 4
                }
            }
            }


        RULES FOR JSON:

        Number clues sequentially (1, 2, 3…).

        Each entry must include row, col, clue, and answer.

        Answers must be uppercase, alphanumeric, no spaces or symbols.

        Do not return explanations or context — ONLY the JSON.

        CONTENT TO PROCESS:
        {$content}

        EOT;
    }

    public static function studyPlanPrompt(array $surveyData, string $language): string
    {
        $surveyJson = json_encode($surveyData, JSON_PRETTY_PRINT);
        
        return <<<EOT
            Language Instructions:
            1. First, determine the target language:
               - If {$language} is specified, use that language for ALL output.
               - If {$language} is 'autodetect', default to English
            2. Generate ALL content in the determined target language
            3. Preserve technical terms and proper nouns in their original form

            You are an expert educational consultant and study planner. Based on the user's onboarding survey responses, create a comprehensive, personalized study plan that spans 4 weeks.

            ## Survey Data Analysis:
            {$surveyJson}

            ## Study Plan Requirements:
            
            ### 1. Personalization:
            - Analyze the user's study experience level, preferred methods, goals, and frequency
            - Tailor the difficulty and pace according to their experience level
            - Focus on their primary subject interest and learning goals
            - Incorporate their preferred study methods throughout the plan
            
            ### 2. Structure (4-Week Plan):
            - Week 1: Foundation building and habit formation
            - Week 2: Skill development and method integration
            - Week 3: Advanced techniques and practice
            - Week 4: Review, assessment, and optimization
            
            ### 3. Daily Activities:
            - Create specific, actionable daily tasks
            - Include variety in study methods based on user preferences
            - Balance learning new content with review and practice
            - Incorporate breaks and reflection time
            
            ### 4. Calendar Events Format:
            Each event should be realistic and achievable, with:
            - Clear titles that indicate the activity type
            - Specific time durations (15min to 2hrs max)
            - Varied activities throughout each day
            - Rest days and lighter study days included
            
            ## Output Format (Valid JSON):
            {
                "plan_title": "Personalized study plan title in target language",
                "plan_description": "2-3 sentence overview of the plan's approach and goals in target language",
                "weekly_goals": [
                    {
                        "week": 1,
                        "title": "Week title in target language",
                        "description": "Week description and objectives in target language",
                        "focus_areas": ["area1", "area2", "area3"]
                    },
                    // ... repeat for 4 weeks
                ],
                "calendar_events": [
                    {
                        "id": "unique_id",
                        "title": "Activity title in target language",
                        "start": "2024-01-15T09:00:00",
                        "end": "2024-01-15T10:30:00",
                        "description": "Detailed activity description in target language",
                        "category": "study|review|practice|break|assessment",
                        "week": 1,
                        "backgroundColor": "#color_code",
                        "borderColor": "#color_code"
                    },
                    // ... continue for 4 weeks of events
                ],
                "study_tips": [
                    "Personalized tip 1 in target language",
                    "Personalized tip 2 in target language",
                    "Personalized tip 3 in target language"
                ],
                "success_metrics": [
                    "Metric 1 for tracking progress in target language",
                    "Metric 2 for tracking progress in target language"
                ]
            }
            
            ## Color Coding for Events:
            - Study sessions: #3B82F6 (blue)
            - Review sessions: #10B981 (green)
            - Practice/exercises: #F59E0B (amber)
            - Breaks/rest: #8B5CF6 (purple)
            - Assessments: #EF4444 (red)
            
            ## Important Guidelines:
            - Start the calendar from next Monday (calculate appropriate dates)
            - Create 3-5 events per day, varying in duration and type
            - Include weekend activities but make them lighter
            - Ensure the plan is realistic and not overwhelming
            - Focus on building sustainable study habits
            - Return ONLY the JSON object, no extra text
            - Ensure JSON is valid for PHP's json_decode
        EOT;
    }
}