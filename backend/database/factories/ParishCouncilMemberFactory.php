<?php

namespace Database\Factories;

use App\Models\ParishCouncilMember;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ParishCouncilMember>
 */
class ParishCouncilMemberFactory extends Factory
{
    protected $model = ParishCouncilMember::class;

    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'role' => fake()->randomElement([
                'Chair',
                'Secretary',
                'Treasurer',
                'Safeguarding Lead',
                'Member',
            ]),
            'bio' => fake()->boolean(75) ? fake()->paragraph(3) : null,
            'photo_path' => null,
            'photo_filename' => null,
            'photo_size' => 0,
            'sort_order' => fake()->numberBetween(0, 50),
            'is_active' => true,
        ];
    }
}

