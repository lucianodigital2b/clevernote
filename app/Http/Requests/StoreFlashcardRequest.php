<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use App\Models\Folder; // Import Folder model

class StoreFlashcardRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Check if a folder_id is provided
        if ($this->input('folder_id')) {
            $folder = Folder::find($this->input('folder_id'));
            // User must own or have update permission on the folder
            return $folder && $this->user()->can('update', $folder);
        }

        // If no folder_id, user just needs to be authenticated to create a global flashcard
        return Auth::check();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'question' => ['required', 'string', 'max:65535'], // Max TEXT size
            'answer' => ['required', 'string', 'max:65535'], // Max TEXT size
            'flashcard_set_id' => ['required', 'integer',], 
            'folder_id' => [
                'nullable',
                'integer',
                // Ensure the folder exists and belongs to the authenticated user if provided
                function ($attribute, $value, $fail) {
                    if ($value) {
                        $folder = Folder::where('id', $value)
                                        ->where('user_id', Auth::id())
                                        ->first();
                        if (!$folder) {
                            $fail("The selected folder is invalid.");
                        }
                    }
                },
            ],
        ];
    }
}