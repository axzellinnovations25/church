# Test coverage matrix

**Updated:** 9 October 2026  
**Executed disposition:** 26 Pass, 0 Fail, 1 Blocked, 110 Not Run out of 137 cases.

| Area | Case range | Automated evidence | Current coverage |
|---|---|---|---|
| Public navigation and static pages | PUB-TC-001–007 | `Frontend/tests/qaBrowserSmoke.mjs` | Route rendering sampled; unknown route blocked by missing oracle; mobile navigation and full link checks Not Run. |
| Public content APIs | CNT-TC-001–012 | `PublicApiTest`, `QaCrudBoundaryTest`, `QaFindingVerificationTest` | Draft/missing event/news boundaries, future publication and public write denial covered; remaining UI/error/download scenarios Not Run. |
| Public forms | FRM-TC-001–011 | Browser smoke, DB checker, `QaFindingVerificationTest` | Contact success, validation, attendance persistence, repeat behavior, throttling and routing rules covered; group join and further browser combinations Not Run. |
| Parish registration | REG-TC-001–006 | `PublicApiTest`, `QaFindingVerificationTest` | Invalid child association and duplicate behavior sampled; full positive, family, mail-failure and browser flows Not Run. |
| Authentication | AUTH-TC-001–012 | Existing auth tests, `QaCrudBoundaryTest`, `QaFindingVerificationTest`, `AdminProvisioningTest`, browser smoke | Confirmation and safe first-account bootstrap covered; broader login/reset/verification/browser matrix Not Run. |
| Admin shell/overview/profile | ADM, OVR, PRO | `AdminRegressionTest`, `QaFindingVerificationTest`, frontend role test, browser smoke | Ordinary-user denial and overview key scope covered; full menus, alerts, profile and logout UI Not Run. |
| Event and Mass CRUD | EVT, MASS | `AdminRegressionTest`, `QaCrudBoundaryTest` | Clash rules, Mass edit/public draft boundary and representative cross-group checks covered; full browser CRUD Not Run. |
| News and newsletters | NEWS, NWL, SEC-TC-004 | `QaFindingVerificationTest`, `NewsletterTest` | Future-news image access and newsletter replacement atomicity covered; full CRUD, headers, filtering and other fault paths Not Run. |
| Gallery and council | GAL, COU | Existing backend tests | Existing suite passes; none of their complete QA cases was promoted to Pass. |
| Registrations/messages/groups/members/accounts | AREG, MSG, GRP, MEM, ACC | `QaCrudBoundaryTest`, `QaFindingVerificationTest`, existing backend tests | Representative missing-ID, role, status, normalized-slug and nested-scope boundaries covered; most UI/CRUD scenarios Not Run. |
| General security/performance | SEC-TC-001–005 | Backend authorization tests and frontend pagination tests | Newsletter atomicity passed; partial role matrix and 500-news-row aggregation remain Not Run because full cases were not executed. |

## Defect regression mapping

| Defect | Cases | Regression | Result |
|---|---|---|---|
| D-001 | AUTH-TC-011 | API/Blade first signup plus `AdminProvisioningTest` | Resolved / Pass |
| D-002 | NEWS-TC-003 | Future post image authorization | Resolved / Pass |
| D-003 | ADM-TC-004 | Backend admin middleware, frontend role helper and browser redirect | Resolved / Pass |
| D-004 | SEC-TC-004 | Failed and successful newsletter replacement | Resolved / Pass |
| D-005 | FRM-TC-008 | Yes/no persistence, admin resource and browser DB row | Resolved / Pass |
| D-006 | FRM-TC-010 | Twelve-request fixed-IP burst | Resolved / Pass |
| D-007 | GRP-TC-007 | Create/update normalized collision | Resolved / Pass |
| D-008 | FRM-TC-011 | Category, active group and relationship validation | Resolved / Pass |
| D-009 | OVR-TC-003 | Foreign/nonexistent/malformed key and owned-key control | Resolved / Pass |

## Coverage limits

- The 110 Not Run statuses were preserved. Partial checks and green full suites do not promote a QA scenario without its full oracle.
- One case remains Blocked because expected unknown-route behavior has not been defined.
- Browser coverage does not yet include every CRUD workflow, viewport, accessibility interaction, loading/error path or stored-input rendering case.
- Deployment services and configuration were not exercised: PostgreSQL, SMTP, reverse proxy, production cookies/CORS, filesystem permissions and hosted logs.
- Product decisions remain open for duplicate parish registration, newsletter preference/delivery, group deletion retention, unknown routes and email-verification gating.
