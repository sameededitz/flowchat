<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Conversation extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id1', // ID of the user who owns the conversation
        'user_id2', // ID of the other user in the conversation
        'group_id', // ID of the group if this is a group conversation
        'last_message_id', // ID of the last message in the conversation
    ];

    public function user1()
    {
        return $this->belongsTo(User::class, 'user_id1');
    }

    public function user2()
    {
        return $this->belongsTo(User::class, 'user_id2');
    }

    public function group()
    {
        return $this->belongsTo(Group::class);
    }

    public function lastMessage()
    {
        return $this->belongsTo(Message::class, 'last_message_id');
    }

    public static function getConversations(User $user)
    {
        $users = User::getUsers($user);
        $groups = Group::getGroups($user);

        return collect()
            ->merge($users->map(fn($u) => $u->toConversationArray()))
            ->merge($groups->map(fn($g) => $g->toConversationArray()))
            ->unique(fn($item) => ($item['is_group'] ? 'group_' : 'user_') . $item['id'])
            ->values();
    }

    public static function updateConversation($receiverId, $senderId, Message $message)
    {
        $conversation = self::where(function ($query) use ($receiverId, $senderId) {
            $query->where('user_id1', $receiverId)
                ->where('user_id2', $senderId)
                ->orWhere(function ($q) use ($receiverId, $senderId) {
                    $q->where('user_id1', $senderId)
                        ->where('user_id2', $receiverId);
                });
        })->first();

        if ($conversation) {
            $conversation->update([
                'last_message_id' => $message->id,
            ]);
        } else {
            Conversation::create([
                'user_id1' => $receiverId,
                'user_id2' => $senderId,
                'last_message_id' => $message->id,
            ]);
        }
    }
}
