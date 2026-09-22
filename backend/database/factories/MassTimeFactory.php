<?php

namespace Database\Factories;

use App\Models\MassTime;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\MassTime>
 */
class MassTimeFactory extends Factory
{
    protected $model = MassTime::class;

    public function definition(): array
    {
        $start = fake()->time('H:i:s');

        return [
            'day' => fake()->randomElement(['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']),
            'start_time' => $start,
            'end_time' => null,
            'location' => "St Mary's Cathedral",
            'language' => fake()->randomElement([null, 'English', 'Polish']),
            'notes' => fake()->boolean(30) ? fake()->sentence(8) : null,
            'status' => fake()->randomElement(['draft', 'published']),
        ];
    }
}

