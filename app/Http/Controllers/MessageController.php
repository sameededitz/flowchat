<?php

namespace App\Http\Controllers;

use App\Events\SocketMessage;
use App\Models\User;
use Inertia\Inertia;
use App\Models\Group;
use App\Models\Message;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;
use App\Http\Requests\MessageRequest;
use App\Http\Resources\MessageResource;
use App\Models\Conversation;

class MessageController extends Controller
{
    public function byUser(User $user)
    {
        $messages = Message::where('sender_id', Auth::id())
            ->where('receiver_id', $user->id)
            ->orWhere(function ($query) use ($user) {
                $query->where('sender_id', $user->id)
                    ->where('receiver_id', Auth::id());
            })
            ->latest()
            ->paginate(10);

        return Inertia::render('Home', [
            'selectedConversation' => $user->toConversationArray(),
            'messages' => MessageResource::collection($messages->load(['sender', 'receiver', 'attachments']))->response()->getData(),
        ]);
    }

    public function byGroup(Group $group)
    {
        $messages = Message::where('group_id', $group->id)
            ->latest()
            ->paginate(50);

        return Inertia::render('Home', [
            'selectedConversation' => $group->toConversationArray(),
            'messages' => MessageResource::collection($messages->load(['sender', 'receiver', 'attachments'])),
        ]);
    }

    public function older(Message $message)
    {
        if ($message->group_id) {
            $messages = Message::where('group_id', $message->group_id)
                ->where('created_at', '<', $message->created_at)
                ->latest()
                ->paginate(10);
        } else {
            $messages = Message::where(function ($query) use ($message) {
                $query->where('sender_id', $message->sender_id)
                    ->where('receiver_id', $message->receiver_id);
            })->orWhere(function ($query) use ($message) {
                $query->where('sender_id', $message->receiver_id)
                    ->where('receiver_id', $message->sender_id);
            })->where('created_at', '<', $message->created_at)
                ->latest()
                ->paginate(10);
        }

        return MessageResource::collection($messages->load(['sender', 'receiver', 'attachments']));
    }

    public function store(MessageRequest $request)
    {
        $data = $request->validated();
        $data['sender_id'] = Auth::id();

        $receiverId = $data['receiver_id'] ?? null;
        $groupId = $data['group_id'] ?? null;
        $files = $data['files'] ?? [];

        $message = Message::create($data);

        $attachments = [];
        if (!empty($files)) {
            // Create a unique folder for this message
            $folder = Str::random(32); // e.g. abc123xyz...
            $directory = $folder;

            foreach ($files as $file) {
                // Unique filename with original extension
                $filename = Str::random(40) . '.' . $file->getClientOriginalExtension();

                // Store file in the attachments disk
                $storedPath = $file->storeAs($directory, $filename, 'attachments');

                $attachment = $message->attachments()->create([
                    'name' => $file->getClientOriginalName(), // original file name for display
                    'mime' => $file->getClientMimeType(),
                    'size' => $file->getSize(),
                    'path' => $storedPath, // relative to disk root
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
    }

    public function destroy(Message $message)
    {
        if ($message->sender_id !== Auth::id()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $message->delete();

        return response()->json(['success' => true]);
    }
}
