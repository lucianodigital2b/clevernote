<?php

namespace Tests\Feature;

use App\Models\Tag;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TagControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_store_creates_tag_with_color()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->postJson('/tags', [
                'name' => 'Test Tag'
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'tag' => [
                    'id',
                    'name',
                    'color',
                    'user_id',
                    'created_at',
                    'updated_at'
                ],
                'message'
            ]);

        $tag = Tag::first();
        $this->assertNotNull($tag->color);
        $this->assertMatchesRegularExpression('/^#[0-9a-f]{6}$/i', $tag->color);
        $this->assertEquals('Test Tag', $tag->name);
        $this->assertEquals($user->id, $tag->user_id);
    }

    public function test_store_requires_authentication()
    {
        $response = $this->postJson('/tags', [
            'name' => 'Test Tag'
        ]);

        $response->assertStatus(401);
    }

    public function test_store_validates_name_required()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->postJson('/tags', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    }

    public function test_index_returns_user_tags()
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        
        // Create tags for the authenticated user
        Tag::factory()->create(['user_id' => $user->id, 'name' => 'User Tag 1']);
        Tag::factory()->create(['user_id' => $user->id, 'name' => 'User Tag 2']);
        
        // Create tag for another user (should not be returned)
        Tag::factory()->create(['user_id' => $otherUser->id, 'name' => 'Other User Tag']);

        $response = $this->actingAs($user)
            ->getJson('/tags');

        $response->assertStatus(200)
            ->assertJsonCount(2)
            ->assertJsonFragment(['name' => 'User Tag 1'])
            ->assertJsonFragment(['name' => 'User Tag 2'])
            ->assertJsonMissing(['name' => 'Other User Tag']);
    }
}