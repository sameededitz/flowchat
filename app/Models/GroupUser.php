<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GroupUser extends Model
{
    protected $fillable = [
        'group_id',
        'user_id',
        'role', // 'admin', 'moderator', 'member'
        'is_active',
        'joined_at',
        'left_at',
        'left_reason',
        'invited_by', // User ID of the inviter
        'invitation_token', // Token for accepting the invitation
        'is_invited', // Indicates if the user was invited
    ];

    protected function casts(): array
    {
        return [
            'joined_at' => 'datetime',
            'left_at' => 'datetime',
            'is_active' => 'boolean',
            'is_invited' => 'boolean',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function group()
    {
        return $this->belongsTo(Group::class);
    }

    public function invitedBy()
    {
        return $this->belongsTo(User::class, 'invited_by');
    }
}
