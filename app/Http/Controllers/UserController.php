<?php

namespace App\Http\Controllers;

use App\Events\UserBlocked;
use App\Models\Conversation;
use App\Models\User;
use App\Models\UserBlock;
use Illuminate\Http\Request;

class UserController extends Controller
{
    /**
     * Block a user
     */
    public function blockUser(User $user)
    {
        $currentUser = auth()->user();

        // Prevent blocking yourself
        if ($currentUser->id === $user->id) {
            return response()->json([
                'message' => 'You cannot block yourself'
            ], 400);
        }

        // Check if already blocked
        if ($currentUser->hasBlocked($user)) {
            return response()->json([
                'message' => 'User is already blocked'
            ], 400);
        }

        // Create the block
        UserBlock::create([
            'blocker_id' => $currentUser->id,
            'blocked_id' => $user->id,
        ]);

        // Broadcast the blocking event
        broadcast(new UserBlocked($currentUser->id, $user->id, true));

        return response()->json([
            'message' => 'User blocked successfully',
            'blocked' => true
        ]);
    }

    /**
     * Unblock a user
     */
    public function unblockUser(User $user)
    {
        $currentUser = auth()->user();

        // Find and delete the block
        $deleted = UserBlock::where('blocker_id', $currentUser->id)
            ->where('blocked_id', $user->id)
            ->delete();

        if (!$deleted) {
            return response()->json([
                'message' => 'User is not blocked'
            ], 400);
        }

        // Broadcast the unblocking event
        broadcast(new UserBlocked($currentUser->id, $user->id, false));

        return response()->json([
            'message' => 'User unblocked successfully',
            'blocked' => false
        ]);
    }

    /**
     * Search for users by query (name or email)
     */
    public function search(Request $request)
    {
        $query = $request->input('query', '');
        $currentUserId = auth()->id();
        
        $users = User::where('id', '!=', $currentUserId)
            ->where(function($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                  ->orWhere('email', 'like', "%{$query}%");
            })
            ->selectRaw('id, name, email, avatar, 
                EXISTS(SELECT 1 FROM user_blocks WHERE blocker_id = ? AND blocked_id = users.id) as i_blocked,
                EXISTS(SELECT 1 FROM user_blocks WHERE blocker_id = users.id AND blocked_id = ?) as blocked_me', 
                [$currentUserId, $currentUserId])
            ->limit(10)
            ->get()
            ->map(function($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'avatar_url' => $user->avatar ? asset('storage/' . $user->avatar) : null,
                    'i_blocked' => (bool) $user->i_blocked,
                    'blocked_me' => (bool) $user->blocked_me
                ];
            });
        
        return response()->json($users);
    }

    /**
     * Find or create a conversation with a user by their email
     */
    public function findOrCreateConversation(Request $request)
    {
        $request->validate([
            'email' => 'required|email'
        ]);

        // Find user by email
        $user = User::where('email', $request->email)
            ->where('id', '!=', auth()->id())
            ->first();

        if (!$user) {
            return response()->json([
                'message' => 'User not found with this email address'
            ], 404);
        }

        // Check if conversation already exists
        $conversation = Conversation::where(function($query) use ($user) {
            $query->where('user_id1', auth()->id())
                  ->where('user_id2', $user->id);
        })
        ->orWhere(function($query) use ($user) {
            $query->where('user_id1', $user->id)
                  ->where('user_id2', auth()->id());
        })
        ->first();

        $hasConversation = $conversation !== null;

        // If no conversation exists, create one
        if (!$hasConversation) {
            $conversation = Conversation::create([
                'user_id1' => auth()->id(),
                'user_id2' => $user->id
            ]);
        }

        return response()->json([
            'user_id' => $user->id,
            'has_conversation' => $hasConversation,
            'message' => $hasConversation ? 'Conversation found' : 'Conversation created'
        ]);
    }

    /**
     * Delete a conversation (only for blocked users)
     */
    public function deleteConversation(User $user)
    {
        $currentUser = auth()->user();

        // Only allow deleting if user has blocked the other user
        if (!$currentUser->hasBlocked($user)) {
            return response()->json([
                'message' => 'You can only delete conversations with blocked users'
            ], 403);
        }

        // Find and delete the conversation
        $deleted = Conversation::where(function($query) use ($user, $currentUser) {
            $query->where('user_id1', $currentUser->id)
                  ->where('user_id2', $user->id);
        })
        ->orWhere(function($query) use ($user, $currentUser) {
            $query->where('user_id1', $user->id)
                  ->where('user_id2', $currentUser->id);
        })
        ->delete();

        if (!$deleted) {
            return response()->json([
                'message' => 'Conversation not found'
            ], 404);
        }

        return response()->json([
            'message' => 'Conversation deleted successfully'
        ]);
    }
}
