# Admin functionality audit — 26 September 2026

## Fix verification — 26 September 2026

The confirmed defects below have been fixed. Final verification: **73 backend suite tests passed (311 assertions), 18 audit tests passed (86 assertions), and 4 frontend regression tests passed**. Frontend lint has no errors or warnings, and the production build passes. The build still reports its existing bundle-size and browser-data notices.

Fixed behavior:

- Unassigned accounts receive an empty events list and cannot read, update, delete, or preview private events. Group date previews are scoped to the assigned group. Private event images use the same permission rules; unpublished news/gallery/newsletter files require appropriate admin access.
- Schedule checks compare full event date/time intervals and recurring weekly Mass intervals. Overnight events, midnight-crossing services, different weekdays, adjacency, and case-insensitive location matching are covered. New/edited Masses save their one-hour end time; older records with no end time use the same one-hour fallback without requiring a database migration.
- Overview pins are fetched independently of the recent-record limit, while retaining group restrictions. Dismissed items no longer consume the recent-record slots.
- All eight paginated admin content lists collect every authorized page, apply the existing search/filter logic, and then paginate matching records. Changing filters resets to page one; deleting the last record on a page clamps the page number. Fetches are cached and limited to four concurrent page requests. Full content lists load on demand rather than all being prefetched at login. This approach requires loading the complete authorized list, so very large datasets may warrant server-side filtering later.
- Gallery default ordering and council sort-order choices use the full loaded list and preserve existing high order values.
- Main-admin self-deletion is blocked, and its delete form is hidden. Normal account deletion remains supported. Admin caches are cancelled/cleared when authentication changes.
- Mass times, newsletters, groups, and parish council changes now write activity logs. The dashboard header refreshes after successful mutations.
- Initial list failures display errors, registration validation errors are shown, and the unsupported individual-to-family conversion instruction has been removed.

No deployment or live data migration was performed. Live browser cookies/CSRF/CORS, real email delivery, production database behavior, and hosting upload limits still need deployment verification. Existing newsletter policy is preserved: future-dated drafts publish when due; a draft whose publication date has arrived auto-publishes on a read.

Regression coverage: `backend/tests/Feature/AdminRegressionTest.php`, `backend/audit/AdminAuditTest.php`, and `Frontend/tests/adminPagination.test.js`. The frontend checks can be run with `npm test` inside `Frontend`. The isolated audit runner below now exits successfully.

## Original findings (before the fixes)

The remainder records the initial audit and its original failures for reference.

## Evidence and scope

- Existing backend suite: **61 passed, 253 assertions**.
- Added audit suite: **18 tests, 11 passed, 7 failed, 86 assertions**. The failures deliberately assert the expected behavior and reproduce defects; they are not fixes.
- Combined: **79 tests, 72 passed, 7 failed**.
- Frontend production build: passed. Warnings concern bundle size and outdated browser compatibility data.
- Frontend lint: no errors; one missing React effect dependency warning in `Frontend/src/pages/admin/AdminContactMessagesPage.jsx:162`.
- Reviewed React admin forms, request helpers, Laravel routes, controllers, validation, permissions, and upload handling.
- Completed backend runs used SQLite in memory and separate upload storage. These results do not verify the deployed database, browser cookies/CSRF/CORS, actual email delivery, hosting upload limits, or every browser interaction. No browser automation tool was available.
- Application code was not changed. Audit tests, their runner, results, and this report were added.

## Function-by-function summary

“Pass” means the listed local backend behavior passed, with frontend wiring reviewed; it is not a claim of complete browser testing. Search limitations below also affect otherwise passing modules.

| Admin area | Working in checks | Problems or limits |
|---|---|---|
| Login and logout | API login, current-user lookup, logout, rejection after logout; existing invalid-login and validation tests | Live session/cookie behavior not browser-tested |
| Password and profile | Profile updates, password changes, incorrect-current-password rejection, account deletion; existing reset-token tests | Real reset email delivery unverified. Last-main-admin deletion protection is absent in the profile endpoint |
| Overview | Summary counts, list endpoint, header notifications endpoint, save pin preference | Pinned items disappear when pushed beyond the four fetched records |
| Events | Main-admin create/update/delete with uploaded image; group-admin create/update/delete, forced draft status, edit rejection for another group's event | Unassigned-account list crashes; unassigned accounts can read/delete ungrouped events; clash checks fail in several cases |
| Mass times | Create, edit, delete, by-day lookup, identical-time duplicate rejection | Unrelated event weekdays can block valid Mass times; Mass end times are not saved by the form/controller, undermining overlap detection |
| News and announcements | Create, detail, edit, publish, image upload/serving, delete | Searches cover current page only; browser image compression not exercised |
| Newsletters | PDF upload and validation, metadata edit, PDF replacement, preview, download, deletion, due-date auto-publication | Drafts dated today or earlier automatically become published on a subsequent read; there is no separate “keep unpublished” draft state |
| Photo gallery | Upload, admin image preview, guest denial for hidden image, edit visibility, public active image, delete | Search and default ordering depend on current page; browser compression not exercised |
| Parish registrations | List/detail, update and add family child, delete registration with children/interests | Search covers current page only. Admin edit supports a subset of fields; no individual-to-family conversion despite UI wording suggesting it |
| Contact messages | List, main-admin deletion, group-admin status update and deletion denial | Search/filter covers current page only. Add-member navigation was reviewed, not clicked in a browser |
| Parish council | Create with photo, hidden-photo admin preview, update/delete, main-admin permission enforcement | Search and sort-order choices depend on current page |
| Groups | Create, detail, edit, delete, admin assignment through group/account workflows | No full transaction/partial-failure testing |
| My Group / group members | Own-group viewing/creation, update role, deletion, other-group access rejection, main-admin cross-group listing | Group admins intentionally cannot edit existing members' personal details; only role/notes |
| Admin accounts | Create, edit, delete, group assignment and listing through groups endpoint | Main-admin editing is deliberately excluded; account management creates group admins |
| Permissions | Main-admin-only resource lists and account creation reject non-main admins | Event access exception below is a confirmed serious defect |
| Activity/audit logs | Activity retrieval and logging exist for events, news, gallery, registrations, contact actions, group members, admin accounts | No audit logging calls for Mass times, newsletters, groups or parish council actions; activity history is incomplete |
| Search, filters, pagination | Page retrieval and filters over loaded rows are implemented | Search/filter does not cover the full database; pagination remains based on unfiltered data |

## Confirmed failing behavior

### 1. High priority: unassigned accounts can access ungrouped events

`backend/app/Http/Controllers/Admin/EventController.php:263` compares the event's `group_id` with the user's `group_id`. When both are null, access is allowed.

Two tests reproduced HTTP 200 when HTTP 403 was expected: reading `/admin/events/{id}/edit` and deleting `/admin/events/{id}`. This applies to signed-in accounts without a group, including ordinary newly registered accounts. A broken events list does not protect these direct endpoints.

### 2. Events page crashes for accounts without a group

`EventController.php:24` returns a plain collection, but line 32 calls paginator-only `items()` on it. `/admin/events` returns HTTP 500 instead of an empty list. The React initial fetch also lacks a catch handler, so the page can appear empty without explaining the failure.

### 3. Event–Mass overlap prevention misses real conflicts

Create a Monday Mass at 10:00 at Cathedral, then create a Monday event at the same location from 10:00 to 11:00. Both save successfully; the second should be rejected.

`MassTimeRequest.php` has no validated `end_time`, and `MassTimeController.php` saves the validated fields without computing an end time. `NoEventOverlap.php` requires a non-null Mass end time when checking overlap, so admin-created Masses are missed. The same omission also weakens Mass-to-Mass overlap checks beyond exact start-time duplicates.

### 4. Mass scheduling rejects unrelated weekdays

Create a Monday event at Cathedral from 10:00 to 11:00; then create a Tuesday Mass at Cathedral at 10:00. The Mass returns HTTP 422 even though the weekdays differ.

`backend/app/Services/ClashDetectionService.php:69` compares event location/time without constraining event date or weekday. `NoMassTimeOverlap.php:47` also omits the weekday argument for the Mass query.

### 5. Same-location event clashes can bypass validation

Creating the same event twice at `Cathedral Hall` succeeded twice in the SQLite audit. `EventRequest.php` normalizes the location to title case, but `EventController.php:74` stores it as `Cathedral hall`. Exact comparisons therefore miss the saved event on a case-sensitive database. Deployment impact depends on database collation.

### 6. Overview pinning does not keep an item visible

Pin an event, then add four events with later start dates. The pinned event disappears from the overview response. `OverviewController.php:64` fetches only four events before considering pinned IDs in `withOverviewKeys()`. The other overview categories use the same limiting pattern.

These six findings account for seven failed tests because unauthorized event reading and deletion are tested separately.

## Additional findings from code review

- **Search/filter is page-local:** helpers in `Frontend/src/lib/admin.js` send only `page`; pages filter the returned ten records in JavaScript. For example, `AdminNewsPage.jsx:369`, `AdminRegistrationsPage.jsx:501`, and `AdminContactMessagesPage.jsx:296`. A matching record on another page can be missed. Events, Mass times, newsletters, gallery and council use the same pattern.
- **Ordering controls are page-local:** council sort-order options and gallery default sort order use the loaded page length rather than the complete list. This breaks ordering assumptions once more than ten records exist.
- **Event date preview is not group-scoped:** `EventController.php:203` returns titles/dates/times for all groups, including drafts. Confirm whether sharing this information for clash previews is intended.
- **Multi-day scheduling is restricted incorrectly:** `EventRequest.php` and `NoEventOverlap.php` require end clock time to be later than start clock time even when the end date is later. An overnight event ending the next morning is rejected.
- **Main-admin self-deletion can strand administration:** `ProfileController.php::destroy` allows any authenticated user with the correct password to delete their account, without preserving a main admin. This bypasses the restriction in `AdminAccountController`. No normal UI for promoting an existing account to main admin was found.
- **Audit trail is incomplete:** several content controllers never call `Audit::log`, so their changes do not appear in recent activity.
- **Newsletter draft behavior:** all due drafts auto-publish on reads. This is consistent with the scheduling implementation, but admins cannot use an already-due draft to keep a PDF unpublished.

## Reproduce the added checks

From the repository root in PowerShell:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File backend/audit/run-audit.ps1
```

The runner forces an in-memory SQLite database and `backend/storage/admin-audit-isolated` for uploads. Tests live outside the normal suite at `backend/audit/AdminAuditTest.php`. `results.txt` contains the latest readable results and `results.xml` contains JUnit results. The latest run passes all 18 tests.

The fixes are summarized at the top of this report. Browser testing against the deployment database and real authentication/email configuration remains a deployment check.
