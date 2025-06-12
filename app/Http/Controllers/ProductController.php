<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    /**
     * Display a listing of active products.
     */
    public function index()
    {
        $products = Product::active()->get();
        
        return response()->json($products);
    }

    /**
     * Display the specified product.
     */
    public function show(Product $product)
    {
        return response()->json($product);
    }

    /**
     * Get products for pricing page
     */
    public function getPricingPlans()
    {
        $products = Product::active()->with('activePrices')->get();
        
        // Transform to match the frontend pricing structure
        $pricingPlans = $products->map(function ($product) {
            $monthlyPrice = $product->getMonthlyPrice();
            $yearlyPrice = $product->getYearlyPrice();
            
            return [
                'id' => $product->id,
                'name' => $product->name,
                'monthlyPrice' => $monthlyPrice ? $monthlyPrice->formatted_amount : '$0.00',
                'annualPrice' => $yearlyPrice ? $yearlyPrice->formatted_amount : '$0.00',
                'billedMonthly' => $monthlyPrice ? $monthlyPrice->formatted_amount : '$0.00',
                'billedAnnually' => $yearlyPrice ? '$' . number_format($yearlyPrice->amount / 12, 2) : '$0.00',
                'description' => $product->description,
                'features' => $product->features,
                'cta' => $product->cta,
                'popular' => $product->popular,
                'stripeProductId' => $product->stripe_product_id,
                'monthlyPriceId' => $monthlyPrice ? $monthlyPrice->stripe_price_id : null,
                'yearlyPriceId' => $yearlyPrice ? $yearlyPrice->stripe_price_id : null,
            ];
        });
        
        return response()->json($pricingPlans);
    }

    /**
     * Update product with Stripe product ID
     */
    public function updateStripeId(Product $product, Request $request)
    {
        $request->validate([
            'stripe_product_id' => 'required|string|unique:products,stripe_product_id,' . $product->id
        ]);
        
        $product->update([
            'stripe_product_id' => $request->stripe_product_id
        ]);
        
        return response()->json($product);
    }
}