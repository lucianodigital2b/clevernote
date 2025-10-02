<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Contracts\Validation\Validator;

class ChatWithNoteRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Authorization is handled in the controller
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'message' => [
                'required',
                'string',
                'min:1',
                'max:2000',
                'regex:/^(?!.*<script).*$/i', // Basic XSS prevention
            ],
            'conversation_history' => [
                'sometimes',
                'array',
                'max:20', // Limit conversation history to prevent token overflow
            ],
            'conversation_history.*.role' => [
                'required_with:conversation_history',
                'string',
                'in:user,assistant',
            ],
            'conversation_history.*.content' => [
                'required_with:conversation_history',
                'string',
                'max:2000',
                'regex:/^(?!.*<script).*$/i',
            ],
            'conversation_history.*.timestamp' => [
                'sometimes',
                'date',
            ],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'message.required' => 'Please provide a message to chat about.',
            'message.min' => 'Your message cannot be empty.',
            'message.max' => 'Your message is too long. Please keep it under 2000 characters.',
            'message.regex' => 'Your message contains invalid content.',
            'conversation_history.max' => 'Conversation history is too long. Please start a new conversation.',
            'conversation_history.*.role.in' => 'Invalid conversation history format.',
            'conversation_history.*.content.max' => 'A message in the conversation history is too long.',
            'conversation_history.*.content.regex' => 'Conversation history contains invalid content.',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'message' => 'chat message',
            'conversation_history' => 'conversation history',
            'conversation_history.*.role' => 'message role',
            'conversation_history.*.content' => 'message content',
        ];
    }

    /**
     * Handle a failed validation attempt for mobile-friendly responses.
     */
    protected function failedValidation(Validator $validator)
    {
        $errors = $validator->errors()->toArray();
        
        // Format errors for mobile consumption
        $formattedErrors = [];
        foreach ($errors as $field => $messages) {
            $formattedErrors[$field] = [
                'field' => $field,
                'messages' => $messages,
                'first_message' => $messages[0] ?? null,
            ];
        }

        throw new HttpResponseException(
            response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $formattedErrors,
                'error_count' => count($errors),
                'timestamp' => now()->toISOString(),
            ], 422)
        );
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // Trim whitespace from message
        if ($this->has('message')) {
            $this->merge([
                'message' => trim($this->input('message')),
            ]);
        }

        // Clean up conversation history
        if ($this->has('conversation_history') && is_array($this->input('conversation_history'))) {
            $cleanHistory = [];
            foreach ($this->input('conversation_history') as $item) {
                if (isset($item['content']) && isset($item['role'])) {
                    $cleanHistory[] = [
                        'role' => trim($item['role']),
                        'content' => trim($item['content']),
                        'timestamp' => $item['timestamp'] ?? null,
                    ];
                }
            }
            $this->merge(['conversation_history' => $cleanHistory]);
        }
    }
}