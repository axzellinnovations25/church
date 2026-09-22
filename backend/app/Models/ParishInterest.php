<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ParishInterest extends Model
{
    use HasFactory;

    protected $table = 'parish_interests';

    protected $fillable = [
        'registration_id',
        'volunteering',
        'parish_groups',
        'sacramental_preparation',
        'weekly_newsletter'
    ];
}
