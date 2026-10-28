# CaseTrack 360 — three-hour implementation scope

## Must-have (target: 3 hours total)
1. **Dataset reset and believable graph (35 min):** Replace the old demo institutions and cases with 30 real Indian institution names from across regions and 47 explicitly synthetic complaint records. Include repeat/near-duplicate themes, cross-bureau overlaps, all five statuses, all four priorities, due/overdue examples, and resolved/closed examples. Do not imply these fictional complaints are real allegations.
2. **Blank login email (5 min):** Remove the prefilled administrator email and disable browser autofill on the login fields.
3. **User profile (35 min):** Add a regular-user profile with name, email, region/state, and registered institution dropdown; persist fields in SQLite with a safe additive migration.
4. **Institution-specific graph scope (25 min):** Add an “All visible institutions / My institution only” filter for regular users. The second option uses the institution selected in the profile and filters the graph and its AI input data.
5. **Admin/user separation smoke check (25 min):** Users can create complaints, view eligible cases/status, and explore graphs. Admins manage/resolve cases and institutions; admins cannot create complaints. Confirm restrictions are enforced by backend routes, not only hidden UI.
6. **Reset/recovery instructions (15 min):** Add an explicit `reset-demo-data.bat` with confirmation; never erase user changes automatically at every startup.
7. **Validation (40 min):** Python syntax check, frontend production build where dependencies are available, API smoke tests, and manual login/profile/filter checks.

## Intentionally out of scope for this three-hour pass
- Live AICTE/UGC/AISHE registry integration or claims of official institution verification.
- Production identity management, deployment hardening, email notifications, and integrations with real institutional systems.
- Building a full workflow engine for transfers/escalations beyond what already exists.

## Test scenarios covered by synthetic cases
- Repeated reports for lab downtime and hostel water outages.
- Near-duplicate exam timetable and grant/scholarship queries.
- Same-category cases spanning different bureaus (possible cross-bureau coordination).
- Critical safety/accessibility/electrical concerns.
- Faculty reporting discrepancies and compliance documentation gaps.
- Student grievance delays, exam/result issues, IT portal errors, research procurement/server issues, water/drainage, accessibility, fees, library access, affiliation records.
- Open, In Progress, Pending, Resolved, and Closed statuses; past and future due dates.

## Data caveat
Institution names refer to real Indian educational institutions; complaint titles/descriptions/statuses/dates/priority/frequency are fictional and exist only to exercise the prototype. They must not be represented as actual complaints against these institutions.
