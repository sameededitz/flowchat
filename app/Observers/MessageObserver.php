<?php

namespace App\Observers;

use App\Models\Group;
use App\Models\Message;
use App\Models\Conversation;
use Illuminate\Support\Facades\Storage;

class MessageObserver
{
    /**
     * Handle the Message "created" event.
     */
    public function created(Message $message): void
    {
        //
    }

    /**
     * Handle the Message "updated" event.
     */
    public function updated(Message $message): void
    {
        //
    }

    /**
     * Handle the Message "deleting" event.
     */
    public function deleting(Message $message): void
    {
        // Delete the entire folder containing all attachments
        if ($message->attachments()->count() > 0) {
            $firstAttachment = $message->attachments()->first();
            
            if ($firstAttachment && $firstAttachment->path) {
                $folder = dirname($firstAttachment->path);
                
                if ($folder && $folder !== '.' && Storage::disk('attachments')->exists($folder)) {
                    Storage::disk('attachments')->deleteDirectory($folder);
                }
            }
        }
    }

    /**
     * Handle the Message "deleted" event.
     */
    public function deleted(Message $message): void
    {
        // Update last_message_id after deletion
        if ($message->group_id) {
            $group = Group::find($message->group_id);
            if ($group && $group->last_message_id === null) {
                $lastMessage = Message::where('group_id', $message->group_id)->latest()->first();
                $group->update(['last_message_id' => $lastMessage?->id]);
            }
        } else {
            $conversation = Conversation::where(function ($query) use ($message) {
                $query->where('user_id1', $message->sender_id)->where('user_id2', $message->receiver_id);
            })->orWhere(function ($query) use ($message) {
                $query->where('user_id1', $message->receiver_id)->where('user_id2', $message->sender_id);
            })->first();
            
            if ($conversation && $conversation->last_message_id === null) {
                $lastMessage = Message::where(function ($query) use ($message) {
                    $query->where('sender_id', $message->sender_id)->where('receiver_id', $message->receiver_id);
                })->orWhere(function ($query) use ($message) {
                    $query->where('sender_id', $message->receiver_id)->where('receiver_id', $message->sender_id);
                })->latest()->first();
                
                $conversation->update(['last_message_id' => $lastMessage?->id]);
            }
        }
    }
}
