<?php

namespace Tests\Feature;

use App\Models\Note;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

class ChatWithNoteTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Note $note;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->user = User::factory()->create();
        $this->note = Note::factory()->create([
            'user_id' => $this->user->id,
            'title' => 'Test Note',
            'content' => 'This is a test note content for chatting.',
            'status' => 'completed'
        ]);
    }

    /** @test */
    public function it_can_chat_with_a_note()
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson("/api/chat/notes/{$this->note->id}", [
                'message' => 'What is this note about?',
                'conversation_history' => []
            ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'response',
                'conversation_id',
                'timestamp'
            ]);
    }

    /** @test */
    public function it_validates_required_message()
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson("/api/chat/notes/{$this->note->id}", [
                'conversation_history' => []
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['message']);
    }

    /** @test */
    public function it_validates_message_length()
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson("/api/chat/notes/{$this->note->id}", [
                'message' => str_repeat('a', 2001), // Exceeds 2000 character limit
                'conversation_history' => []
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['message']);
    }

    /** @test */
    public function it_validates_conversation_history_structure()
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson("/api/chat/notes/{$this->note->id}", [
                'message' => 'Test message',
                'conversation_history' => [
                    ['invalid' => 'structure'] // Missing role and content
                ]
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors([
                'conversation_history.0.role',
                'conversation_history.0.content'
            ]);
    }

    /** @test */
    public function it_accepts_valid_conversation_history()
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson("/api/chat/notes/{$this->note->id}", [
                'message' => 'Follow up question',
                'conversation_history' => [
                    [
                        'role' => 'user',
                        'content' => 'Previous question'
                    ],
                    [
                        'role' => 'assistant',
                        'content' => 'Previous response'
                    ]
                ]
            ]);

        $response->assertStatus(200);
    }

    /** @test */
    public function it_prevents_access_to_other_users_notes()
    {
        $otherUser = User::factory()->create();
        $otherNote = Note::factory()->create(['user_id' => $otherUser->id]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson("/api/chat/notes/{$otherNote->id}", [
                'message' => 'What is this note about?',
                'conversation_history' => []
            ]);

        $response->assertStatus(403);
    }

    /** @test */
    public function it_throttles_chat_requests()
    {
        // Clear any existing rate limits
        RateLimiter::clear('chat_throttle:user:' . $this->user->id);

        // Make 10 requests (the limit)
        for ($i = 0; $i < 10; $i++) {
            $response = $this->actingAs($this->user, 'sanctum')
                ->postJson("/api/chat/notes/{$this->note->id}", [
                    'message' => "Test message {$i}",
                    'conversation_history' => []
                ]);
            
            $response->assertStatus(200);
        }

        // The 11th request should be throttled
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson("/api/chat/notes/{$this->note->id}", [
                'message' => 'This should be throttled',
                'conversation_history' => []
            ]);

        $response->assertStatus(429)
            ->assertJsonStructure([
                'error',
                'message',
                'retry_after',
                'retry_after_human',
                'max_attempts',
                'time_window'
            ]);
    }

    /** @test */
    public function it_includes_rate_limit_headers()
    {
        RateLimiter::clear('chat_throttle:user:' . $this->user->id);

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson("/api/chat/notes/{$this->note->id}", [
                'message' => 'Test message',
                'conversation_history' => []
            ]);

        $response->assertStatus(200)
            ->assertHeader('X-RateLimit-Limit', '10')
            ->assertHeader('X-RateLimit-Remaining', '9');
    }

    /** @test */
    public function it_can_get_chat_suggestions()
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson("/api/chat/notes/{$this->note->id}/suggestions");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'suggestions' => [
                    '*' => [
                        'text',
                        'category'
                    ]
                ]
            ]);
    }

    /** @test */
    public function it_works_with_mobile_api_headers()
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->withHeaders([
                'Accept' => 'application/json',
                'Content-Type' => 'application/json',
                'User-Agent' => 'CleverNote-Mobile/1.0.0',
                'X-Requested-With' => 'XMLHttpRequest'
            ])
            ->postJson("/api/chat/notes/{$this->note->id}", [
                'message' => 'Mobile test message',
                'conversation_history' => []
            ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'response',
                'conversation_id',
                'timestamp'
            ]);
    }

    /** @test */
    public function it_handles_streaming_response_format()
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson("/api/chat/notes/{$this->note->id}", [
                'message' => 'Test streaming',
                'conversation_history' => [],
                'stream' => true
            ]);

        // For streaming responses, we expect a 200 status
        // The actual streaming content would be tested in integration tests
        $response->assertStatus(200);
    }

    /** @test */
    public function it_sanitizes_xss_attempts()
    {
        $maliciousMessage = '<script>alert("xss")</script>What is this note about?';
        
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson("/api/chat/notes/{$this->note->id}", [
                'message' => $maliciousMessage,
                'conversation_history' => []
            ]);

        $response->assertStatus(200);
        
        // The response should not contain the script tag
        $responseData = $response->json();
        $this->assertStringNotContainsString('<script>', $responseData['response'] ?? '');
    }

    /** @test */
    public function it_requires_authentication()
    {
        $response = $this->postJson("/api/chat/notes/{$this->note->id}", [
            'message' => 'Test message',
            'conversation_history' => []
        ]);

        $response->assertStatus(401);
    }
}