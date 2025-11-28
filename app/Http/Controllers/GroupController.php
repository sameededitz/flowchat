<?php

namespace App\Http\Controllers;

use App\Models\Group;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class GroupController extends Controller
{
    /**
     * Update group information (name, description, avatar)
     */
    public function update(Request $request, Group $group)
    {
        $currentUser = Auth::user();
        
        // Check if user is the owner or admin
        $canEdit = $group->owner_id === $currentUser->id || 
                   $group->members()->where('user_id', $currentUser->id)
                         ->where('role', 'admin')
                         ->exists();

        if (!$canEdit) {
            return response()->json(['error' => 'Only the group owner or admins can edit group information'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
            'avatar' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120', // 5MB max
        ]);

        // Handle avatar upload
        if ($request->hasFile('avatar')) {
            // Delete old avatar if exists
            if ($group->avatar) {
                $oldAvatarPath = str_replace(config('app.url') . '/storage/profile/', '', $group->avatar);
                \Storage::disk('profile')->delete($oldAvatarPath);
            }
            
            // Store new avatar
            $avatarFile = $request->file('avatar');
            $filename = 'group_' . $group->id . '_' . time() . '.' . $avatarFile->getClientOriginalExtension();
            $avatarFile->storeAs('', $filename, 'profile');
            $validated['avatar'] = config('app.url') . '/storage/profile/' . $filename;
        }

        $group->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Group updated successfully',
            'group' => $group->load(['owner', 'members'])
        ]);
    }

    /**
     * Delete a group
     */
    public function destroy(Group $group)
    {
        // Check if user is the owner
        if ($group->owner_id !== Auth::id()) {
            return response()->json(['error' => 'Only the group owner can delete the group'], 403);
        }

        $groupName = $group->name;
        $group->delete();

        return response()->json([
            'success' => true,
            'message' => "Group '$groupName' has been deleted successfully"
        ]);
    }

    /**
     * Invite members to the group
     */
    public function invite(Request $request, Group $group)
    {
        $currentUser = Auth::user();
        
        // Check if user has permission to invite (owner, admin, or moderator)
        $canInvite = $group->owner_id === $currentUser->id || 
                     $group->members()->where('user_id', $currentUser->id)
                           ->whereIn('role', ['admin', 'moderator'])
                           ->exists();

        if (!$canInvite) {
            return response()->json(['error' => 'You do not have permission to invite members'], 403);
        }

        $validated = $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id',
        ]);

        $addedUsers = [];
        $alreadyMembers = [];

        foreach ($validated['user_ids'] as $userId) {
            // Check if user is already a member
            if ($group->members()->where('user_id', $userId)->exists()) {
                $alreadyMembers[] = User::find($userId)->name;
                continue;
            }

            // Add user to group
            $group->members()->attach($userId, [
                'role' => 'member',
                'is_active' => true,
                'joined_at' => now(),
                'invited_by' => $currentUser->id,
            ]);

            $addedUsers[] = User::find($userId)->name;
        }

        $message = '';
        if (count($addedUsers) > 0) {
            $message .= 'Added: ' . implode(', ', $addedUsers) . '. ';
        }
        if (count($alreadyMembers) > 0) {
            $message .= 'Already members: ' . implode(', ', $alreadyMembers) . '.';
        }

        return response()->json([
            'success' => true,
            'message' => trim($message),
            'group' => $group->load(['owner', 'members'])
        ]);
    }

    /**
     * Update a member's role
     */
    public function updateMemberRole(Request $request, Group $group, User $user)
    {
        // Check if requester is the owner
        if ($group->owner_id !== Auth::id()) {
            return response()->json(['error' => 'Only the group owner can change member roles'], 403);
        }

        // Check if user is a member
        if (!$group->members()->where('user_id', $user->id)->exists()) {
            return response()->json(['error' => 'User is not a member of this group'], 404);
        }

        // Don't allow changing owner's role
        if ($user->id === $group->owner_id) {
            return response()->json(['error' => 'Cannot change the owner\'s role'], 400);
        }

        $validated = $request->validate([
            'role' => 'required|in:admin,moderator,member',
        ]);

        $group->members()->updateExistingPivot($user->id, [
            'role' => $validated['role'],
        ]);

        return response()->json([
            'success' => true,
            'message' => "Updated {$user->name}'s role to {$validated['role']}",
            'group' => $group->load(['owner', 'members'])
        ]);
    }

    /**
     * Remove a member from the group
     */
    public function removeMember(Group $group, User $user)
    {
        $currentUser = Auth::user();
        
        // Check if requester has permission (owner, admin, or moderator)
        $canRemove = $group->owner_id === $currentUser->id || 
                     $group->members()->where('user_id', $currentUser->id)
                           ->whereIn('role', ['admin', 'moderator'])
                           ->exists();

        if (!$canRemove) {
            return response()->json(['error' => 'You do not have permission to remove members'], 403);
        }

        // Don't allow removing the owner
        if ($user->id === $group->owner_id) {
            return response()->json(['error' => 'Cannot remove the group owner'], 400);
        }

        // Check if user is a member
        if (!$group->members()->where('user_id', $user->id)->exists()) {
            return response()->json(['error' => 'User is not a member of this group'], 404);
        }

        $group->members()->detach($user->id);

        return response()->json([
            'success' => true,
            'message' => "{$user->name} has been removed from the group",
            'group' => $group->load(['owner', 'members'])
        ]);
    }

    /**
     * Transfer ownership of the group to another member
     */
    public function transferOwnership(Group $group, User $user)
    {
        $currentUser = Auth::user();
        
        // Only the current owner can transfer ownership
        if ($group->owner_id !== $currentUser->id) {
            return response()->json(['error' => 'Only the group owner can transfer ownership'], 403);
        }

        // Check if target user is a member of the group
        if (!$group->members()->where('user_id', $user->id)->exists()) {
            return response()->json(['error' => 'User must be a member of the group to become owner'], 404);
        }

        // Don't allow transferring to self
        if ($user->id === $currentUser->id) {
            return response()->json(['error' => 'Cannot transfer ownership to yourself'], 400);
        }

        // Start transaction
        DB::beginTransaction();
        
        try {
            // Update group owner
            $group->update(['owner_id' => $user->id]);
            
            // Make the new owner an admin (if they weren't already)
            $group->members()->updateExistingPivot($user->id, ['role' => 'admin']);
            
            // Add the old owner as an admin member if they weren't already a member
            if (!$group->members()->where('user_id', $currentUser->id)->exists()) {
                $group->members()->attach($currentUser->id, [
                    'role' => 'admin',
                    'is_active' => true,
                    'joined_at' => now(),
                    'invited_by' => $user->id,
                ]);
            } else {
                // Update their role to admin
                $group->members()->updateExistingPivot($currentUser->id, ['role' => 'admin']);
            }
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => "Ownership of '{$group->name}' has been transferred to {$user->name}",
                'group' => $group->load(['owner', 'members'])
            ]);
            
        } catch (\Exception $e) {
            DB::rollback();
            return response()->json(['error' => 'Failed to transfer ownership'], 500);
        }
    }

    /**
     * Remove group avatar
     */
    public function removeAvatar(Group $group)
    {
        $currentUser = Auth::user();
        
        // Check if user is the owner or admin
        $canEdit = $group->owner_id === $currentUser->id || 
                   $group->members()->where('user_id', $currentUser->id)
                         ->where('role', 'admin')
                         ->exists();

        if (!$canEdit) {
            return response()->json(['error' => 'Only the group owner or admins can remove group avatar'], 403);
        }

        if (!$group->avatar) {
            return response()->json(['error' => 'Group has no avatar to remove'], 400);
        }

        // Delete avatar file
        $avatarPath = str_replace(config('app.url') . '/storage/profile/', '', $group->avatar);
        \Storage::disk('profile')->delete($avatarPath);
        
        // Update group record
        $group->update(['avatar' => null]);

        return response()->json([
            'success' => true,
            'message' => 'Group avatar removed successfully',
            'group' => $group->load(['owner', 'members'])
        ]);
    }
}
