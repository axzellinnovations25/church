<?php

namespace App\Services;

use App\Models\Event;
use App\Models\MassTime;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;

class ClashDetectionService
{
    private function atLocation(Builder $query, ?string $location): Builder
    {
        return $query->whereRaw("LOWER(TRIM(COALESCE(location, ''))) = ?", [mb_strtolower(trim($location ?? ''))]);
    }

    public function eventConflict(CarbonImmutable $start, CarbonImmutable $end, ?string $location, ?int $ignoreId): bool
    {
        $events = $this->atLocation(Event::query(), $location)
            ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
            ->whereDate('start_date', '<=', $end->toDateString())
            ->whereRaw('COALESCE(end_date, start_date) >= ?', [$start->toDateString()])->get();
        foreach ($events as $event) {
            [$otherStart, $otherEnd] = $this->eventInterval($event);
            if ($start < $otherEnd && $end > $otherStart) {
                return true;
            }
        }
        foreach ($this->atLocation(MassTime::query(), $location)->get() as $mass) {
            if ($this->weeklyOverlaps($start, $end, $mass->day, $mass->getRawOriginal('start_time'), $mass->getRawOriginal('end_time'))) {
                return true;
            }
        }
        return false;
    }

    public function massConflict(string $day, string $time, ?string $location, ?int $ignoreId): bool
    {
        // A fixed week allows comparisons across midnight and the Sunday boundary.
        $start = CarbonImmutable::parse('2026-01-04')->next($day)->setTimeFromTimeString($time);
        $end = $start->addHour();
        foreach ($this->atLocation(MassTime::query(), $location)
            ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))->get() as $mass) {
            if ($this->weeklyOverlaps($start, $end, $mass->day, $mass->getRawOriginal('start_time'), $mass->getRawOriginal('end_time'))) {
                return true;
            }
        }
        foreach ($this->atLocation(Event::query(), $location)
            ->whereRaw('COALESCE(end_date, start_date) >= ?', [now()->toDateString()])->get() as $event) {
            [$eventStart, $eventEnd] = $this->eventInterval($event);
            if ($this->weeklyOverlaps($eventStart, $eventEnd, $day, $time, null)) {
                return true;
            }
        }
        return false;
    }

    private function eventInterval(Event $event): array
    {
        return [
            CarbonImmutable::parse($event->start_date.' '.($event->start_time ?: '00:00')),
            CarbonImmutable::parse(($event->end_date ?: $event->start_date).' '.($event->end_time ?: '23:59')),
        ];
    }

    private function weeklyOverlaps(CarbonImmutable $start, CarbonImmutable $end, string $day, string $time, ?string $endTime): bool
    {
        if (!in_array($day, ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], true)) {
            return false;
        }
        $date = $start->subDay()->startOfDay();
        while ($date->format('l') !== $day) {
            $date = $date->addDay();
        }
        // At most one occurrence can finish before the interval starts.
        for ($i = 0; $i < 2; $i++, $date = $date->addWeek()) {
            $serviceStart = $date->setTimeFromTimeString($time);
            $serviceEnd = $endTime ? $date->setTimeFromTimeString($endTime) : $serviceStart->addHour();
            if ($serviceEnd <= $serviceStart) {
                $serviceEnd = $serviceEnd->addDay();
            }
            if ($serviceStart < $end && $serviceEnd > $start) {
                return true;
            }
        }
        return false;
    }
}
