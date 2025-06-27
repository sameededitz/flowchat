<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Message extends Model
{
    use HasFactory;

    protected $fillable = [
        'conversation_id',
        'sender_id',
        'receiver_id',
        'group_id',
        'message', // The actual message content
        'type', // 'text', 'image', 'video', etc.
        'status', // 'sent', 'delivered', 'read'
        'is_deleted', // Indicates if the message is deleted
        'is_pinned', // Indicates if the message is pinned
    ];

    public function conversation()
    {
        return $this->belongsTo(Conversation::class);
    }
    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }
    public function receiver()
    {
        return $this->belongsTo(User::class, 'receiver_id');
    }
    public function group()
    {
        return $this->belongsTo(Group::class);
    }
    public function attachments()
    {
        return $this->hasMany(MessageAttachment::class);
    }
}
