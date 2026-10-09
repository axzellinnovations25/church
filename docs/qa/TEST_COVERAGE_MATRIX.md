# Test coverage matrix

**Updated:** 9 October 2026

**Executed disposition:** **64 Pass, 4 Failed, 1 Blocked, 68 Not Run** out of 137 documented cases.

Batch 1 evidence and exact per-case outcomes are tracked in `docs/qa/QA_EXECUTION_PROGRESS.md`. The documented totals remain unchanged because none of the first 15 cases had complete acceptance-oracle evidence.

| Area | Case range | Automated evidence | Current coverage |
|---|---|---|---|
| Public navigation and static pages | PUB-TC-001–007 | `Frontend/tests/qaBrowserSmoke.mjs` | All 39 known public routes rendered locally. Unknown-route behavior is Blocked by its missing oracle; mobile navigation and link-detail cases remain Not Run. |
| Public content APIs | CNT-TC-001–012 | `PublicApiTest`, `QaCrudBoundaryTest`, `QaFindingVerificationTest`, `DocumentedQaExecutionTest`, `DocumentedContentSecurityTest` | Six cases Pass, including publication boundaries and unauthorized writes; six UI/error/download scenarios remain Not Run. |
| Public forms | FRM-TC-001–011 | Browser smoke, DB checker, `QaFindingVerificationTest` | Six cases Pass for contact persistence, validation, repeat behavior, throttling, and routing; five complete scenarios remain Not Run. |
| Parish registration | REG-TC-001–006 | `PublicApiTest`, `QaFindingVerificationTest`, `DocumentedQaExecutionTest` | Four Pass, REG-TC-001 fails its HTTP 201 contract as D-010, and one browser/mail-fault case remains Not Run. |
| Authentication | AUTH-TC-001–012 | Existing auth tests, `QaCrudBoundaryTest`, `QaFindingVerificationTest`, `AdminProvisioningTest`, `DocumentedQaExecutionTest`, browser smoke | Eight cases Pass across signup, login/logout, throttling, recovery/reset, confirmation, and safe bootstrap; four browser/policy cases remain Not Run. |
| Admin shell/overview/profile | ADM, OVR, PRO | `AdminRegressionTest`, `QaFindingVerificationTest`, `DocumentedQaExecutionTest`, frontend role test, browser smoke | Seven cases Pass, including ordinary-user denial, overview scope, and profile validation; five UI-oriented cases remain Not Run. |
| Event and Mass CRUD | EVT, MASS | `AdminRegressionTest`, `QaCrudBoundaryTest`, `DocumentedAuthorizationMatrixTest`, `DocumentedValidationTest` | Five cases Pass for clash rules, draft boundaries, and access checks; ten complete UI/CRUD cases remain Not Run. |
| News and newsletters | NEWS, NWL | `QaFindingVerificationTest`, `NewsletterTest`, `DocumentedContentSecurityTest`, `DocumentedValidationTest` | Eight cases Pass for future-media protection, publication, file lifecycle, headers, ordering, and validation; six remain Not Run. |
| Gallery and council | GAL, COU | `DocumentedContentSecurityTest`, `DocumentedValidationTest`, existing backend tests | Four cases Pass for public ordering, duplicate rules, and validation; eight complete CRUD/UI cases remain Not Run. |
| Registrations/messages/groups/members/accounts | AREG, MSG, GRP, MEM, ACC | `QaCrudBoundaryTest`, `QaFindingVerificationTest`, `DocumentedAuthorizationMatrixTest`, `DocumentedValidationTest` | Eight cases Pass across authorization, relationships, duplicate handling, and scope. ACC-TC-002 fails as D-011; 22 cases remain Not Run. |
| General security/performance | SEC-TC-001–005 | `DocumentedAuthorizationMatrixTest`, `DocumentedContentSecurityTest`, existing security tests, frontend pagination tests | Three cases Pass for complete tested role matrix, private media, and newsletter atomicity. XSS/CSRF and broader scale testing remain Not Run. |

## Defect regression mapping

| Defect | Cases | Regression | Result |
|---|---|---|---|
| D-001 | AUTH-TC-011 | API/Blade first signup plus `AdminProvisioningTest` | Resolved / Pass |
| D-002 | NEWS-TC-003, SEC-TC-003 | Future post image authorization | Resolved / Pass |
| D-003 | ADM-TC-004, OVR-TC-001, SEC-TC-001 | Backend admin middleware, full role matrix, frontend role helper, browser redirect | Resolved / Pass |
| D-004 | NWL-TC-004, SEC-TC-004 | Failed and successful newsletter replacement | Resolved / Pass |
| D-005 | FRM-TC-008 | Attendance persistence, admin resource, browser DB row | Resolved / Pass |
| D-006 | FRM-TC-010 | Twelve-request fixed-IP burst | Resolved / Pass |
| D-007 | GRP-TC-007 | Create/update normalized collision | Resolved / Pass |
| D-008 | FRM-TC-011 | Category, active group, and relationship validation | Resolved / Pass |
| D-009 | OVR-TC-003 | Foreign/nonexistent/malformed key and owned-key control | Resolved / Pass |
| D-010 | REG-TC-001 | Documented individual registration contract | **Open / Fail: HTTP 200 instead of 201** |
| D-011 | ACC-TC-002 | Case-variant duplicate account email | **Open / Fail: HTTP 500 instead of 422** |

## Evidence files

| Evidence key | File |
|---|---|
| Documented workflow execution | `backend/tests/Feature/DocumentedQaExecutionTest.php` |
| Content and media security | `backend/tests/Feature/DocumentedContentSecurityTest.php` |
| Authorization matrix | `backend/tests/Feature/DocumentedAuthorizationMatrixTest.php` |
| Validation and atomicity | `backend/tests/Feature/DocumentedValidationTest.php` |
| Browser execution | `Frontend/tests/qaBrowserSmoke.mjs` |
| Browser DB verification | `backend/tests/qaBrowserDbCheck.php` |
| Per-case disposition | `docs/qa/TEST_CASES.md` |

## Coverage limits

- The 75 Not Run cases retain that status. Passing suites or partial checks do not promote a documented case without its full oracle.
- One case remains Blocked because expected unknown-route behavior has not been defined.
- Browser coverage does not include every CRUD workflow, viewport, accessibility interaction, loading/error path, cancellation path, or stored-input rendering case.
- Deployment services and configuration were not exercised: PostgreSQL/Supabase, SMTP, reverse proxy, production cookies/CORS, filesystem permissions, and hosted logs.
- Product decisions remain open for duplicate parish registration, newsletter preference/delivery, group deletion retention, unknown routes, and email-verification gating.

### Batch 1 browser evidence (9 October 2026)

The 11 requested IDs were exercised with Chromium in `batch1-remaining.spec.mjs`: 11/11 test functions passed. They remain Not Run in the acceptance ledger until their remaining fixture-backed, persistence, ordering, download, and admin-oracle assertions are completed. CNT-TC-004 and CNT-TC-012 were rerun separately in the same file and failed on D-013's missing detail back links. No production code was changed.

### Targeted verification evidence

PUB-TC-006, PUB-TC-007, and FRM-TC-003 each have strengthened Playwright assertions and passed targeted Chromium execution. They remain Not Run pending real disposable SQLite persistence and, for FRM-TC-003, authorized admin inbox verification.

### Shared SQLite integration status

Real fixture seeding and direct local API verification were completed. Browser integration remains blocked by the Vite/API environment mismatch; no documented case was marked Passed.

### Real integration result

PUB-TC-006 and PUB-TC-007 have browser, API, and fixture evidence. FRM-TC-003 has browser, API, and SQLite evidence; admin-side verification remains outstanding.



### Final targeted completion

FRM-TC-003 now has browser, API, SQLite, admin inbox, reload, and unauthorized-access evidence. PUB-TC-006 direct Laravel protection returned 404.
