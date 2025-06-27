<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MessageAttachment extends Model
{
    protected $fillable = [
        'message_id',
        'name', // Name of the file
        'path', // Path to the file
        'mime', // MIME type of the file
        'type', // Type of the file (e.g., image, video, document)
        'size', // Size of the file
        'status', // Status of the attachment (e.g., uploaded, processing, failed)
        'is_deleted', // Indicates if the attachment is deleted
        'uploaded_by', // User ID of the uploader
        'uploaded_at', // Timestamp of when the file was uploaded
        'processed_at', // Timestamp of when the file was processed
        'failed_at', // Timestamp of when the file processing failed
        'deleted_at', // Timestamp of when the file was deleted
    ];

    protected function casts(): array
    {
        return [
            'size' => 'integer',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function message()
    {
        return $this->belongsTo(Message::class);
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
