<?php

namespace Database\Factories;

use App\Models\ParishInterest;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ParishInterest>
 */
class ParishInterestFactory extends Factory
{
    protected $model = ParishInterest::class;

    public function definition(): array
    {
        return [
            'registration_id' => null,
            'volunteering' => fake()->boolean(55),
            'parish_groups' => fake()->boolean(55),
            'sacramental_preparation' => fake()->boolean(35),
            'weekly_newsletter' => fake()->boolean(65),
        ];
    }
}

