<?php

// Manual token calculation (same as AbstractAIService)
function estimateTokens($text) {
    return (int) ceil(strlen($text) / 4);
}

// System prompt from DeepSeekService
$systemPrompt = 'You are an expert educational content creator and study assistant. Your role is to transform raw content into comprehensive, detailed study materials that help students deeply understand complex topics. Always respond in valid JSON format with rich, educational content that demonstrates mastery-level understanding of the subject matter.';

echo "System prompt length: " . strlen($systemPrompt) . " chars\n";
echo "System prompt tokens: " . estimateTokens($systemPrompt) . "\n\n";

// Chunk overhead (info + instructions)
$chunkInfo = "\n\n[CHUNK 1 OF 3]\n";
$chunkInstructions = "\n\nIMPORTANT: This is chunk 1 of 3. Process this chunk as part of a larger document. Maintain consistency with the overall structure and format requirements.";
$chunkOverhead = $chunkInfo . $chunkInstructions;

echo "Chunk overhead length: " . strlen($chunkOverhead) . " chars\n";
echo "Chunk overhead tokens: " . estimateTokens($chunkOverhead) . "\n\n";

// Actual study note prompt template
$studyTemplate = <<<EOT

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
            [CONTENT_PLACEHOLDER]
        EOT;

echo "Template length: " . strlen($studyTemplate) . " chars\n";
echo "Template estimated tokens: " . estimateTokens($studyTemplate) . "\n\n";

// Test with 12k token chunk
$chunkTokens = 12000;
$chunkChars = $chunkTokens * 4; // Reverse calculation
echo "12k token chunk chars: " . $chunkChars . "\n";

// Total calculation
$totalOverhead = estimateTokens($systemPrompt) + estimateTokens($chunkOverhead) + estimateTokens($studyTemplate);
$totalWithChunk = $totalOverhead + $chunkTokens;

echo "\nOVERHEAD BREAKDOWN:\n";
echo "System prompt: " . estimateTokens($systemPrompt) . " tokens\n";
echo "Template: " . estimateTokens($studyTemplate) . " tokens\n";
echo "Chunk overhead: " . estimateTokens($chunkOverhead) . " tokens\n";
echo "Total overhead: " . $totalOverhead . " tokens\n";
echo "12k chunk: " . $chunkTokens . " tokens\n";
echo "TOTAL INPUT: " . $totalWithChunk . " tokens\n";
echo "Remaining for response: " . (128000 - $totalWithChunk) . " tokens\n\n";

if ($totalWithChunk > 100000) {
    echo "WARNING: This exceeds safe limits!\n";
}

// Calculate safe chunk size
$safeInputLimit = 100000; // Leave 28k for response
$safeChunkSize = $safeInputLimit - $totalOverhead;
echo "Safe chunk size: " . $safeChunkSize . " tokens\n";
echo "Recommended max chunk: " . ($safeChunkSize - 1000) . " tokens (with buffer)\n";