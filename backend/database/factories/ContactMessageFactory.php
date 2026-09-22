<?php

namespace Database\Factories;

use App\Models\ContactMessage;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ContactMessage>
 */
class ContactMessageFactory extends Factory
{
    protected $model = ContactMessage::class;

    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->safeEmail(),
            'phone' => fake()->boolean(55) ? fake()->phoneNumber() : null,
            'subject' => fake()->sentence(6),
            'category' => fake()->randomElement(['general', 'groups', 'sacraments', 'volunteering']),
            'status' => fake()->randomElement(['new', 'new', 'read', 'replied']),
            'group_id' => null,
            'message' => fake()->paragraph(4),
        ];
    }
}

