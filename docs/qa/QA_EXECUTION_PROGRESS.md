# QA execution progress

Execution started: 9 October 2026. Environment: local Laravel, disposable SQLite, synthetic data, array mail, synchronous queues. No hosted or production services were contacted.

## Batch 1 â€” first 15 current Not Run cases

| Test ID | Execution Method | Actual Result | Status | Evidence |
|---|---|---|---|---|
| PUB-TC-001 | Playwright Chromium against localhost Vite/Laravel | Desktop internal links opened their mapped routes; mobile menu categories expanded, Gallery navigation closed the drawer, and no external API/backend request occurred after forcing the QA origin | Passed | Frontend/tests/e2e/batch1-navigation.spec.mjs; Frontend/test-results/batch1-results.json; first run trace/screenshot under Frontend/test-results exposed hosted API leakage before QA-origin override |
| PUB-TC-003 | Existing localhost browser smoke | Home rendered; carousel-dot transitions and every dynamic card destination were not exercised | Not Run | Browser route output; fixture/card interaction not covered |
| PUB-TC-004 | Existing localhost browser smoke | Public routes rendered; every information-page CTA, external destination, and subject-prefill was not exercised | Not Run | Browser route output; full link matrix not covered |
| PUB-TC-005 | Existing localhost browser smoke | Gallery rendered; thumbnail overlay, wraparound navigation, and backdrop close were not exercised | Not Run | Browser route output; gallery interaction oracle not covered |
| PUB-TC-006 | PHPUnit public API tests plus browser smoke | Public gallery route rendered; active/inactive image filtering and forced API-failure fallback were not executed as one scenario | Not Run | PublicApiTest and browser route output; failure interception still required |
| PUB-TC-007 | Existing localhost browser smoke | Public routes rendered; active-group join links and empty-response fallback were not executed | Not Run | Browser route output; response interception still required |
| CNT-TC-001 | PHPUnit PublicApi mass-times test | Published mass-time API response passed; UI tabs and /mass-sacraments equivalence were not executed | Not Run | Targeted PHPUnit command; 10 tests, 61 assertions passed |
| CNT-TC-002 | PHPUnit PublicApi event and image tests | Published/draft API filtering and image route passed; upcoming/past UI ordering and both detail screens were not executed | Not Run | Targeted PHPUnit command; 10 tests, 61 assertions passed |
| CNT-TC-004 | Attempted browser execution | Requires browser delay, HTTP 500 interception, loading/error assertion, and missing-detail check | Blocked | Current smoke runner lacks network-interception support |
| CNT-TC-005 | PHPUnit public event/news boundary tests plus browser smoke | Published event/image and future-news boundary checks passed; complete news UI type/content/image scenario was not executed | Not Run | Targeted PHPUnit command; 10 tests, 61 assertions passed |
| CNT-TC-007 | Existing browser route sweep | Newsletter pages rendered; latest selection, archive filtering, and open/download URL mapping were not executed | Not Run | Browser route output; archive interaction oracle not covered |
| CNT-TC-012 | Attempted browser execution | Requires empty/delayed/500 news responses and nonexistent-detail navigation assertions | Blocked | Current smoke runner lacks network-interception support |
| FRM-TC-003 | PHPUnit group-join API test | Group-join request persisted and API validation passed; query subject prefill and browser-selected group flow were not executed | Not Run | Targeted PHPUnit command; 10 tests, 61 assertions passed |
| FRM-TC-004 | PHPUnit contact validation and group-boundary tests | Missing/inactive/arbitrary group requests returned validation errors; escaped admin rendering and SQL-looking input side effects were not executed as a complete browser scenario | Not Run | Targeted PHPUnit command; 10 tests, 61 assertions passed |
| FRM-TC-005 | Existing browser contact smoke | Normal validation and successful submission passed; forced 500/network retry and reset behavior were not executed | Not Run | Browser smoke output; failure interception still required |

## Batch 1 command evidence

Command executed in backend:

php vendor/phpunit/phpunit/phpunit --filter 'PublicApiTest|QaFindingVerificationTest::test_contact_rejects_inactive_group_and_arbitrary_category|QaFindingVerificationTest::test_future_published_news_image_is_hidden_with_the_post' --testdox

Result: 10 tests passed, 61 assertions, 0 failures.

Cases recorded as Not Run or Blocked were not promoted to Passed because their documented browser interaction and failure-state oracles were not actually verified.

## Remaining Batch 1 Playwright run

Command executed with `VITE_BACKEND_ORIGIN=http://127.0.0.1:8000`:

```powershell
npx.cmd playwright test tests/e2e/batch1-remaining.spec.mjs --config=playwright.config.mjs
```

Result: **14 Playwright tests passed in 46.7 seconds.** The run covered real Chromium navigation, clicks, form filling, route interception, delayed responses, HTTP 500 responses, empty responses, and the localhost API guard. However, the current assertions do not yet verify every documented content, ordering, filter, download, database-persistence, or retry/reset oracle. Those 14 cases therefore remain Not Run in `TEST_CASES.md` pending complete acceptance assertions; the passing result is automation evidence, not a documented-case pass.

| Case IDs exercised by the run | Browser result | QA status |
|---|---|---|
| PUB-TC-003, PUB-TC-004, PUB-TC-005, PUB-TC-006, PUB-TC-007, CNT-TC-001, CNT-TC-002, CNT-TC-004, CNT-TC-005, CNT-TC-007, CNT-TC-012, FRM-TC-003, FRM-TC-004, FRM-TC-005 | 14 passed | Not Run pending complete documented oracle verification |

## Strengthened acceptance runs

| Case | Command | Result | Criteria verified | Still missing |
|---|---|---|---|---|
| PUB-TC-004 | `npx.cmd playwright test tests/e2e/batch1-remaining.spec.mjs --config=playwright.config.mjs --grep=PUB-TC-004` | Passed, 1 test | All listed public routes render; contact subject query; internal contact/registration links; mailto/tel links; localhost API guard | Every CTA destination and external-link destination from the inventory is not yet asserted |
| CNT-TC-004 | `npx.cmd playwright test tests/e2e/batch1-remaining.spec.mjs --config=playwright.config.mjs --grep=CNT-TC-004` | Passed, 1 test | Delayed request; loading text; HTTP 500 response text; missing detail contains no private/draft text | Explicit empty-state assertion and documented missing-detail navigation/back behavior |
| CNT-TC-012 | `npx.cmd playwright test tests/e2e/batch1-remaining.spec.mjs --config=playwright.config.mjs --grep=CNT-TC-012` | Passed, 1 test | Empty response content; delayed HTTP 500 response; error response text; nonexistent detail has no false/private content | Explicit loading indicator and detail back-navigation assertion |

## Batch 1 targeted 11-case execution (9 October 2026)

The requested 11 cases were executed in Chromium against local Vite/Laravel with `VITE_BACKEND_ORIGIN=http://127.0.0.1:8000`, disposable SQLite data, route interception, screenshots and traces enabled. The 14-test file also reran PUB-TC-004, CNT-TC-004 and CNT-TC-012.

| Case IDs | Browser execution result | Documentation status | Evidence |
|---|---|---|---|
| PUB-TC-003, PUB-TC-005, PUB-TC-006, PUB-TC-007 | 4 passed | Not Run pending fixture-backed card, inactive-record and destination assertions | `Frontend/tests/e2e/batch1-remaining.spec.mjs`; `Frontend/test-results/batch1-remaining-*` |
| CNT-TC-001, CNT-TC-002, CNT-TC-005, CNT-TC-007 | 4 passed | Not Run pending seeded content/order/filter/download verification | same |
| FRM-TC-003, FRM-TC-004, FRM-TC-005 | 3 passed | Not Run pending persistence/admin-routing and complete API/security oracles | same |

The two additional regression cases failed as expected: CNT-TC-004 and CNT-TC-012 both reproduced D-013 because nonexistent detail views do not provide the documented back-navigation link. They remain Failed in the defect ledger and were not fixed.

Full command:
`$env:VITE_BACKEND_ORIGIN='http://127.0.0.1:8000'; npx.cmd playwright test tests/e2e/batch1-remaining.spec.mjs --config=playwright.config.mjs`

Result: 12 passed, 2 failed (CNT-TC-004, CNT-TC-012), 0 skipped. Targeted 11-case result: 11 executed, 9 browser-pass, 2 additional cases (none of the requested 11) were not part of the two failures. Passing browser checks are retained as evidence but do not promote a documented case without every acceptance oracle.

## Targeted completion attempt: PUB-TC-006, PUB-TC-007, FRM-TC-003 (9 October 2026)

Existing Playwright tests were strengthened before execution.

| QA case | Browser result | Database/API verified | Final status | Missing criteria |
|---|---|---|---|---|
| PUB-TC-006 | Passed | API active-only response and mocked inactive image 404 verified; bundled fallback route verified | Not Run | Disposable database active/inactive fixture was not established, so direct real-record/database evidence is incomplete |
| PUB-TC-007 | Passed | Active group response, actual click navigation to `/parish-groups/choir/join`, back navigation, and empty fallback verified | Not Run | Real seeded backend group record and external destination matrix remain unverified |
| FRM-TC-003 | Passed | Browser submission payload and success dialog verified using synthetic group fixture; no SQLite/admin query completed | Not Run | Real Laravel persistence and authorized admin inbox verification remain outstanding |

Commands executed individually:

```powershell
$env:VITE_BACKEND_ORIGIN='http://127.0.0.1:8000'; npx.cmd playwright test tests/e2e/batch1-remaining.spec.mjs --config=playwright.config.mjs --grep 'PUB-TC-006'
$env:VITE_BACKEND_ORIGIN='http://127.0.0.1:8000'; npx.cmd playwright test tests/e2e/batch1-remaining.spec.mjs --config=playwright.config.mjs --grep 'PUB-TC-007'
$env:VITE_BACKEND_ORIGIN='http://127.0.0.1:8000'; npx.cmd playwright test tests/e2e/batch1-remaining.spec.mjs --config=playwright.config.mjs --grep 'FRM-TC-003'
```

Each targeted browser test passed. The cases were deliberately not promoted to Passed because the required real SQLite/admin evidence was not fabricated. No new application defect was confirmed. Evidence is under `Frontend/test-results/`; assertions are in `Frontend/tests/e2e/batch1-remaining.spec.mjs`.

## Shared SQLite integration attempt — 10 October 2026

Created and exercised `backend/tests/qa_shared_seed.php` with Laravel migrations and a disposable file database. Seed output confirmed the shared database path, admin account, active/inactive groups, and active/inactive gallery records. Direct local API verification returned one active group, one active gallery record, and inactive image access was protected.

The browser phase was blocked before case completion: the Vite process served the bundled gallery fallback instead of the seeded API record during Chromium navigation, despite the local Laravel API returning the seeded record. No mocked success response was substituted. Therefore PUB-TC-006, PUB-TC-007, and FRM-TC-003 remain Not Run. No production code was changed and no defect was classified from this infrastructure mismatch.

Evidence: `backend/tests/qa_shared_seed.php`, `Frontend/test-results/batch1-remaining-PUB-TC-006-gallery-inactive-and-API-fallback/`.

## Real integration verification — 10 October 2026

The browser now waited for the asynchronous API response instead of asserting during the bundled fallback render. Chromium traced real local requests to `http://127.0.0.1:8000/api/v1/...`; gallery and group responses were HTTP 200, inactive image access returned HTTP 404, and the forced gallery failure returned HTTP 500. No hosted requests occurred in the corrected run.

- PUB-TC-006: real seeded active gallery record rendered; inactive record was excluded by API and direct image access returned 404; fallback behavior was verified after a forced 500. Passed.
- PUB-TC-007: real seeded `qa-choir` record rendered; click navigated to `/parish-groups/qa-choir/join`; browser back restored the list; empty response fallback was verified. Passed.
- FRM-TC-003: real browser POST returned HTTP 200; SQLite verification returned the exact `QA Group Routing` row with category `group_join`, group_id `1`, subject, message, and sender values. Authorized admin inbox UI was not executed, so this case remains Not Run.

The root cause was a Playwright timing/selector issue: the test asserted the gallery before the asynchronous Laravel response had completed. The API contract was correct (`{success:true,data:[...]}`), and React rendered the seeded record once the response was awaited.

## FRM-TC-003 admin inbox completion — 10 October 2026

The real Chromium flow now submits a unique contact message, logs in through `/login` as the seeded main admin, opens `/dashboard/contact-messages`, selects the persisted message, verifies sender, phone, subject, category/group, and message detail, reloads successfully, and confirms a fresh guest context is redirected to `/login`. Browser API logs show local-only requests and the real POST returned HTTP 200. SQLite verification used the same disposable file.

PUB-TC-006 direct Laravel verification: `GET http://127.0.0.1:8000/api/v1/gallery-images/2/image` returned **404**. The earlier Vite URL was a proxied request; Laravel itself also enforced the inactive-image protection.
