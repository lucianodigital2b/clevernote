<?php

namespace App\Http\Controllers;

use App\Models\Group;
use App\Models\GroupMembership;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class GroupController extends Controller
{
    /**
     * Display a listing of groups
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        
        $groups = $user->groups()
            ->with(['creator', 'memberships'])
            ->withCount('members')
            ->get()
            ->map(function ($group) use ($user) {
                $membership = $group->memberships->where('user_id', $user->id)->first();
                return [
                    'id' => $group->id,
                    'title' => $group->title,
                    'description' => $group->description,
                    'image' => $group->image ? Storage::url($group->image) : null,
                    'invite_code' => $group->invite_code,
                    'created_by' => $group->creator->name,
                    'is_owner' => $group->created_by === $user->id,
                    'is_creator' => $group->created_by === $user->id, // Add alias for compatibility
                    'role' => $membership ? $membership->role : null,
                    'members_count' => $group->members_count,
                    'joined_at' => $membership ? $membership->joined_at : null,
                    'created_at' => $group->created_at,
                    'updated_at' => $group->updated_at,
                ];
            });

        // Check if this is an API request
        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json($groups);
        }

        return Inertia::render('Groups/index', [
            'groups' => $groups
        ]);
    }

    /**
     * Show the form for creating a new group
     */
    public function create()
    {
        return Inertia::render('Groups/create');
    }

    /**
     * Store a newly created group
     */
    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048'
        ]);

        $user = Auth::user();
        
        $groupData = [
            'title' => $request->title,
            'description' => $request->description,
            'created_by' => $user->id,
        ];

        // Handle image upload
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('group-images', 'public');
            $groupData['image'] = $imagePath;
        }

        $group = Group::create($groupData);

        // Add creator as admin
        GroupMembership::create([
            'group_id' => $group->id,
            'user_id' => $user->id,
            'role' => 'admin',
            'joined_at' => now(),
        ]);

        return redirect()->route('groups.show', $group)->with('success', 'Group created successfully!');
    }

    /**
     * Display the specified group
     */
    public function show(Group $group, Request $request)
    {
        $user = Auth::user();
        
        // Check if user is a member
        $membership = GroupMembership::where('group_id', $group->id)
            ->where('user_id', $user->id)
            ->first();

        if (!$membership) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json(['message' => 'You are not a member of this group'], 403);
            }
            return redirect()->route('groups.index')->with('error', 'You are not a member of this group');
        }

        $group->load(['creator', 'members']);
        
        $groupData = [
            'id' => $group->id,
            'title' => $group->title,
            'description' => $group->description,
            'image' => $group->image ? Storage::url($group->image) : null,
            'invite_code' => $group->invite_code,
            'created_at' => $group->created_at,
            'updated_at' => $group->updated_at,
            'owner' => [
                'id' => $group->creator->id,
                'name' => $group->creator->name,
                'email' => $group->creator->email,
            ],
            'is_owner' => $group->created_by === $user->id,
            'members' => $group->members->map(function ($member) {
                return [
                    'id' => $member->id,
                    'name' => $member->name,
                    'email' => $member->email,
                    'avatar' => $member->avatar,
                ];
            }),
        ];

        // Check if this is an API request
        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json($groupData);
        }

        return Inertia::render('Groups/show', [
            'group' => $groupData
        ]);
    }

    /**
     * Update the specified group
     */
    public function update(Request $request, Group $group)
    {
        $user = Auth::user();
        
        // Check if user is admin/owner
        $membership = GroupMembership::where('group_id', $group->id)
            ->where('user_id', $user->id)
            ->where('role', 'admin')
            ->first();

        if (!$membership) {
            return back()->with('error', 'You do not have permission to update this group');
        }

        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048'
        ]);

        $updateData = $request->only(['title', 'description']);

        // Handle image upload
        if ($request->hasFile('image')) {
            // Delete old image if exists
            if ($group->image) {
                Storage::disk('public')->delete($group->image);
            }
            
            $imagePath = $request->file('image')->store('group-images', 'public');
            $updateData['image'] = $imagePath;
        }

        $group->update($updateData);

        return back()->with('success', 'Group updated successfully!');
    }

    /**
     * Remove the specified group
     */
    public function destroy(Group $group)
    {
        $user = Auth::user();
        
        // Check if user is the owner
        if ($group->created_by !== $user->id) {
            return back()->with('error', 'You do not have permission to delete this group');
        }

        // Delete group image if exists
        if ($group->image) {
            Storage::disk('public')->delete($group->image);
        }

        $group->delete();

        return redirect()->route('groups.index')->with('success', 'Group deleted successfully!');
    }

    /**
     * Invite a user to the group
     */
    public function invite(Request $request, Group $group)
    {
        $user = Auth::user();
        
        // Check if user is admin/owner
        $membership = GroupMembership::where('group_id', $group->id)
            ->where('user_id', $user->id)
            ->where('role', 'admin')
            ->first();

        if (!$membership) {
            return back()->with('error', 'You do not have permission to invite members');
        }

        $request->validate([
            'email' => 'required|email|exists:users,email'
        ]);

        $invitedUser = User::where('email', $request->email)->first();

        // Check if user is already a member
        $existingMembership = GroupMembership::where('group_id', $group->id)
            ->where('user_id', $invitedUser->id)
            ->first();

        if ($existingMembership) {
            return back()->with('error', 'User is already a member of this group');
        }

        // Add user to group
        GroupMembership::create([
            'group_id' => $group->id,
            'user_id' => $invitedUser->id,
            'role' => 'member',
            'joined_at' => now(),
        ]);

        return back()->with('success', 'User invited successfully!');
    }

    /**
     * Remove a member from the group
     */
    public function removeMember(Group $group, User $user)
    {
        $currentUser = Auth::user();
        
        // Check if current user is admin/owner
        $membership = GroupMembership::where('group_id', $group->id)
            ->where('user_id', $currentUser->id)
            ->where('role', 'admin')
            ->first();

        if (!$membership) {
            return back()->with('error', 'You do not have permission to remove members');
        }

        // Cannot remove the group owner
        if ($group->created_by === $user->id) {
            return back()->with('error', 'Cannot remove the group owner');
        }

        $memberMembership = GroupMembership::where('group_id', $group->id)
            ->where('user_id', $user->id)
            ->first();

        if (!$memberMembership) {
            return back()->with('error', 'User is not a member of this group');
        }

        $memberMembership->delete();

        return back()->with('success', 'Member removed successfully!');
    }

    /**
     * Join a group using invite code (API endpoint)
     */
    public function join(Request $request)
    {
        $request->validate([
            'invite_code' => 'required|string|size:8'
        ]);

        $user = Auth::user();
        $inviteCode = strtoupper($request->invite_code);

        $group = Group::where('invite_code', $inviteCode)
            ->where('is_active', true)
            ->first();

        if (!$group) {
            return response()->json([
                'message' => 'Invalid invite code'
            ], 404);
        }

        // Check if user is already a member
        $existingMembership = GroupMembership::where('group_id', $group->id)
            ->where('user_id', $user->id)
            ->first();

        if ($existingMembership) {
            return response()->json([
                'message' => 'You are already a member of this group'
            ], 409);
        }

        // Add user to group
        GroupMembership::create([
            'group_id' => $group->id,
            'user_id' => $user->id,
            'role' => 'member',
            'joined_at' => now(),
        ]);

        return response()->json([
            'message' => 'Successfully joined the group',
            'group' => $group->load('creator')
        ]);
    }

    /**
     * Get group leaderboard (API endpoint)
     */
    public function leaderboard(Group $group, Request $request)
    {
        $user = Auth::user();
        
        // Check if user is a member
        $membership = GroupMembership::where('group_id', $group->id)
            ->where('user_id', $user->id)
            ->first();

        if (!$membership) {
            return response()->json([
                'message' => 'You are not a member of this group'
            ], 403);
        }

        $period = $request->get('period', 'week');
        $leaderboard = $group->getLeaderboard($period);

        return response()->json([
            'period' => $period,
            'leaderboard' => $leaderboard
        ]);
    }

    /**
     * Leave group (API endpoint)
     */
    public function leave(Group $group)
    {
        $user = Auth::user();
        
        $membership = GroupMembership::where('group_id', $group->id)
            ->where('user_id', $user->id)
            ->first();

        if (!$membership) {
            return response()->json([
                'message' => 'You are not a member of this group'
            ], 404);
        }

        // Check if user is the creator
        if ($group->created_by === $user->id) {
            return response()->json([
                'message' => 'Group creators cannot leave their own group. Transfer ownership or delete the group instead.'
            ], 403);
        }

        $membership->delete();

        return response()->json([
            'message' => 'Successfully left the group'
        ]);
    }

    /**
     * Regenerate invite code (API endpoint)
     */
    public function regenerateInviteCode(Group $group)
    {
        $user = Auth::user();
        
        // Check if user is admin
        $membership = GroupMembership::where('group_id', $group->id)
            ->where('user_id', $user->id)
            ->where('role', 'admin')
            ->first();

        if (!$membership) {
            return response()->json([
                'message' => 'You do not have permission to regenerate the invite code'
            ], 403);
        }

        $newCode = $group->regenerateInviteCode();

        return response()->json([
            'message' => 'Invite code regenerated successfully',
            'invite_code' => $newCode
        ]);
    }
}