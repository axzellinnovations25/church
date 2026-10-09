# Security verification

**Date:** 9 October 2026  
**Environment:** isolated SQLite, synthetic identities/content, fake mail and localhost browser services.

| Control | Verification | Result |
|---|---|---|
| First-account privilege | API and Blade signup against empty databases; identity and main-only endpoint checks; trusted CLI provisioning | **Pass.** Public accounts remain non-admin. Main administration can be provisioned only through the explicit CLI path. D-001 resolved. |
| Ordinary account admin access | Ordinary signup followed by all sampled `/admin` endpoints, backend `/dashboard`, React dashboard and direct main-only route | **Pass.** Backend returns 403 and React redirects to `/`; legitimate main and group-admin tests remain green. D-003 resolved. |
| Future news media | Future published news list, detail and image as guest; main-admin access | **Pass.** Guest receives 404 for the image while authorized main preview remains available. D-002 resolved. |
| Admin scope and IDOR | Full documented main-only route matrix plus cross-group event, member, contact and registration tests; overview foreign/nonexistent/malformed keys | **Pass for executed scope.** Guest requests receive 401, unassigned/group-limited users receive 403 from main-only operations, owned group operations remain available, and foreign overview writes return 422. D-009 resolved. |
| Anonymous contact abuse | Twelve rapid valid posts from one synthetic IP | **Pass.** Five accepted, seven throttled with 429 and five rows stored. D-006 resolved. |
| Contact routing validation | Arbitrary category, inactive group and inconsistent category/group combinations | **Pass.** Invalid requests return 422 and create no rows. D-008 resolved. |
| Contact data integrity | Both attendance choices through API/resource and one local browser submission | **Pass.** Values persist and are visible to admin users. D-005 resolved. |
| Slug collision handling | Create and update collisions after normalization | **Pass.** Field-level 422, no duplicate/mutation and no server error. D-007 resolved. |
| File update integrity | Injected DB failure during newsletter PDF replacement plus successful replacement | **Pass for newsletter scope.** Old file/path survive failure, staged file is cleaned and successful replacement works. D-004 resolved. |
| Authentication regression | Login, logout, throttling, confirmation, recovery/reset, profile and authorization tests | **Pass for these controls.** The final backend suite has two unrelated documented-contract/validation failures, D-010 and D-011. |
| Frontend role guard | Unit role matrix and local browser ordinary-user dashboard navigation | **Pass.** Only main or group-assigned accounts qualify for the admin shell. |

## Hosted-backend safety investigation

The frontend's default configured API host is `https://church-2m8b.onrender.com`. The earlier browser submission attempt occurred before QA mode was locked to localhost and ended in a network error. The local Laravel log has no matching synthetic browser address. Hosted application logs and hosted database access were not available, so the absence of a remote write cannot be proven from this workspace. No follow-up hosted request was made. All verified browser writes used `Frontend/.env.qa`, localhost and disposable SQLite.

The browser runner now clears cookies and all origin storage before its guest assertions. The direct database checker accepts only an explicitly named isolated QA directory. This execution made no Supabase or PostgreSQL connection and does not establish parity with either service.

## Remaining security coverage

- Full CSRF, stored/reflected XSS and SQL-looking-input browser matrices remain Not Run.
- The documented main-only route matrix was exercised for guest, unassigned, group-admin, and main-admin roles. Exhaustive identifier permutations and every group-owned mutation remain incomplete.
- Signup and parish-registration rate policies are not defined or verified.
- Email verification policy remains unresolved because the user model does not implement Laravel's verification contract.
- Proxy/IP behavior, trusted proxy configuration, production storage permissions, CORS, cookies, SMTP and PostgreSQL behavior require deployment-environment validation.

D-001 through D-009 remain resolved. D-011 is a newly confirmed validation and availability risk because a case-variant duplicate account email produces HTTP 500; D-010 is a creation-status contract defect. The 75 unexecuted documented cases, including two general-security cases, prevent a claim of complete security verification or release readiness.
