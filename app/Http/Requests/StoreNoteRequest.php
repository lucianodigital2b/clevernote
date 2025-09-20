<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreNoteRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => 'nullable|string|max:255',
            'folder_id' => 'nullable|integer|exists:folders,id',
            'audio_file' => 'nullable|file|mimes:mp3,ogg,flac,wav',
            'pdf_file' => 'nullable|file|mimes:pdf,doc,docx,txt,ppt,pptx',
            'image_file' => 'nullable|file|mimes:jpg,jpeg,png,gif,bmp,webp|max:10240', // 10MB max
            'link' => 'nullable|string|url', 
            'content' => 'nullable|string', 
            'text_content' => 'nullable|string|max:50000', // Limit text content to 50,000 characters
            'transcription' => 'nullable|string', 
            'summary' => 'nullable|string', 
            'is_pinned' => 'nullable|boolean',
            'language' => 'nullable|string',
            'icon' => 'nullable|string',
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            // Ensure at least one content source is provided
            $hasFile = $this->hasFile('pdf_file') || $this->hasFile('audio_file') || $this->hasFile('image_file');
            $hasTextContent = !empty($this->input('text_content'));
            $hasLink = !empty($this->input('link'));
            $hasContent = !empty($this->input('content'));

            if (!$hasFile && !$hasTextContent && !$hasLink && !$hasContent) {
                $validator->errors()->add('content', 'Please provide either a file, text content, link, or content to create a note.');
            }
        });
    }
}
