<?php

namespace App\Models;

use App\Support\SupabaseStorage;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class Newsletter extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'publication_date',
        'description',
        'file_path',
        'file_contents',
        'original_filename',
        'file_size',
        'status',
    ];

    protected $hidden = [
        'file_contents',
    ];

    public static function publishDueDrafts(): int
    {
        return static::query()
            ->where('status', 'draft')
            ->whereDate('publication_date', '<=', now()->toDateString())
            ->update(['status' => 'published']);
    }

    public function scopePubliclyPublished(Builder $query): Builder
    {
        return $query
            ->where('status', 'published')
            ->whereDate('publication_date', '<=', now()->toDateString());
    }

    public function getIsFutureAttribute(): bool
    {
        return $this->publication_date && $this->publication_date > now()->toDateString();
    }

    public function getIsDueForPublicationAttribute(): bool
    {
        return $this->status === 'draft'
            && $this->publication_date
            && $this->publication_date <= now()->toDateString();
    }

    public function getPublishesWithinOneWeekAttribute(): bool
    {
        if ($this->status !== 'draft' || ! $this->publication_date) {
            return false;
        }

        $today = CarbonImmutable::now()->startOfDay();
        $publicationDate = CarbonImmutable::parse($this->publication_date)->startOfDay();

        return $publicationDate->greaterThan($today)
            && $publicationDate->lessThanOrEqualTo($today->addWeek());
    }

    public function pdfExists(): bool
    {
        return SupabaseStorage::exists($this->file_path);
    }
}
