<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    /**
     * Search for users by query (name or email)
     */
    public function search(Request $request)
    {
        $query = $request->input('query', '');
        
        $users = User::where('id', '!=', auth()->id())
            ->where(function($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                  ->orWhere('email', 'like', "%{$query}%");
            })
            ->select('id', 'name', 'email', 'avatar')
            ->limit(10)
            ->get()
            ->map(function($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'avatar_url' => $user->avatar ? asset('storage/' . $user->avatar) : null
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
}
