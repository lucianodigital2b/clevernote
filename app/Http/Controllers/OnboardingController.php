<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Services\DeepSeekService;
use Illuminate\Support\Facades\Log;

class OnboardingController extends Controller
{
    public function show()
    {
        // If user has already completed onboarding, redirect to dashboard
        if (Auth::user()->onboarding_completed) {
            return redirect()->route('dashboard');
        }
        
        return inertia('Onboarding/Show');
    }

    public function store(Request $request)
    {
        $request->validate([
            'preferred_language' => 'required|string',
            'discovery_source' => 'nullable|string|max:255',
            'primary_subject_interest' => 'nullable|string|max:255',
            'learning_goals' => 'nullable|string',
            'surveyData' => 'nullable|array'
        ]);

        $surveyData = $request->input('surveyData', []);
        
        $data = $request->only([
            'preferred_language',
            'discovery_source',
            'primary_subject_interest',
            'learning_goals',
        ]);
        
        $data['onboarding_completed'] = true;
        $data['survey_data'] = $surveyData;

        // Update the user's onboarding fields and mark as completed
        $user = Auth::user();
        $user->update($data);

        // Generate default study plan
        try {
            $defaultStudyPlan = [
                'plan_title' => 'study_plan_title',
                'plan_description' => 'study_plan_description',
                'weekly_goals' => [
                    [
                        'week' => 1,
                        'title' => 'study_plan_week_1_title',
                        'description' => 'study_plan_week_1_description',
                        'focus_areas' => ['study_plan_focus_organization', 'study_plan_focus_planning']
                    ],
                    [
                        'week' => 2,
                        'title' => 'study_plan_week_2_title',
                        'description' => 'study_plan_week_2_description',
                        'focus_areas' => ['study_plan_focus_practice', 'study_plan_focus_review']
                    ]
                ],
                'calendar_events' => [
                    [
                        'title' => 'study_plan_event_study',
                        'daysOfWeek' => [3, 4, 6],
                        'startRecur' => '2025-07-01',
                        'endRecur' => '2025-07-27',
                        'category' => 'study',
                        'backgroundColor' => '#3b82f6',
                        'borderColor' => '#1d4ed8'
                    ],
                    [
                        'title' => 'study_plan_event_study',
                        'start' => '2025-07-08',
                        'category' => 'study',
                        'backgroundColor' => '#3b82f6',
                        'borderColor' => '#1d4ed8'
                    ],
                    [
                        'title' => 'study_plan_event_study',
                        'start' => '2025-07-15',
                        'category' => 'study',
                        'backgroundColor' => '#3b82f6',
                        'borderColor' => '#1d4ed8'
                    ],
                    [
                        'title' => 'study_plan_event_study',
                        'start' => '2025-07-22',
                        'category' => 'study',
                        'backgroundColor' => '#3b82f6',
                        'borderColor' => '#1d4ed8'
                    ],
                    [
                        'title' => 'study_plan_event_rest',
                        'daysOfWeek' => [0, 1, 2, 5],
                        'startRecur' => '2025-07-01',
                        'endRecur' => '2025-07-27',
                        'category' => 'break',
                        'className' => 'descanso',
                        'backgroundColor' => '#f59e0b',
                        'borderColor' => '#d97706'
                    ]
                ],
                'study_tips' => [
                    'study_plan_tip_consistent_routine',
                    'study_plan_tip_regular_breaks',
                    'study_plan_tip_active_review'
                ],
                'success_metrics' => [
                    'study_plan_metric_complete_sessions',
                    'study_plan_metric_maintain_streak'
                ]
            ];
            
            // Store the study plan in the user model
            $user->update(['study_plan' => $defaultStudyPlan]);
            
            // Log::info('Default study plan generated successfully for user: ' . $user->id);
        } catch (\Exception $e) {
            Log::error('Failed to generate default study plan for user: ' . $user->id . '. Error: ' . $e->getMessage());
            // Continue with the flow even if study plan generation fails
        }

        // Set session flag to show upgrade modal after onboarding
        session()->flash('show_upgrade_modal', true);
        
        return redirect()->route('dashboard');
    }
}