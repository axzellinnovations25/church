# Security verification

**Date:** 9 October 2026  
**Environment:** isolated SQLite, synthetic identities/content, fake mail and localhost browser services.

| Control | Verification | Result |
|---|---|---|
| First-account privilege | API and Blade signup against empty databases; identity and main-only endpoint checks; trusted CLI provisioning | **Pass.** Public accounts remain non-admin. Main administration can be provisioned only through the explicit CLI path. D-001 resolved. |
| Ordinary account admin access | Ordinary signup followed by all sampled `/admin` endpoints, backend `/dashboard`, React dashboard and direct main-only route | **Pass.** Backend returns 403 and React redirects to `/`; legitimate main and group-admin tests remain green. D-003 resolved. |
| Future news media | Future published news list, detail and image as guest; main-admin access | **Pass.** Guest receives 404 for the image while authorized main preview remains available. D-002 resolved. |
| Admin scope and IDOR | Existing cross-group event, member, contact and registration tests; overview foreign/nonexistent/malformed keys | **Pass for executed scope.** Foreign overview writes return 422 and do not alter preferences. D-009 resolved. |
| Anonymous contact abuse | Twelve rapid valid posts from one synthetic IP | **Pass.** Five accepted, seven throttled with 429 and five rows stored. D-006 resolved. |
| Contact routing validation | Arbitrary category, inactive group and inconsistent category/group combinations | **Pass.** Invalid requests return 422 and create no rows. D-008 resolved. |
| Contact data integrity | Both attendance choices through API/resource and one local browser submission | **Pass.** Values persist and are visible to admin users. D-005 resolved. |
| Slug collision handling | Create and update collisions after normalization | **Pass.** Field-level 422, no duplicate/mutation and no server error. D-007 resolved. |
| File update integrity | Injected DB failure during newsletter PDF replacement plus successful replacement | **Pass for newsletter scope.** Old file/path survive failure, staged file is cleaned and successful replacement works. D-004 resolved. |
| Authentication regression | Existing login, confirmation, reset, profile and authorization tests | **Pass.** Full backend suite remained green. |
| Frontend role guard | Unit role matrix and local browser ordinary-user dashboard navigation | **Pass.** Only main or group-assigned accounts qualify for the admin shell. |

## Hosted-backend safety investigation

The frontend's default configured API host is `https://church-2m8b.onrender.com`. The earlier browser submission attempt occurred before QA mode was locked to localhost and ended in a network error. The local Laravel log has no matching synthetic browser address. Hosted application logs and hosted database access were not available, so the absence of a remote write cannot be proven from this workspace. No follow-up hosted request was made. All verified browser writes used `Frontend/.env.qa`, localhost and disposable SQLite.

## Remaining security coverage

- Full CSRF, stored/reflected XSS and SQL-looking-input browser matrices remain Not Run.
- Every verb and identifier across every role has not been exhausted; current automated tests cover the affected endpoints and representative cross-group CRUD boundaries.
- Signup and parish-registration rate policies are not defined or verified.
- Email verification policy remains unresolved because the user model does not implement Laravel's verification contract.
- Proxy/IP behavior, trusted proxy configuration, production storage permissions, CORS, cookies, SMTP and PostgreSQL behavior require deployment-environment validation.

The nine confirmed defects have no remaining release blocker. The unexecuted critical security cases still prevent a claim of complete security verification.
