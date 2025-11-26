<?php

namespace App\Events;

use App\Models\Message;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SocketMessage implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(
        public Message $message, 
        public string $action = 'created',
        public ?Message $newLastMessage = null
    )
    {
        //
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        $message = $this->message;
        if ($message->group_id) {
            return [new PrivateChannel('message.group.' . $message->group_id)];
        } else {
            return [
                new PrivateChannel('message.user.' . collect([$message->sender_id, $message->receiver_id])->sort()->implode('-')),
            ];
        }
    }

    /**
     * Get the data to broadcast.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        $data = [
            'message' => $this->message->toResource(),
            'action' => $this->action,
        ];

        if ($this->newLastMessage) {
            $data['newLastMessage'] = $this->newLastMessage->toResource();
        }

        return $data;
    }
}
