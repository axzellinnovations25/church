<?php

namespace Database\Factories;

use App\Models\GroupMember;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\GroupMember>
 */
class GroupMemberFactory extends Factory
{
    protected $model = GroupMember::class;

    public function definition(): array
    {
        return [
            'group_id' => null,
            'created_by_user_id' => null,
            'name' => fake()->name(),
            'email' => fake()->boolean(85) ? fake()->safeEmail() : null,
            'phone' => fake()->boolean(65) ? fake()->phoneNumber() : null,
            'role' => fake()->randomElement([
                null,
                'Coordinator',
                'Member',
                'Volunteer',
                'Secretary',
            ]),
            'notes' => fake()->boolean(35) ? fake()->sentence(10) : null,
        ];
    }
}

