<?php

namespace Database\Seeders;

use App\Models\Product;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Product::create([
            'name' => 'Student',
            'stripe_product_id' => null, // To be set when Stripe product is created
            'description' => 'pricing_student_description',
            'features' => [
                ['included' => true, 'text' => 'pricing_feature_unlimited_notes'],
                ['included' => true, 'text' => 'pricing_feature_advanced_formatting'],
                ['included' => true, 'text' => 'pricing_feature_flashcards'],
                ['included' => true, 'text' => 'pricing_feature_quizzes'],
                ['included' => true, 'text' => 'pricing_feature_ai_summaries'],
                ['included' => true, 'text' => 'pricing_feature_spaced_repetition'],
                ['included' => true, 'text' => 'pricing_feature_collaboration'],
                ['included' => true, 'text' => 'pricing_feature_priority_support'],
            ],
            'cta' => 'pricing_start_trial',
            'popular' => true,
            'active' => true,
        ]);
    }
}
