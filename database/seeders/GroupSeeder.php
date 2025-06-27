<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Group;
use App\Models\Message;
use Illuminate\Database\Seeder;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;

class GroupSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $admin = User::where('email', 'admin@gmail.com')->first();
        $allUsers = User::all();

        for ($i = 0; $i < 5; $i++) {
            $group = Group::factory()->create(['owner_id' => $admin->id]);
            $members = $allUsers->random(rand(3, 6));
            $group->members()->attach($members->pluck('id')->toArray());

            foreach (range(1, 10) as $j) {
                Message::factory()->create([
                    'group_id' => $group->id,
                    'sender_id' => $group->members->random()->id,
                ]);
            }

            $lastMessage = Message::where('group_id', $group->id)->latest('created_at')->first();
            $group->update(['last_message_id' => $lastMessage?->id]);
        }
    }
}
