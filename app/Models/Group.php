<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Facades\DB;

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
        'is_deleting',
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
        // First, let's get groups where user is a member directly
        $groupIds = DB::table('group_users')
            ->where('user_id', $user->id)
            ->pluck('group_id')
            ->toArray();
            
        // Also add groups where user is owner
        $ownedGroups = self::where('owner_id', $user->id)
            ->pluck('id')
            ->toArray();
            
        $allGroupIds = array_unique(array_merge($groupIds, $ownedGroups));
        
        if (empty($allGroupIds)) {
            return collect();
        }
        
        return self::select([
            'groups.*',
            'messages.message as last_message',
            'messages.created_at as last_message_date',
        ])
            ->with(['owner', 'members'])
            ->leftJoin('messages', 'messages.id', '=', 'groups.last_message_id')
            ->whereIn('groups.id', $allGroupIds)
            ->orderByDesc('messages.created_at')
            ->orderByDesc('groups.updated_at')
            ->orderByDesc('groups.created_at')
            ->orderBy('groups.name')
            ->get();
    }

    public function toConversationArray()
    {
        $disk = Storage::disk('profile');

        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'slug' => $this->slug,
            'avatar' => $this->avatar ? $disk->url($this->avatar) : null,
            'owner_id' => $this->owner_id,
            'owner' => $this->owner,
            'is_group' => true,
            'is_user' => false,
            'users' => $this->members,
            'user_ids' => optional($this->members)->pluck('id') ?? collect(),
            'last_message' => $this->last_message,
            'last_message_date' => $this->last_message_date,
            'is_deleting' => (bool) $this->is_deleting,
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
