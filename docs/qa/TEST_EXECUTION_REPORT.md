# QA execution report

**Execution date:** 9 October 2026  
**Subject:** St Mary's Cathedral website, local workspace revision  
**Case inventory:** 137 unique cases  
**Current outcome:** **26 Pass, 0 Fail, 1 Blocked, 110 Not Run.** The initial execution result was 17 Pass, 9 Fail, 1 Blocked and 110 Not Run. All nine confirmed failures now pass their stated acceptance criteria.

## Safe execution setup

- Backend tests used `APP_ENV=testing`, in-memory SQLite, array mail, synchronous queues, array sessions and test-owned storage below `backend/storage/qa-*`.
- Browser smoke used Vite and Laravel on `127.0.0.1`, `Frontend/.env.qa` with an empty API origin, a disposable SQLite file and generated `@example.test` identities.
- No production database, account or content was intentionally read or changed.
- The original browser configuration resolved its API host to `https://church-2m8b.onrender.com`. An earlier contact attempt ended with a browser network error. Local logs contain no matching synthetic address, and hosted logs or administrative records were unavailable, so the destination is established but the remote effect cannot be conclusively determined. Every successful browser submission reported here used localhost.

## Automated verification

| Check | Before fixes | After fixes |
|---|---:|---:|
| Nine defect regressions | 0 passed, 9 failed | **9 passed, 55 assertions** |
| Full backend suite | 101 tests, 679 assertions | **105 tests, 723 assertions**, passed twice |
| Frontend unit tests | 5 passed | **6 passed** |
| Frontend lint | Passed | **Passed** |
| Frontend production build | Passed | **Passed**; Vite retained advisory browser-data and bundle-size warnings |
| Local browser smoke | Public form and route checks passed | **Passed** guest dashboard redirect, first-account signup role, ordinary-user dashboard denial and contact persistence |

The final browser run created the literal first account in its disposable database with `is_main_admin=false` and `group_id=null`. Opening `/dashboard` as that user ended at `/`. The matching synthetic contact row persisted with `is_member=1`.

The PHP formatter check is not clean: Pint reported style differences in 13 files, including existing line-ending and formatting differences. This was recorded rather than applying broad formatting changes outside the defect scope.

## Reproduction commands

```powershell
# backend/
$env:APP_ENV='testing'; $env:DB_CONNECTION='sqlite'; $env:DB_DATABASE=':memory:'
$env:MAIL_MAILER='array'; $env:QUEUE_CONNECTION='sync'; $env:SESSION_DRIVER='array'
$env:LARAVEL_STORAGE_PATH=(Join-Path (Get-Location) 'storage/qa-fix-final-suite')
New-Item -ItemType Directory -Force -Path (Join-Path $env:LARAVEL_STORAGE_PATH 'framework/views') | Out-Null
php vendor/phpunit/phpunit/phpunit --testdox

# Frontend/
node --test tests/adminPagination.test.js tests/adminAuthorization.test.js
npm.cmd run lint
npm.cmd run build -- --configLoader runner
```

The browser runner is `Frontend/tests/qaBrowserSmoke.mjs`. It requires localhost QA-mode Vite/Laravel services and a local Edge or Chrome DevTools endpoint. `backend/tests/qaBrowserDbCheck.php` checks the disposable row directly.

## Case disposition

| Status | Case IDs | Basis |
|---|---|---|
| Pass (26) | CNT-TC-003, CNT-TC-006, CNT-TC-009, CNT-TC-011, FRM-TC-001, FRM-TC-002, FRM-TC-008, FRM-TC-009, FRM-TC-010, FRM-TC-011, REG-TC-004, AUTH-TC-010, AUTH-TC-011, ADM-TC-004, EVT-TC-004, MASS-TC-003, MASS-TC-004, NEWS-TC-003, OVR-TC-003, AREG-TC-004, MEM-TC-004, MSG-TC-002, ACC-TC-004, GRP-TC-005, GRP-TC-007, SEC-TC-004 | Required behavior was verified by backend, frontend or isolated browser automation. |
| Blocked (1) | PUB-TC-002 | The browser renders an empty React root for an unknown path; the intended 404 behavior is not specified. |
| Not Run (110) | All other case IDs | The complete scenario or acceptance oracle was not executed. Partial evidence remains Not Run. |

## Module results

| Module | Pass | Fail | Blocked | Not Run |
|---|---:|---:|---:|---:|
| ACC | 1 | 0 | 0 | 5 |
| ADM | 1 | 0 | 0 | 3 |
| AREG | 1 | 0 | 0 | 5 |
| AUTH | 2 | 0 | 0 | 10 |
| CNT | 4 | 0 | 0 | 8 |
| COU | 0 | 0 | 0 | 6 |
| EVT | 1 | 0 | 0 | 8 |
| FRM | 6 | 0 | 0 | 5 |
| GAL | 0 | 0 | 0 | 6 |
| GRP | 2 | 0 | 0 | 5 |
| MASS | 2 | 0 | 0 | 4 |
| MEM | 1 | 0 | 0 | 5 |
| MSG | 1 | 0 | 0 | 5 |
| NEWS | 1 | 0 | 0 | 6 |
| NWL | 0 | 0 | 0 | 7 |
| OVR | 1 | 0 | 0 | 3 |
| PRO | 0 | 0 | 0 | 4 |
| PUB | 0 | 0 | 1 | 6 |
| REG | 1 | 0 | 0 | 5 |
| SEC | 1 | 0 | 0 | 4 |
| **Total** | **26** | **0** | **1** | **110** |

## Finding status

- QA-F01, QA-F02, QA-F06, QA-F08, QA-F09, QA-F10, QA-F11, QA-F13 and QA-F14 are resolved through D-001 to D-009.
- QA-F03, QA-F04, QA-F05, QA-F07 and QA-F15 still require product decisions or broader execution.
- QA-F12 was not reproduced for retrieval completeness: 500 news rows and the pagination aggregator passed, while browser latency and other list modules remain unexecuted.

## Remaining coverage and release assessment

The 110 Not Run cases include broad CRUD, cross-role matrices, browser interaction, responsive behavior, accessibility, CSRF/XSS, deployment integration and large-list coverage. The one blocked unknown-route case still needs a product acceptance rule. No confirmed defect remains open from D-001 through D-009, so those defects are no longer release blockers. Release readiness still depends on the unexecuted critical cases and deployment-specific checks; this report does not claim complete QA coverage.
