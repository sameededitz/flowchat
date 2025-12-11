<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class UserBlocked implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     *
     * @param int $blockerId - ID of the user who blocked
     * @param int $blockedId - ID of the user who was blocked
     * @param bool $isBlocked - true for block, false for unblock
     */
    public function __construct(
        public int $blockerId,
        public int $blockedId,
        public bool $isBlocked
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
        // Broadcast to both users involved
        return [
            new PrivateChannel('user.' . $this->blockerId),
            new PrivateChannel('user.' . $this->blockedId),
        ];
    }

    /**
     * Get the data to broadcast.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'blocker_id' => $this->blockerId,
            'blocked_id' => $this->blockedId,
            'is_blocked' => $this->isBlocked,
            'action' => $this->isBlocked ? 'blocked' : 'unblocked',
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'user.block.status';
    }
}
