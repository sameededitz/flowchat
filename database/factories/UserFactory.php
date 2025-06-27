<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password = 'Test@123';

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'avatar' => fake()->imageUrl(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
            'is_admin' => false,
            'is_active' => true,
            'blocked_at' => null,
            'banned_at' => null,
            'ban_reason' => null,
            'last_login_at' => fake()->dateTimeBetween('-1 year', 'now'),
            'last_login_ip' => fake()->ipv4(),
        ];
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

     public function admin()
    {
        return $this->state(fn (array $attributes) => [
            'name' => 'Admin',
            'avatar' => 'https://i.pravatar.cc/300?img=1',
            'email' => 'admin@gmail.com',
            'email_verified_at' => now(),
            'password' => Hash::make('admin123'),
            'remember_token' => Str::random(10),
            'is_admin' => true,
            'is_active' => true,
        ]);
    }

    public function user()
    {
        return $this->state(fn (array $attributes) => [
            'name' => 'User',
            'avatar' => 'https://i.pravatar.cc/300?img=2',
            'email' => 'user@gmail.com',
            'email_verified_at' => now(),
            'password' => Hash::make('user123'),
            'remember_token' => Str::random(10),
            'is_admin' => false,
            'is_active' => true,
        ]);
    }
}
