<?php

namespace App\Models;

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
        if ($this->file_path && is_file(storage_path("app/private/{$this->file_path}"))) {
            return true;
        }

        if (array_key_exists('has_file_contents', $this->getAttributes())) {
            return (bool) $this->getAttribute('has_file_contents');
        }

        return $this->file_contents !== null;
    }

    public function pdfContents(): ?string
    {
        if ($this->file_path) {
            $path = storage_path("app/private/{$this->file_path}");

            if (is_file($path)) {
                $contents = file_get_contents($path);

                return $contents === false ? null : $contents;
            }
        }

        $contents = $this->file_contents;

        if (is_resource($contents)) {
            rewind($contents);
            $contents = stream_get_contents($contents);
        }

        if (! is_string($contents)) {
            return null;
        }

        $decoded = base64_decode($contents, true);

        return $decoded === false ? null : $decoded;
    }
}
