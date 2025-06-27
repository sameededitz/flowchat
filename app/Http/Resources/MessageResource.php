<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MessageResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'sender_id' => $this->sender_id,
            'receiver_id' => $this->receiver_id,
            'group_id' => $this->group_id,
            'message' => $this->message,
            'type' => $this->type, // e.g., 'text', 'image', 'video'
            'status' => $this->status, // e.g., 'sent
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'sender' => $this->whenLoaded('sender', new UserResource($this->sender)),
            'receiver' => $this->whenLoaded('receiver', new UserResource($this->receiver)),
            'attachments' => MessageAttachmentResource::collection($this->whenLoaded('attachments')),
        ];
    }
}
