<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'email_verified_at',
        'avatar',
        'is_admin',
        'is_active',
        'locale',
        'blocked_at',
        'banned_at',
        'ban_reason',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'blocked_at' => 'datetime',
            'banned_at' => 'datetime',
        ];
    }

    public function groups()
    {
        return $this->belongsToMany(Group::class, 'group_users');
    }

    public function ownedGroups()
    {
        return $this->hasMany(Group::class, 'owner_id');
    }

    /**
     * Users that this user has blocked
     */
    public function blockedUsers()
    {
        return $this->belongsToMany(User::class, 'user_blocks', 'blocker_id', 'blocked_id')
            ->withTimestamps();
    }

    /**
     * Users that have blocked this user
     */
    public function blockedByUsers()
    {
        return $this->belongsToMany(User::class, 'user_blocks', 'blocked_id', 'blocker_id')
            ->withTimestamps();
    }

    /**
     * Check if this user has blocked another user
     */
    public function hasBlocked(User $user): bool
    {
        return $this->blockedUsers()->where('blocked_id', $user->id)->exists();
    }

    /**
     * Check if this user is blocked by another user
     */
    public function isBlockedBy(User $user): bool
    {
        return $this->blockedByUsers()->where('blocker_id', $user->id)->exists();
    }

    /**
     * Check if blocking exists in either direction (two-way check)
     */
    public function isBlockingOrBlockedBy(User $user): bool
    {
        return UserBlock::isBlocked($this->id, $user->id);
    }

    public static function getUsers(User $user)
    {
        $userId = $user->id;
        $query = User::select([
            'users.*',
            'messages.message as last_message',
            'messages.created_at as last_message_date',
        ])
            ->selectRaw('EXISTS(SELECT 1 FROM user_blocks WHERE blocker_id = ? AND blocked_id = users.id) as i_blocked', [$userId])
            ->selectRaw('EXISTS(SELECT 1 FROM user_blocks WHERE blocker_id = users.id AND blocked_id = ?) as blocked_me', [$userId])
            ->where('users.id', '!=', $userId)
            ->when(!$user->is_admin, function ($query) {
                $query->whereNull('banned_at')
                    ->whereNull('blocked_at');
            })
            ->leftJoin('conversations', function ($join) use ($userId) {
                $join->on('conversations.user_id1', '=', 'users.id')
                    ->where('conversations.user_id2', '=', $userId)
                    ->orWhere(function ($query) use ($userId) {
                        $query->on('conversations.user_id2', '=', 'users.id')
                            ->where('conversations.user_id1', '=', $userId);
                    });
            })
            ->leftJoin('messages', 'messages.id', '=', 'conversations.last_message_id')
            ->orderByRaw('IFNULL(users.blocked_at, 1)')
            ->orderByRaw('IFNULL(users.banned_at, 1)')
            ->orderByDesc('messages.created_at')
            ->orderBy('users.name');

        // dd($query->toSql(), $query->getBindings());
        return $query->get();
    }

    public function toConversationArray()
    {
        $disk = Storage::disk('profile');

        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'avatar_url' => $this->avatar ? $disk->url($this->avatar) : null,
            'is_group' => false,
            'is_user' => true,
            'is_admin' => (bool) $this->is_admin,
            'is_active' => (bool) $this->is_active,
            'last_message' => $this->last_message,
            'last_message_date' => $this->last_message_date,
            'blocked_at' => $this->blocked_at,
            'banned_at' => $this->banned_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'i_blocked' => $this->i_blocked ?? false,
            'blocked_me' => $this->blocked_me ?? false,
        ];
    }
}
