<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class MessageAttachmentResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // /** @var Illuminate\Filesystem\FilesystemAdapter */
        $disk= Storage::disk('attachments');

        return [
            'id' => $this->id,
            'message_id' => $this->message_id,
            'name' => $this->name, // Name of the file
            'mime' => $this->mime, // MIME type of the file
            'type' => $this->type, // Type of the file (e.g., image, video, document)
            'size' => $this->size, // Size of the file
            'url' => $disk->url($this->path), // URL to access the file
            'status' => $this->status, // Status of the attachment (e.g., uploaded, processing, failed)
            'is_voice_message' => $this->is_voice_message, // Indicates if this is a voice message
            'is_deleted' => $this->is_deleted, // Indicates if the attachment is deleted
            'uploaded_at' => $this->uploaded_at, // Timestamp of when the file was uploaded
            'uploader' => $this->whenLoaded('uploader', new UserResource($this->uploader)),
        ];
    }
}
