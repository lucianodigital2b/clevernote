<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;

class WelcomeController extends Controller
{
    /**
     * Display the welcome page with pricing data
     */
    public function index()
    {
        $products = Product::active()->with('activePrices')->get();
        
        // Transform products to match the frontend pricing structure
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
        
        return Inertia::render('welcome', [
            'pricingPlans' => $pricingPlans
        ]);
    }
}
