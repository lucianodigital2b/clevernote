<?php

namespace App\Services\Prompts;

class AIPromptsMinimal
{
    public static function studyNotePrompt(string $content, string $language): string
    {
        $targetLanguage = ($language === 'autodetect') ? 'English' : $language;
        
        return <<<EOT
Transform this content into structured study notes in $targetLanguage. Use HTML formatting with headings, lists, and paragraphs. Return JSON with title, content, and summary fields.

Content: $content
EOT;
    }
}