<?php

namespace App\Http\Controllers;

use App\Models\User;
use Inertia\Inertia;
use App\Models\Group;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use App\Models\Conversation;
use App\Events\SocketMessage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use App\Http\Requests\MessageRequest;
use App\Http\Resources\MessageResource;

class MessageController extends Controller
{
    public function byUser(User $user)
    {
        // Prevent users from accessing their own chat
        if ($user->id === Auth::id()) {
            abort(403, 'You cannot chat with yourself');
        }

        // Check if a conversation exists between these users
        $conversationExists = Conversation::where(function ($query) use ($user) {
            $query->where('user_id1', Auth::id())
                  ->where('user_id2', $user->id);
        })->orWhere(function ($query) use ($user) {
            $query->where('user_id1', $user->id)
                  ->where('user_id2', Auth::id());
        })->exists();

        // Or check if there are any messages between them
        $hasMessages = Message::where(function ($query) use ($user) {
            $query->where('sender_id', Auth::id())
                  ->where('receiver_id', $user->id);
        })->orWhere(function ($query) use ($user) {
            $query->where('sender_id', $user->id)
                  ->where('receiver_id', Auth::id());
        })->exists();

        // If neither conversation nor messages exist, deny access
        if (!$conversationExists && !$hasMessages) {
            abort(403, 'No conversation exists with this user');
        }

        $messages = Message::where('sender_id', Auth::id())
            ->where('receiver_id', $user->id)
            ->orWhere(function ($query) use ($user) {
                $query->where('sender_id', $user->id)
                    ->where('receiver_id', Auth::id());
            })
            ->with(['sender', 'receiver', 'attachments'])
            ->latest()
            ->paginate(10);


        return Inertia::render('Home', [
            'selectedConversation' => $user->toConversationArray(),
            'messages' => MessageResource::collection($messages)->response()->getData(),
        ]);
    }

    public function byGroup(Group $group)
    {
        // Check if user is a member of the group or the owner
        $isMember = $group->members()->where('user_id', Auth::id())->exists();
        $isOwner = $group->owner_id === Auth::id();

        if (!$isMember && !$isOwner) {
            abort(403, 'You are not a member of this group');
        }

        $messages = Message::where('group_id', $group->id)
            ->with(['sender', 'receiver', 'attachments'])
            ->latest()
            ->paginate(50);

        return Inertia::render('Home', [
            'selectedConversation' => $group->toConversationArray(),
            'messages' => MessageResource::collection($messages)->response()->getData(),
        ]);
    }

    public function older(Message $message)
    {
        if ($message->group_id) {
            $messages = Message::where('group_id', $message->group_id)
                ->where('created_at', '<', $message->created_at)
                ->with(['sender', 'receiver', 'attachments'])
                ->orderBy('created_at', 'desc')
                ->paginate(10);
        } else {
            $messages = Message::where('created_at', '<', $message->created_at)
                ->where(function ($query) use ($message) {
                    $query->where(function ($q) use ($message) {
                        $q->where('sender_id', $message->sender_id)
                            ->where('receiver_id', $message->receiver_id);
                    })->orWhere(function ($q) use ($message) {
                        $q->where('sender_id', $message->receiver_id)
                            ->where('receiver_id', $message->sender_id);
                    });
                })
                ->with(['sender', 'receiver', 'attachments'])
                ->orderBy('created_at', 'desc')
                ->paginate(10);
        }

        return MessageResource::collection($messages)->response()->getData();
    }

    public function store(MessageRequest $request)
    {
        $data = $request->validated();
        $data['sender_id'] = Auth::id();

        $receiverId = $data['receiver_id'] ?? null;
        $groupId = $data['group_id'] ?? null;
        $files = $data['attachments'] ?? [];
        $voiceMessages = $request->input('voice_messages', []);

        // Check if group is being deleted
        if ($groupId) {
            $group = Group::find($groupId);
            if ($group && $group->is_deleting) {
                return response()->json(['message' => 'This group is being deleted. You cannot send messages.'], 403);
            }
        }

        try {
            $message = Message::create($data);

            $attachments = [];
            if (!empty($files)) {
                // Create a unique folder for this message
                $folder = Str::random(32); // e.g. abc123xyz...
                $directory = $folder;

                foreach ($files as $index => $file) {
                    // Unique filename with original extension
                    $filename = Str::random(40) . '.' . $file->getClientOriginalExtension();

                    // Store file in the attachments disk
                    $storedPath = $file->storeAs($directory, $filename, 'attachments');

                    // Check if this is a voice message
                    $isVoiceMessage = isset($voiceMessages[$index]) && $voiceMessages[$index] === 'true';

                    // Determine file type based on mime type
                    $mimeType = $file->getClientMimeType();
                    $fileType = 'document'; // default

                    if (strpos($mimeType, 'image/') === 0) {
                        $fileType = 'image';
                    } elseif (strpos($mimeType, 'video/') === 0) {
                        $fileType = 'video';
                    } elseif (strpos($mimeType, 'audio/') === 0) {
                        $fileType = 'audio';
                    }

                    $attachment = $message->attachments()->create([
                        'name' => $file->getClientOriginalName(), // original file name for display
                        'mime' => $mimeType,
                        'type' => $fileType, // Add the required type field
                        'size' => $file->getSize(),
                        'path' => $storedPath, // relative to disk root
                        'uploaded_by' => Auth::id(), // Add uploader info
                        'uploaded_at' => now(), // Add upload timestamp
                        'is_voice_message' => $isVoiceMessage, // Add voice message flag
                    ]);

                    $attachments[] = $attachment;
                }

                $message->attachments = $attachments;
            }

            if ($receiverId) {
                Conversation::updateConversation(
                    $receiverId,
                    Auth::id(),
                    $message
                );
            }

            if ($groupId) {
                Group::updateConversation(
                    $groupId,
                    $message
                );
            }

            $message->load(['sender', 'receiver', 'attachments']);
            SocketMessage::dispatch($message);

            return new MessageResource($message);

        } catch (\Exception $e) {
            Log::error('Error storing message: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to send message'], 500);
        }
    }

    public function update(Request $request, Message $message)
    {
        // Check authorization
        if ($message->sender_id !== Auth::id()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Check if message is older than 15 minutes
        $fifteenMinutesAgo = now()->subMinutes(15);
        if ($message->created_at < $fifteenMinutesAgo) {
            return response()->json(['error' => 'Cannot edit messages older than 15 minutes'], 422);
        }

        // Validate the update request
        $validated = $request->validate([
            'message' => 'required|string|max:5000',
        ]);

        // Update the message
        $message->update([
            'message' => $validated['message'],
        ]);

        // Reload relationships
        $message->load(['sender', 'receiver', 'attachments']);

        // Broadcast the updated message
        broadcast(new SocketMessage($message, 'updated'))->toOthers();

        return response()->json([
            'success' => true,
            'message' => $message
        ]);
    }

    public function destroy(Message $message)
    {
        if ($message->sender_id !== Auth::id()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Store info before deletion
        $messageId = $message->id;
        $groupId = $message->group_id;
        $senderId = $message->sender_id;
        $receiverId = $message->receiver_id;

        // Delete the message (observer will update last_message_id)
        $message->delete();

        // Get the updated last message after deletion
        $newLastMessage = null;
        if ($groupId) {
            $group = Group::find($groupId);
            if ($group && $group->last_message_id) {
                $newLastMessage = Message::with(['sender', 'receiver'])->find($group->last_message_id);
            }
        } else {
            $conversation = Conversation::where(function ($query) use ($senderId, $receiverId) {
                $query->where('user_id1', $senderId)->where('user_id2', $receiverId);
            })->orWhere(function ($query) use ($senderId, $receiverId) {
                $query->where('user_id1', $receiverId)->where('user_id2', $senderId);
            })->first();
            
            if ($conversation && $conversation->last_message_id) {
                $newLastMessage = Message::with(['sender', 'receiver'])->find($conversation->last_message_id);
            }
        }

        // Create a minimal message object for broadcasting
        $deletedMessage = new Message();
        $deletedMessage->id = $messageId;
        $deletedMessage->group_id = $groupId;
        $deletedMessage->sender_id = $senderId;
        $deletedMessage->receiver_id = $receiverId;
        $deletedMessage->exists = true;

        // Broadcast the deletion with new last message info
        broadcast(new SocketMessage($deletedMessage, 'deleted', $newLastMessage))->toOthers();

        return response()->json(['success' => true]);
    }
}
