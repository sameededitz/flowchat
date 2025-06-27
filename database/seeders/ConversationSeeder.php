<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Message;
use App\Models\Conversation;
use Illuminate\Database\Seeder;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;

class ConversationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = User::all();
        $conversationMap = [];

        foreach (range(1, 20) as $i) {
            $sender = $users->random();
            $receiver = $users->where('id', '!=', $sender->id)->random();
            $pairKey = collect([$sender->id, $receiver->id])->sort()->implode('_');

            if (!isset($conversationMap[$pairKey])) {
                $conversation = Conversation::create([
                    'user_id1' => min($sender->id, $receiver->id),
                    'user_id2' => max($sender->id, $receiver->id),
                ]);
                $conversationMap[$pairKey] = $conversation->id;
            }

            Message::factory()->create([
                'conversation_id' => $conversationMap[$pairKey],
                'sender_id' => $sender->id,
                'receiver_id' => $receiver->id,
            ]);
        }

        foreach ($conversationMap as $conversationId) {
            $lastMessage = Message::where('conversation_id', $conversationId)->latest('created_at')->first();
            Conversation::where('id', $conversationId)->update(['last_message_id' => $lastMessage?->id]);
        }
    }
}
