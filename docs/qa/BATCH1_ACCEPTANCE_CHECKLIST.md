# Batch 1 acceptance checklist

This checklist compares the documented acceptance criteria with the current Playwright assertions. A browser test passing its current assertions is not treated as a documented-case Pass when criteria remain missing.

| Case | Acceptance conditions from TEST_CASES.md | Current Playwright evidence | Missing criteria |
|---|---|---|---|
| PUB-TC-003 | Three hero slides change; Mass/news/gallery cards show seeded records and correct links | Home renders and available slide controls are clicked | Deterministic three-slide fixture, before/after slide assertion, card content and destination assertions |
| PUB-TC-004 | All information routes render; phone/email/external links and subject-prefill work | Public routes render | Every CTA target, external target, and subject query assertion |
| PUB-TC-005 | Two images; correct caption; previous/next wrap; button/backdrop close | First image opens a detected overlay | Two seeded images, captions, wraparound controls, both close mechanisms |
| PUB-TC-006 | Active-only records; inactive image 404; API failure bundled fallback | API failure route is intercepted and gallery renders | Real active/inactive fixtures, direct inactive-image 404, identifiable fallback assertion |
| PUB-TC-007 | Active group card/join slug; empty response fallback and contact CTA | Empty groups response is intercepted and page renders | Active seeded group, join destination, fallback card and CTA assertions |
| CNT-TC-001 | Published-only API/UI; All/Cathedral/Coedpoeth filters; mass-sacraments equivalence | Mass-times page renders | Seeded published/draft rows, API payload, tab filtering counts, equivalent route assertion |
| CNT-TC-002 | Future/past ordering; published-only; detail/image match | Events page renders | Seeded dates/statuses, ordering, detail fields, image response, draft exclusion |
| CNT-TC-004 | Delayed loading; visible error/empty state; missing detail has no stale content | Delayed 500 route is intercepted and page renders | Loading indicator, error text, empty state, missing-detail navigation |
| CNT-TC-005 | Published news/announcement type, content, image; draft excluded | News page renders | Seeded posts, type/content/date/image assertions, draft exclusion and detail links |
| CNT-TC-007 | Latest newsletter; archive title/year filtering; correct open/download URLs | Archive page renders | Seeded PDFs, latest identity, search/year filtering, response headers and downloaded bytes |
| CNT-TC-012 | Empty/loading/500 states; nonexistent detail back navigation; no false article | 500 route is intercepted and page renders | Empty response, loading indicator, error text, detail back link and false-content exclusion |
| FRM-TC-003 | Subject prefill; group selection; successful group_join routing/persistence | Subject query is asserted | Active group fixture, UI selection, real POST, SQLite row category/group verification |
| FRM-TC-004 | Missing/nonexistent group 422; escaped script/SQL input; no side effects | Contact page renders | Browser invalid submissions, field errors, escaped admin rendering, DB side-effect check |
| FRM-TC-005 | 500/network error; no false success; reset; successful retry | Forced 500 route and form filling are exercised | Error feedback assertion, retained/cleared values, reset assertion, network failure, real successful retry and persistence |

## Current conclusion

PUB-TC-001 is fully verified. The remaining 14 cases have executable browser coverage and were run, but the missing criteria above prevent promotion to Passed until deterministic fixtures and the listed assertions are added.
