<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\UserBlock;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\UserBlock>
 */
class UserBlockFactory extends Factory
{
    protected $model = UserBlock::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'blocker_id' => User::factory(),
            'blocked_id' => User::factory(),
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }
}
