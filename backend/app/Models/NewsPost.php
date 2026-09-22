<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NewsPost extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'type',
        'summary',
        'content',
        'published_at',
        'status',
        'image_path',
        'created_by_user_id',
    ];

    protected $casts = [
        'published_at' => 'date',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }
}
