<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\Price;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class PriceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get the Student product
        $product = Product::where('name', 'Student')->first();
        
        if ($product) {
            // Create monthly price
            Price::create([
                'product_id' => $product->id,
                'stripe_price_id' => 'price_1RGgabCUBbBYXpQTdE8BtNm0',
                'amount' => 7.99,
                'currency' => 'usd',
                'interval' => 'month',
                'interval_count' => 1,
                'type' => 'recurring',
                'active' => true,
            ]);
            
            // Create yearly price
            Price::create([
                'product_id' => $product->id,
                'stripe_price_id' => 'price_1RGgbDCUBbBYXpQTsrR61FU7',
                'amount' => 41.99,
                'currency' => 'usd',
                'interval' => 'year',
                'interval_count' => 1,
                'type' => 'recurring',
                'active' => true,
            ]);
        }
    }
}
