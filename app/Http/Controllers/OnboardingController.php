<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class OnboardingController extends Controller
{
    public function show()
    {
        return inertia('Onboarding/Show');
    }

    public function store(Request $request)
    {
        $request->validate([
            'preferred_language' => 'required|string|max:2',
            'discovery_source' => 'nullable|string|max:255',
            'primary_subject_interest' => 'nullable|string|max:255',
            'learning_goals' => 'nullable|string'
        ]);

        $data = $request->only([
            'preferred_language',
            'discovery_source',
            'primary_subject_interest',
            'learning_goals',
        ]);

        $data['onboarding_completed'] = true;

        // Update the user's onboarding fields and mark as completed
        Auth::user()->update($data);

        return redirect()->route('dashboard')
            ->with('success', 'Onboarding completed successfully!');
    }
}