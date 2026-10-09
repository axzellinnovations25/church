"""Apply the October 2026 isolated QA run to the case table.

Each status is based on the full case oracle. Passing characterization tests can
correspond to a failed QA case when they reproduce a defect.
"""

from collections import Counter
from pathlib import Path
import re


ROOT = Path(__file__).parent
CASES = ROOT / "TEST_CASES.md"
EVIDENCE = {
    "backend": "`backend/tests/Feature/QaFindingVerificationTest.php`",
    "crud": "`backend/tests/Feature/QaCrudBoundaryTest.php`",
    "regression": "`backend/tests/Feature/AdminRegressionTest.php`",
    "public": "`backend/tests/Feature/PublicApiTest.php`",
    "browser": "`Frontend/tests/qaBrowserSmoke.mjs`",
    "browser_db": "`Frontend/tests/qaBrowserSmoke.mjs`; `backend/tests/qaBrowserDbCheck.php`",
}

# id: (status, observed result, evidence key, defect)
RESULTS = {
    "CNT-TC-009": ("Pass", "Future draft was hidden; a due-date read published it.", "backend", ""),
    "CNT-TC-003": ("Pass", "Draft and missing event detail/image URLs all returned 404.", "crud", ""),
    "CNT-TC-006": ("Pass", "Draft and missing news detail/image URLs all returned 404.", "crud", ""),
    "CNT-TC-011": ("Pass", "POST/PUT/DELETE on public events/news returned 404/405; no rows changed.", "crud", ""),
    "FRM-TC-001": ("Pass", "Contact form showed success; one normalized new row was found in isolated SQLite.", "browser_db", ""),
    "FRM-TC-002": ("Pass", "Blank browser form showed six errors; short, malformed and overlimit API inputs returned 422 with no rows.", "browser;backend", ""),
    "FRM-TC-009": ("Pass", "Repeated identical contact POSTs created distinct rows.", "backend", ""),
    "REG-TC-004": ("Pass", "Individual children were rejected; duplicate valid registration created two rows and fake mails. Duplicate policy remains open.", "public;backend", ""),
    "AUTH-TC-010": ("Pass", "Guest was redirected; wrong password left session unconfirmed; correct password set confirmation timestamp.", "crud", ""),
    "EVT-TC-004": ("Pass", "Overlap was rejected; adjacent, other weekday and case-insensitive location scenarios passed.", "regression", ""),
    "MASS-TC-003": ("Pass", "Recurring overlap was rejected; adjacent and different-weekday scenarios passed.", "regression", ""),
    "AREG-TC-004": ("Pass", "Missing ID returned 404; group role was denied list/detail/edit/update/delete.", "crud", ""),
    "MEM-TC-004": ("Pass", "Mismatched nested member returned 404; cross-group writes returned 403, with no mutation.", "crud", ""),
    "MSG-TC-002": ("Pass", "Valid status changes persisted and audited; invalid status returned 422.", "crud", ""),
    "ACC-TC-004": ("Pass", "Main account remained protected (403); missing IDs returned 404.", "crud", ""),
    "GRP-TC-005": ("Pass", "Missing group returned 404; cross-group/main-only restrictions returned 403; own read worked.", "crud", ""),
    "MASS-TC-004": ("Pass", "Edit/by-day worked; update persisted and draft disappeared publicly; missing IDs returned 404.", "crud", ""),
    "AUTH-TC-011": ("Pass", "API and Blade first-account signups remained ordinary users; admin access was denied and trusted CLI provisioning passed.", "backend", "D-001"),
    "NEWS-TC-003": ("Pass", "Future-published news remained hidden from list, detail and image endpoints; guest image GET returned 404.", "backend", "D-002"),
    "ADM-TC-004": ("Pass", "An ordinary self-registered user received 403 from admin endpoints and the dashboard redirected to the public home page.", "backend", "D-003"),
    "SEC-TC-004": ("Pass", "Injected newsletter DB failure preserved the old PDF/path and removed the staged replacement; successful replacement also passed.", "backend", "D-004"),
    "FRM-TC-008": ("Pass", "Both attendance answers persisted as is_member and were exposed in the admin message resource.", "backend", "D-005"),
    "FRM-TC-010": ("Pass", "The first five requests were accepted; seven further requests from the same IP returned 429 and only five rows persisted.", "backend", "D-006"),
    "GRP-TC-007": ("Pass", "Create and update names with a normalized slug collision returned field-level 422 without mutation.", "backend", "D-007"),
    "FRM-TC-011": ("Pass", "Arbitrary categories, inactive group targets and invalid category/group combinations returned 422 with no rows.", "backend", "D-008"),
    "OVR-TC-003": ("Pass", "Foreign, nonexistent and malformed overview keys returned 422 without changing preferences; an owned key remained usable.", "backend", "D-009"),
    "PUB-TC-002": ("Blocked", "Unknown path rendered an empty React root; expected 404 behavior has no agreed oracle.", "browser", ""),
}

PARTIAL = {
    "AUTH-TC-012": "Partial: backend unverified dashboard/overview access reproduced; React and post-verification steps remain.",
    "NWL-TC-003": "Partial: future draft hidden and due view served PDF; download behavior remains.",
    "GRP-TC-004": "Partial: delete cascaded members and nulled user/event/message group IDs; UI cancel and audit remain.",
    "SEC-TC-001": "Partial: guest/group role matrix passed for sampled main-only routes; unassigned and all verbs remain.",
    "SEC-TC-005": "Partial: 500 real news rows retrieved through 50 API pages; 500-row helper test passed; browser/all lists remain.",
    "CNT-TC-008": "Partial: future newsletter PDF view returned 404; published download/header checks remain.",
}


def evidence(keys):
    return "; ".join(EVIDENCE[key] for key in keys.split(";"))


text = CASES.read_text(encoding="utf-8")
text = re.sub(
    r"All cases are \*\*designed, not executed\*\*\..*?Treat any ambiguous expectation marked with a finding ID as a requirement question, not a pass criterion\.|^Execution date: 9 October 2026\. \*\*137 cases:[^\n]*$",
    "Execution date: 9 October 2026. **137 cases: 26 Pass, 0 Fail, 1 Blocked, 110 Not Run.** "
    "A status reflects the entire scenario against its expected result; partial checks remain Not Run. "
    "All database writes used disposable SQLite fixtures, synthetic data and fake mail. "
    "See `TEST_EXECUTION_REPORT.md` for commands, limitations and evidence. "
    "HTTP 422 denotes validation, 404 missing resources, and 401/403 denied JSON requests. "
    "Unresolved product rules are not treated as passing criteria.",
    text,
    count=1,
    flags=re.S | re.M,
)
lines = []
seen = set()
for line in text.splitlines():
    if line.startswith("| Test Case ID |"):
        line = "| Test Case ID | Module | Feature | Test Scenario | Test Type | Preconditions | Test Steps | Test Data | Expected Result | Priority | Actual Result | Status | Execution Evidence | Related Defect ID |"
    elif line.startswith("|---|"):
        line = "|" + "---|" * 14
    else:
        match = re.match(r"^\| ([A-Z]+-TC-\d+) \|", line)
        if match:
            case_id = match.group(1)
            if case_id in seen:
                raise ValueError(f"Duplicate case ID: {case_id}")
            seen.add(case_id)
            cells = [cell.strip() for cell in line.strip("|").split("|")]
            if len(cells) not in (12, 14):
                raise ValueError(f"Unexpected row shape for {case_id}: {len(cells)}")
            cells = cells[:12]
            if case_id in RESULTS:
                status, actual, source, defect = RESULTS[case_id]
                cells[10:12] = [actual, status]
                cells.extend([evidence(source), defect or "—"])
            else:
                cells[10:12] = [PARTIAL.get(case_id, "Not Executed"), "Not Run"]
                cells.extend(["See execution report" if case_id in PARTIAL else "—", "—"])
            line = "| " + " | ".join(cells) + " |"
    lines.append(line)

if len(seen) != 137 or set(RESULTS) - seen or set(PARTIAL) - seen:
    raise ValueError("Case inventory or result mapping mismatch")
counts = Counter(status for status, *_ in RESULTS.values())
counts["Not Run"] = len(seen) - len(RESULTS)
assert counts == {"Pass": 26, "Blocked": 1, "Not Run": 110}, counts
CASES.write_text("\n".join(lines) + "\n", encoding="utf-8")
print(dict(counts))
