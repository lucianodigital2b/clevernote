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
            'link' => 'nullable|string|url', 
            'content' => 'nullable|string', 
            'transcription' => 'nullable|string', 
            'summary' => 'nullable|string', 
            'is_pinned' => 'nullable|boolean',
            'language' => 'nullable|string',
            'icon' => 'nullable|string',
        ];
    }
}
