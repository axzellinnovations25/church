<?php

namespace Database\Factories;

use App\Models\Newsletter;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Newsletter>
 */
class NewsletterFactory extends Factory
{
    protected $model = Newsletter::class;

    public function definition(): array
    {
        $title = 'Newsletter ' . fake()->dateTimeBetween('-6 months', 'now')->format('M Y');
        $filename = Str::slug($title) . '-' . fake()->numberBetween(10, 99) . '.pdf';

        return [
            'title' => $title,
            'publication_date' => fake()->dateTimeBetween('-6 months', '+1 month')->format('Y-m-d'),
            'description' => fake()->boolean(55) ? fake()->sentence(12) : null,
            'file_path' => 'newsletters/' . $filename,
            'original_filename' => $filename,
            'file_size' => fake()->numberBetween(20_000, 700_000),
            'status' => fake()->randomElement(['published', 'published', 'draft']),
        ];
    }
}

