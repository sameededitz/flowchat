<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Group extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'name',
        'slug',
        'description',
        'avatar',
        'owner_id',
        'last_message_id',
    ];

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function members()
    {
        return $this->belongsToMany(User::class, 'group_users')
            ->withPivot('role', 'is_active', 'joined_at', 'invited_by')
            ->withTimestamps();
    }

    public function messages()
    {
        return $this->hasMany(Message::class);
    }

    public static function getGroups(User $user)
    {
        $query = self::select([
            'groups.*',
            'messages.message as last_message',
            'messages.created_at as last_message_date',
        ])
            ->with(['owner', 'members'])
            ->leftJoin('group_users', 'group_users.group_id', '=', 'groups.id')
            ->leftJoin('messages', 'messages.id', '=', 'groups.last_message_id')
            ->where(function($q) use ($user) {
                $q->where('group_users.user_id', $user->id)
                  ->orWhere('groups.owner_id', $user->id);
            })
            ->groupBy('groups.id')
            ->orderBy('messages.created_at', 'desc')
            ->orderBy('groups.name');

        return $query->get();
    }

    public function toConversationArray()
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'slug' => $this->slug,
            'avatar' => $this->avatar,
            'owner_id' => $this->owner_id,
            'owner' => $this->owner,
            'is_group' => true,
            'is_user' => false,
            'users' => $this->members,
            'user_ids' => optional($this->members)->pluck('id') ?? collect(),
            'last_message' => $this->last_message,
            'last_message_date' => $this->last_message_date,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }

    public static function updateConversation($groupId, Message $message)
    {
        return self::updateOrCreate(
            ['id' => $groupId],
            ['last_message_id' => $message->id]
        );
    }
}
