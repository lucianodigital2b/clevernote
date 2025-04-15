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
            'title' => 'string|max:255',
            'folder_id' => 'nullable|integer|exists:folders,id|required',
            'audio_file' =>'file|mimes:mp3,ogg,flac,wav',
            'pdf_file' =>'file|nullable|mimes:pdf,doc,docx',
            'title' => 'nullable|string', 
            'link' => 'nullable|string', 
            'content' => 'nullable|string', 
            'transcription' => 'nullable|string', 
            'summary' => 'nullable|string', 
            'is_pinned' => 'nullable|integer',
            'language' => 'nullable|string',
            
        ];
    }
}
