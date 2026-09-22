<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ContactMessageResource;
use App\Http\Resources\EventResource;
use App\Http\Resources\GroupMemberResource;
use App\Http\Resources\MassTimeResource;
use App\Http\Resources\ParishRegistrationResource;
use App\Models\AuditLog;
use App\Models\ContactMessage;
use App\Models\Event;
use App\Models\GroupMember;
use App\Models\MassTime;
use App\Models\NewsPost;
use App\Models\Newsletter;
use App\Models\ParishChild;
use App\Models\ParishRegistration;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class OverviewController extends Controller
{
    public function headerSummary(Request $request): JsonResponse
    {
        Newsletter::publishDueDrafts();

        $summaryCounts = $this->buildSummaryCounts($request);
        $alertCounts = $this->alertCountsFromSummary($summaryCounts);

        return response()->json([
            'notifications' => $this->buildNotifications($request, $alertCounts),
            'recent_audit_logs' => $this->recentAuditLogs($request),
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        Newsletter::publishDueDrafts();

        $user = $request->user();
        $overviewPreferences = $this->normalizeOverviewPreferences($user?->hidden_overview_items);
        $baselineAt = $overviewPreferences['baseline_at']
            ? CarbonImmutable::parse($overviewPreferences['baseline_at'])
            : CarbonImmutable::now();

        if (! $overviewPreferences['baseline_at']) {
            $overviewPreferences['baseline_at'] = $baselineAt->toIso8601String();
            $this->saveOverviewPreferences($user, $overviewPreferences);
        }

        $hasGroupScope = $user->is_main_admin || (bool) $user->group_id;

        $events = $hasGroupScope ? Event::query()
            ->with(['group', 'creator'])
            ->when(! $user->is_main_admin, fn ($query) => $query->where('group_id', $user->group_id))
            ->orderBy('start_date', 'desc')
            ->orderBy('start_time', 'desc')
            ->limit(4)
            ->get() : collect();

        $massTimes = $user->is_main_admin ? MassTime::query()
            ->orderByRaw($this->dayOrderSql())
            ->orderBy('start_time')
            ->limit(4)
            ->get() : collect();

        $registrations = $user->is_main_admin ? ParishRegistration::query()
            ->latest()
            ->limit(4)
            ->get() : collect();

        $contactMessages = $hasGroupScope ? ContactMessage::query()
            ->with('group')
            ->when(! $user->is_main_admin, fn ($query) => $query->where('group_id', $user->group_id))
            ->latest()
            ->limit(4)
            ->get() : collect();

        $groupMembers = $hasGroupScope ? GroupMember::query()
            ->with('group')
            ->when(! $user->is_main_admin, fn ($query) => $query->where('group_id', $user->group_id))
            ->latest()
            ->limit(4)
            ->get() : collect();
        $summaryCounts = $this->buildSummaryCounts($request);
        $alertCounts = $this->alertCountsFromSummary($summaryCounts);
        $auditLogs = $this->recentAuditLogs($request);

        return response()->json([
            'scope' => [
                'is_main_admin' => (bool) $user->is_main_admin,
                'group' => $user->group ? [
                    'id' => $user->group->id,
                    'name' => $user->group->name,
                ] : null,
            ],
            'stats' => [
                'events' => [
                    'total' => $summaryCounts['events_total'],
                    'published' => $summaryCounts['events_published'],
                ],
                'mass_times' => [
                    'total' => $summaryCounts['mass_times_total'],
                    'published' => $summaryCounts['mass_times_published'],
                ],
                'registrations' => [
                    'total' => $summaryCounts['registrations_total'],
                ],
                'contact_messages' => [
                    'total' => $summaryCounts['contact_messages_total'],
                    'new' => $alertCounts['new_contact_messages'],
                ],
                'group_members' => [
                    'total' => $summaryCounts['group_members_total'],
                ],
            ],
            'notifications' => $this->buildNotifications($request, $alertCounts),
            'recent_audit_logs' => $auditLogs,
            'recent' => [
                'events' => $this->withOverviewKeys(
                    EventResource::collection($events)->resolve($request),
                    'event',
                    $overviewPreferences,
                    $baselineAt
                ),
                'mass_times' => $this->withOverviewKeys(
                    MassTimeResource::collection($massTimes)->resolve($request),
                    'mass_time',
                    $overviewPreferences,
                    $baselineAt
                ),
                'registrations' => $this->withOverviewKeys(
                    ParishRegistrationResource::collection($registrations)->resolve($request),
                    'registration',
                    $overviewPreferences,
                    $baselineAt
                ),
                'contact_messages' => $this->withOverviewKeys(
                    ContactMessageResource::collection($contactMessages)->resolve($request),
                    'contact_message',
                    $overviewPreferences,
                    $baselineAt
                ),
                'group_members' => $this->withOverviewKeys(
                    GroupMemberResource::collection($groupMembers)->resolve($request),
                    'group_member',
                    $overviewPreferences,
                    $baselineAt
                ),
            ],
        ]);
    }

    private function buildSummaryCounts(Request $request): array
    {
        $user = $request->user();
        $hasGroupScope = $user->is_main_admin || (bool) $user->group_id;
        $today = CarbonImmutable::now()->startOfDay();

        $events = Event::query()
            ->when(! $hasGroupScope, fn ($query) => $query->whereRaw('1 = 0'))
            ->when($hasGroupScope && ! $user->is_main_admin, fn ($query) => $query->where('group_id', $user->group_id));
        $contactMessages = ContactMessage::query()
            ->when(! $hasGroupScope, fn ($query) => $query->whereRaw('1 = 0'))
            ->when($hasGroupScope && ! $user->is_main_admin, fn ($query) => $query->where('group_id', $user->group_id));
        $groupMembers = GroupMember::query()
            ->when(! $hasGroupScope, fn ($query) => $query->whereRaw('1 = 0'))
            ->when($hasGroupScope && ! $user->is_main_admin, fn ($query) => $query->where('group_id', $user->group_id));
        $mainAdminOnly = fn ($query) => $query->when(! $user->is_main_admin, fn ($restricted) => $restricted->whereRaw('1 = 0'));

        $counts = DB::query()
            ->selectSub((clone $events)->selectRaw('COUNT(*)'), 'events_total')
            ->selectSub((clone $events)->where('status', 'published')->selectRaw('COUNT(*)'), 'events_published')
            ->selectSub((clone $events)->where('status', 'draft')->selectRaw('COUNT(*)'), 'draft_events')
            ->selectSub($mainAdminOnly(MassTime::query())->selectRaw('COUNT(*)'), 'mass_times_total')
            ->selectSub($mainAdminOnly(MassTime::query())->where('status', 'published')->selectRaw('COUNT(*)'), 'mass_times_published')
            ->selectSub($mainAdminOnly(ParishRegistration::query())->selectRaw('COUNT(*)'), 'registrations_total')
            ->selectSub((clone $contactMessages)->selectRaw('COUNT(*)'), 'contact_messages_total')
            ->selectSub((clone $contactMessages)->where('status', 'new')->selectRaw('COUNT(*)'), 'new_contact_messages')
            ->selectSub((clone $groupMembers)->selectRaw('COUNT(*)'), 'group_members_total')
            ->selectSub($mainAdminOnly(NewsPost::query())->where('status', 'draft')->selectRaw('COUNT(*)'), 'draft_news')
            ->selectSub($mainAdminOnly(Newsletter::query())
                ->where('status', 'draft')
                ->whereDate('publication_date', '<=', $today->toDateString())
                ->selectRaw('COUNT(*)'), 'newsletters_due_for_publication')
            ->selectSub($mainAdminOnly(Newsletter::query())
                ->where('status', 'draft')
                ->whereBetween('publication_date', [$today->addDay()->toDateString(), $today->addWeek()->toDateString()])
                ->selectRaw('COUNT(*)'), 'newsletters_publishing_soon')
            ->selectSub($mainAdminOnly(ParishChild::query())
                ->whereNotNull('date_of_birth')
                ->whereDate('date_of_birth', '<=', $today->subYears(18)->toDateString())
                ->selectRaw('COUNT(*)'), 'adult_children')
            ->selectSub($mainAdminOnly(ParishChild::query())
                ->whereNotNull('date_of_birth')
                ->whereBetween('date_of_birth', [
                    $today->subYears(18)->addDay()->toDateString(),
                    $today->addMonths(3)->subYears(18)->toDateString(),
                ])
                ->selectRaw('COUNT(*)'), 'children_turning_18_soon')
            ->first();

        return collect((array) $counts)
            ->map(fn ($value) => (int) $value)
            ->all();
    }

    private function alertCountsFromSummary(array $summaryCounts): array
    {
        return [
            'new_contact_messages' => $summaryCounts['new_contact_messages'],
            'draft_events' => $summaryCounts['draft_events'],
            'draft_news' => $summaryCounts['draft_news'],
            'newsletters_due_for_publication' => $summaryCounts['newsletters_due_for_publication'],
            'newsletters_publishing_soon' => $summaryCounts['newsletters_publishing_soon'],
            'adult_children' => $summaryCounts['adult_children'],
            'children_turning_18_soon' => $summaryCounts['children_turning_18_soon'],
        ];
    }

    private function recentAuditLogs(Request $request)
    {
        if (! $request->user()->is_main_admin) {
            return collect();
        }

        return AuditLog::query()
            ->with('user')
            ->latest()
            ->limit(6)
            ->get()
            ->map(fn (AuditLog $log) => [
                'id' => $log->id,
                'action' => $log->action,
                'subject_title' => $log->subject_title,
                'admin_name' => $log->user?->name ?? 'Admin',
                'created_at' => $log->created_at?->toIso8601String(),
            ])
            ->values();
    }

    private function buildNotifications(Request $request, array $counts): array
    {
        $items = [];

        if ($counts['new_contact_messages'] > 0) {
            $items[] = [
                'key' => 'new-contact-messages',
                'title' => 'New contact messages',
                'message' => "{$counts['new_contact_messages']} message(s) still need a first review.",
                'count' => $counts['new_contact_messages'],
                'tone' => 'gold',
                'link' => '/dashboard/contact-messages',
            ];
        }

        if ($counts['draft_events'] > 0) {
            $items[] = [
                'key' => 'draft-events',
                'title' => 'Draft events',
                'message' => "{$counts['draft_events']} event(s) are not published yet.",
                'count' => $counts['draft_events'],
                'tone' => 'blue',
                'link' => '/dashboard/events',
            ];
        }

        if ($request->user()->is_main_admin && $counts['draft_news'] > 0) {
            $items[] = [
                'key' => 'draft-news',
                'title' => 'Draft news posts',
                'message' => "{$counts['draft_news']} news post(s) are waiting to publish.",
                'count' => $counts['draft_news'],
                'tone' => 'blue',
                'link' => '/dashboard/news',
            ];
        }

        if ($request->user()->is_main_admin && $counts['newsletters_due_for_publication'] > 0) {
            $items[] = [
                'key' => 'newsletters-due-for-publication',
                'title' => 'Newsletters ready to publish',
                'message' => "{$counts['newsletters_due_for_publication']} newsletter(s) have reached their publication date and will be published automatically when the newsletter page is refreshed.",
                'count' => $counts['newsletters_due_for_publication'],
                'tone' => 'red',
                'link' => '/dashboard/newsletters',
            ];
        }

        if ($request->user()->is_main_admin && $counts['newsletters_publishing_soon'] > 0) {
            $items[] = [
                'key' => 'newsletters-publishing-soon',
                'title' => 'Newsletters publishing soon',
                'message' => "{$counts['newsletters_publishing_soon']} draft newsletter(s) are scheduled within the next 7 days.",
                'count' => $counts['newsletters_publishing_soon'],
                'tone' => 'gold',
                'link' => '/dashboard/newsletters',
            ];
        }

        if ($request->user()->is_main_admin && $counts['adult_children'] > 0) {
            $items[] = [
                'key' => 'adult-children',
                'title' => 'Children now 18+',
                'message' => "{$counts['adult_children']} child record(s) should be reviewed.",
                'count' => $counts['adult_children'],
                'tone' => 'red',
                'link' => '/dashboard/registrations',
            ];
        }

        if ($request->user()->is_main_admin && $counts['children_turning_18_soon'] > 0) {
            $items[] = [
                'key' => 'children-turning-18',
                'title' => 'Turning 18 soon',
                'message' => "{$counts['children_turning_18_soon']} child record(s) turn 18 in the next 3 months.",
                'count' => $counts['children_turning_18_soon'],
                'tone' => 'gold',
                'link' => '/dashboard/registrations',
            ];
        }

        return $items;
    }

    public function updateItemVisibility(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'item_key' => ['required', 'string'],
            'visibility' => ['required', Rule::in(['pinned', 'dismissed'])],
        ]);

        $user = $request->user();
        $overviewPreferences = $this->normalizeOverviewPreferences($user?->hidden_overview_items);

        $overviewPreferences['pinned'] = array_values(array_filter(
            $overviewPreferences['pinned'],
            fn ($value) => $value !== $validated['item_key']
        ));
        $overviewPreferences['dismissed'] = array_values(array_filter(
            $overviewPreferences['dismissed'],
            fn ($value) => $value !== $validated['item_key']
        ));

        $overviewPreferences[$validated['visibility']][] = $validated['item_key'];
        $overviewPreferences[$validated['visibility']] = array_values(array_unique($overviewPreferences[$validated['visibility']]));

        $this->saveOverviewPreferences($user, $overviewPreferences);

        return response()->json([
            'message' => $validated['visibility'] === 'dismissed'
                ? 'The item has been cleared from the overview.'
                : 'The item will stay on the overview until you clear it.',
            'overview_preferences' => $overviewPreferences,
        ]);
    }

    private function withOverviewKeys(array $items, string $type, array $overviewPreferences, CarbonImmutable $baselineAt): array
    {
        return array_values(array_filter(array_map(function (array $item) use ($type, $overviewPreferences, $baselineAt) {
            $itemKey = "{$type}:{$item['id']}";
            $createdAt = ! empty($item['created_at']) ? CarbonImmutable::parse($item['created_at']) : null;
            $isPinned = in_array($itemKey, $overviewPreferences['pinned'], true);
            $isDismissed = in_array($itemKey, $overviewPreferences['dismissed'], true);
            $isNew = $createdAt ? $createdAt->greaterThan($baselineAt) : false;
            $shouldShow = ($isNew || $isPinned) && ! $isDismissed;

            return [
                ...$item,
                'overview_item_key' => $itemKey,
                'is_new' => $isNew,
                'is_pinned' => $isPinned,
                'should_show_in_overview' => $shouldShow,
            ];
        }, $items), fn (array $item) => $item['should_show_in_overview']));
    }

    private function normalizeOverviewPreferences(mixed $value): array
    {
        if (is_array($value) && array_is_list($value)) {
            return [
                'baseline_at' => null,
                'pinned' => [],
                'dismissed' => array_values(array_filter($value, fn ($item) => is_string($item) && $item !== '')),
            ];
        }

        $data = is_array($value) ? $value : [];

        return [
            'baseline_at' => isset($data['baseline_at']) && is_string($data['baseline_at']) ? $data['baseline_at'] : null,
            'pinned' => array_values(array_filter($data['pinned'] ?? [], fn ($item) => is_string($item) && $item !== '')),
            'dismissed' => array_values(array_filter($data['dismissed'] ?? [], fn ($item) => is_string($item) && $item !== '')),
        ];
    }

    private function saveOverviewPreferences(?User $user, array $preferences): void
    {
        if (! $user) {
            return;
        }

        $user->forceFill([
            'hidden_overview_items' => $preferences,
        ])->save();
    }

    private function dayOrderSql(): string
    {
        return "
            CASE day
                WHEN 'Sunday' THEN 1
                WHEN 'Monday' THEN 2
                WHEN 'Tuesday' THEN 3
                WHEN 'Wednesday' THEN 4
                WHEN 'Thursday' THEN 5
                WHEN 'Friday' THEN 6
                WHEN 'Saturday' THEN 7
                ELSE 8
            END
        ";
    }
}
