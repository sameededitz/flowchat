<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Message>
 */
class MessageFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'conversation_id' => null, // Will be manually assigned in seeder
            'sender_id' => null,       // Will be assigned
            'receiver_id' => null,     // Only for private chats
            'group_id' => null,        // Only for group chats
            'message' => $this->faker->realText(150),
            'type' => $this->faker->randomElement(['text', 'image', 'video']),
            'status' => $this->faker->randomElement(['sent', 'delivered', 'read']),
            'is_deleted' => $this->faker->boolean(10),
            'created_at' => $this->faker->dateTimeBetween('-1 year', 'now'),
        ];
    }
}
