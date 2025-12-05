<?php

namespace App\Jobs;

use App\Models\Group;
use App\Models\Message;
use App\Models\MessageAttachment;
use Illuminate\Support\Facades\Storage;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;

class DeleteGroupJob implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new job instance.
     */
    public function __construct(public Group $group)
    {
        //
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        // 1. Delete group avatar if exists
        if ($this->group->avatar) {
            Storage::disk('profile')->delete($this->group->avatar);
        }

        // 2. Delete all messages from this group
        $messages = Message::where('group_id', $this->group->id)->get();
        
        foreach ($messages as $message) {
            // Delete attachments manually since we're skipping the observer
            if ($message->attachments()->count() > 0) {
                $firstAttachment = $message->attachments()->first();
                
                if ($firstAttachment && $firstAttachment->path) {
                    $folder = dirname($firstAttachment->path);
                    
                    if ($folder && $folder !== '.' && Storage::disk('attachments')->exists($folder)) {
                        Storage::disk('attachments')->deleteDirectory($folder);
                    }
                }
            }
            
            // Delete message without triggering events (no need to update last_message_id for deleted group)
            $message->deleteQuietly();
        }

        // 3. Detach all members from the group
        $this->group->members()->detach();

        // 4. Broadcast that group has been deleted
        broadcast(new \App\Events\SocketGroup($this->group->id, 'deleted'));

        // 5. Finally, delete the group itself
        $this->group->delete();
    }
}
