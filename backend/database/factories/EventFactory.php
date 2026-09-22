<?php

namespace Database\Factories;

use App\Models\Event;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Event>
 */
class EventFactory extends Factory
{
    protected $model = Event::class;

    public function definition(): array
    {
        $start = fake()->dateTimeBetween('-2 months', '+3 months');
        $hasEnd = fake()->boolean(50);
        $startTime = fake()->boolean(70) ? fake()->time('H:i:s') : null;
        $endTime = $startTime && fake()->boolean(60) ? fake()->time('H:i:s') : null;

        return [
            'title' => fake()->sentence(4),
            'description' => fake()->boolean(70) ? fake()->paragraph(3) : null,
            'start_date' => $start->format('Y-m-d'),
            'start_time' => $startTime,
            'end_date' => $hasEnd ? fake()->dateTimeBetween($start, '+4 months')->format('Y-m-d') : null,
            'end_time' => $endTime,
            'location' => fake()->randomElement([
                "St Mary's Cathedral",
                'Parish Hall',
                'Meeting Room 1',
                'Community Centre',
            ]),
            'status' => fake()->randomElement(['published', 'published', 'published', 'draft']),
            'category' => fake()->randomElement([
                null,
                'liturgy',
                'community',
                'youth',
                'formation',
            ]),
            'image_path' => null,
            'group_id' => null,
            'created_by_user_id' => null,
        ];
    }
}

