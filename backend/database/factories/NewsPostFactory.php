<?php

namespace Database\Factories;

use App\Models\NewsPost;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\NewsPost>
 */
class NewsPostFactory extends Factory
{
    protected $model = NewsPost::class;

    public function definition(): array
    {
        $publishedAt = fake()->boolean(75) ? fake()->dateTimeBetween('-3 months', 'now')->format('Y-m-d') : null;
        $status = $publishedAt ? fake()->randomElement(['published', 'published', 'draft']) : 'draft';

        return [
            'title' => fake()->sentence(6),
            'type' => fake()->randomElement(['news', 'announcement']),
            'summary' => fake()->boolean(70) ? fake()->sentence(18) : null,
            'content' => fake()->boolean(70) ? fake()->paragraphs(6, true) : null,
            'published_at' => $publishedAt,
            'status' => $status,
            'image_path' => null,
            'created_by_user_id' => null,
        ];
    }
}

