<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserBlock extends Model
{
    protected $fillable = [
        'blocker_id',
        'blocked_id',
    ];

    /**
     * Get the user who is blocking
     */
    public function blocker(): BelongsTo
    {
        return $this->belongsTo(User::class, 'blocker_id');
    }

    /**
     * Get the user who is being blocked
     */
    public function blocked(): BelongsTo
    {
        return $this->belongsTo(User::class, 'blocked_id');
    }

    /**
     * Check if a block exists between two users (two-way check)
     */
    public static function isBlocked(int $userId1, int $userId2): bool
    {
        return self::where(function($query) use ($userId1, $userId2) {
            $query->where('blocker_id', $userId1)
                  ->where('blocked_id', $userId2);
        })
        ->orWhere(function($query) use ($userId1, $userId2) {
            $query->where('blocker_id', $userId2)
                  ->where('blocked_id', $userId1);
        })
        ->exists();
    }
}
