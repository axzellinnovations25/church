<?php

namespace Database\Factories;

use App\Models\ParishChild;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ParishChild>
 */
class ParishChildFactory extends Factory
{
    protected $model = ParishChild::class;

    public function definition(): array
    {
        $age = fake()->numberBetween(1, 17);
        $dob = now()->subYears($age)->subDays(fake()->numberBetween(0, 364))->toDateString();

        return [
            'registration_id' => null,
            'child_name' => fake()->firstName() . ' ' . fake()->lastName(),
            'date_of_birth' => $dob,
            'age' => $age,
        ];
    }
}

