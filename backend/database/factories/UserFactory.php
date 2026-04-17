<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    protected $model = User::class;

    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'nicknamePassword' => null,
            'roleId' => 2,
            'dni' => strtoupper(fake()->unique()->bothify('########?')),
            'municipalityId' => 1,
            'isActive' => true,
        ];
    }

    public function admin(): static
    {
        return $this->state(fn () => ['roleId' => 1]);
    }

    public function citizen(): static
    {
        return $this->state(fn () => ['roleId' => 2]);
    }

    public function inactive(): static
    {
        return $this->state(fn () => ['isActive' => false]);
    }
}
