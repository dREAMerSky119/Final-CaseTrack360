# CaseTrack 360 — Full-stack prototype

CaseTrack 360 is a local AICTE complaint-intelligence prototype with a React/Vite frontend and a Flask + SQLite API. All included records are synthetic; this is not connected to live AICTE systems.

## Features included

- Persistent institutions and complaint records in SQLite.
- Session-based prototype login and logout; the login form takes a display name.
- Complaint create/read/update, input validation, search/filter API support, and stable IDs.
- Separate manual priority and frequency classification.
- Rule-based recurring issue flags using institution/category and the previous 90 days.
- Potential related-case suggestions based on shared institution/category/keywords. Records are never auto-merged or deleted; suggestions remain reviewable.
- Case history and audit logs for key changes, related-case review, login/logout, and institution creation.
- Institution directory and complaint counts.
- Optional inter-bureau handover request endpoint.
- Analytics endpoint for summary counts.


## Expanded synthetic stress-test dataset

The bundled demonstration dataset contains **30 Indian institutions and 347 synthetic complaint records**. It deliberately covers:
- Exact duplicates and near-duplicates, including repeated submissions at the same institution.
- Similar issue clusters across institutions.
- All supported priority levels and statuses, including resolved and closed cases.
- Overdue, due-soon, future-due, and older historical records.
- Infrastructure, examination, faculty, student grievance, institutional compliance, accessibility, IT, procurement, scholarship, hostel, and other scenarios.
- Sparse-detail submissions and cases that should be reviewed rather than automatically merged.

These records are fictional scenarios associated with real Indian institution names. They are **not factual allegations** about those institutions and are not live AICTE records.

To replace the current local demo records with the expanded dataset, open a terminal in the project root and run:

```powershell
cd backend
python -m flask --app app reset-demo-data
```

Confirm the prompt only if you want to replace the current local demo institutions, complaints, and related case history. This operation deletes the current demo complaint/institution data and reloads the synthetic seed dataset. Back up `backend/instance/casetrack.db` first if you want to preserve anything.

## Requirements

- Windows: Node.js 18+ (Node.js 20+ recommended) and Python 3.10+
- Internet access on first launch to install dependencies; internet access is also required for Groq AI requests.

## Quick start on Windows

1. Extract the project ZIP.
2. Double-click `run.bat` from the extracted project folder.
3. The launcher checks for the actual Vite executable (not just the presence of `node_modules`), installs frontend dependencies if they are missing/incomplete, creates a Python virtual environment, installs backend dependencies, and opens backend and frontend in separate terminal windows.
4. Open `http://localhost:5173` in your browser. Keep both terminal windows open.
5. The first run creates `.env` from `.env.example`. To enable AI triage, add your Groq API key to `GROQ_API_KEY` in the root `.env` file, then close and relaunch the backend window (or rerun `run.bat`).

The launcher is for local development/demo use. Do not expose this prototype to the public internet or enter sensitive real complaint information.

## Start the backend (PowerShell / Windows)

Open a terminal in the project root, then:

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
python app.py
```

The first start creates `backend/instance/casetrack.db` and seeds five synthetic institutions and ten synthetic complaints when the database is empty. Keep this terminal open. API health check: `http://127.0.0.1:5000/api/health`.

If PowerShell blocks activation, run this in the same terminal and retry activation:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

## Start the frontend

Open a second terminal in the project root (the folder containing `package.json`):

```powershell
Copy-Item .env.example .env
npm install
npm run dev
```

`.env.example` sets `VITE_DEMO_MODE=false` and `VITE_API_BASE_URL=/api`. Vite proxies `/api` to Flask on port 5000, which keeps session cookies working across local frontend requests. Restart Vite after changing `.env`. Open the URL Vite prints, usually `http://localhost:5173`.

Login accepts a valid email, any non-empty password, and a display name for this prototype. This is intentionally convenient prototype authentication, **not production-grade authentication**. Do not use real passwords or sensitive complaint data.

## AI-assisted triage

The complaint registration form includes an optional AI-assisted triage action. It sends the complaint title and description to Groq and returns suggested category, priority, bureau/cell, a short summary, rationale, and review steps. The user must explicitly apply suggestions; AI does not submit or adjudicate a complaint. The backend validates returned categories and priorities and does not send the API key to the browser.

To enable it:

1. Create a Groq API key in the Groq developer console.
2. Put it in the project-root `.env` as `GROQ_API_KEY=your_key_here` (do not commit this file).
3. Optionally change `GROQ_MODEL`; the default is `llama-3.3-70b-versatile`.
4. Restart Flask. Check `http://127.0.0.1:5000/api/health`; `ai_configured` should be `true` when the key is loaded.

Without a key, the rest of CaseTrack 360 continues to work, but the AI triage action reports that configuration is required. AI output is advisory and must be reviewed by an authorised person. Do not submit personal, confidential, or sensitive complaint data to a third-party AI provider unless you have permission and an approved data-handling basis.

## API endpoints

- `GET /api/health` (also reports whether AI is configured)
- `POST /api/ai/triage` (authenticated Groq-backed triage suggestions)
- `POST /api/auth/login` with `{ "email", "password", "displayName" }`
- `GET /api/auth/me`, `POST /api/auth/logout`
- `GET /api/complaints` (supports `q`, `status`, `priority`, `frequency`, `bureau`, `category`, `institutionId`)
- `GET /api/complaints/:id`, `POST /api/complaints`, `PATCH /api/complaints/:id`
- `GET /api/complaints/:id/history`
- `GET /api/institutions`, `POST /api/institutions`
- `GET /api/related-cases`, `POST /api/related-cases/:id/review`
- `GET /api/analytics`, `GET /api/audit-logs`
- `POST /api/complaints/:id/handovers`

All data endpoints except health and login/logout require a session. The frontend sends cookies with `credentials: include`; Flask CORS is configured for Vite on ports 5173.

## Data and safety notes

- The database is local at `backend/instance/casetrack.db`. Back it up before deleting or replacing it.
- Delete that database file only if you intentionally want to reset the prototype to its seeded synthetic data; stop Flask first.
- The demo identity/login must be replaced by proper password hashing, account provisioning, CSRF protections, secure cookie configuration, and organisation-approved identity integration before deployment.
- Server-side role-based permissions are not yet a complete multi-role authorization policy. This build is suitable for local demonstration and development, not production use with real complaint data.
- Frequency and related-case rules are heuristics. Officials must review suggestions; the system does not automatically merge cases or assign official determinations.

## Project layout

```text
CaseTrack360/
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   └── run.ps1
├── run.bat
├── .env.example
├── src/
├── .env.example
├── package.json
└── README.md
```

## Global search and AI assistant

- Use the search control in the top bar (or press `Ctrl+K` / `⌘K`) to search complaint IDs, titles, descriptions, categories, bureaus, and institution records. Select a result to open its case or filter the institution directory.
- The floating **Ask AI** assistant is available inside the workspace. It uses the Flask `/api/ai/chat` endpoint and the configured Groq model. Set `GROQ_API_KEY` in the project-root `.env` and restart the backend to enable live responses.
- The AI assistant is decision support, not an official AICTE service. Do not enter confidential or sensitive personal information, and verify important recommendations.
- The login screen has separate User and Administrator choices. In this prototype, a new account can be created as a User; an Administrator choice requires an existing administrator account. This is still a prototype authentication flow and must be replaced with institution-approved identity management before production deployment.


## Recent UI and stability updates

- The Relationships view uses priority colours (critical/high/medium/low) and node size to indicate frequency (first reported/recurring/repeated pattern).
- Related-case entries no longer show the “Potential” badge. The page includes a safe empty state and a React error boundary around the graph.
- The “Need a hand?” sidebar card has been removed.
- Global search supports complaint and institution lookup in real-backend mode.
- The chatbot reports more actionable errors for Groq authentication, rate limits, and invalid model configuration. Check the Flask terminal for provider details; it does not log the API key.
- `run.bat` stops if dependency installation fails and checks for `node_modules\\.bin\\vite.cmd` before launching Vite.

These updates still require a local end-to-end test on Windows. The bundled records are synthetic and the prototype is not connected to live AICTE systems.

## Recent AI and relationship-map enhancements

- The AI assistant renders headings, bullet lists, inline emphasis, and Markdown-style tables in a readable chat layout.
- The Relationships page includes an **AI analyse graph** action. In real-backend mode it sends a bounded snapshot of related complaint metadata (IDs, titles, institution, category, bureau, priority, frequency, status, and related flag) to the Flask `/api/ai/graph-analysis` endpoint, which forwards that data to Groq. This sends graph *data*, not a screenshot of the rendered graph. Do not include sensitive personal information in complaint titles or descriptions unless your organisation permits sending it to the configured AI provider.
- The graph canvas can be scrolled horizontally and has a minimum zoom level to prevent zooming out indefinitely. Use the horizontal scrollbar to inspect larger graphs.
- Graph AI analysis requires `VITE_DEMO_MODE=false`, a working Flask backend, and valid `GROQ_API_KEY` / `GROQ_MODEL` settings in the project-root `.env` file.


## Recent access and triage behaviour
- Regular users do not receive closed or overdue cases from the complaint-list API; direct case access is also restricted. Administrators retain access.
- New complaint priority is derived server-side from the description using a transparent keyword fallback. The user form no longer offers a manual priority selector; AI triage can provide a suggested priority. This heuristic is a prototype and should be reviewed by an authorised official.
- The unsupported attention score has been removed from API responses and complaint-list UI; the legacy database column is retained only to avoid a destructive migration and is no longer calculated or displayed.
- AI graph analysis should be presented as compact findings/cards and actionable follow-up prompts rather than a long report.


## Administrator account setup

The administrator login is intentionally separate from regular user accounts. From a terminal, change into the `backend` folder and run:

```bat
python -m flask --app app create-admin
```

Enter the administrator email, display name, and password when prompted. Use that exact email and password with **Login as Administrator**. Existing administrator records created by older prototype versions must be configured with this command before they can sign in. Passwords are stored as salted hashes.

Regular users can register and track complaints, view their status/progress, and explore the relationship graph. Only administrators can edit status or priority, add internal notes, delete cases, access overdue/closed records, view analytics/alerts/audit logs, and download institution-wise complaint summary CSV files. The chatbot receives a bounded snapshot of recent complaint updates and recent audit events so it can answer questions about recent workspace activity; it is not connected to live AICTE systems or external event feeds.

## Latest improvements: institution reports and role-specific actions

- Regular users can register complaints and select an institution from the registered directory dropdown.
- Administrator accounts cannot register complaints; they manage and resolve existing cases and maintain the institution directory.
- Administrators can run AI-assisted institution plausibility checks before adding an institution. This is a model-knowledge check, **not** an official registry lookup or proof of accreditation/recognition; verify against an official source before relying on it.
- Institution cards offer AI-generated concise deductions and a downloadable colourful HTML visual report with status/priority statistics and the generated findings.
- AI verification and institution analysis require real-backend mode (`VITE_DEMO_MODE=false`) and `GROQ_API_KEY` configured in the project-root `.env`.


## Latest prototype dataset and profile updates
- The seed dataset now contains 30 named Indian institutions and 47 fictional demonstration complaints. The complaints are synthetic test records, not factual allegations.
- To replace an existing local SQLite dataset, run `reset-demo-data.bat` and type `RESET` when prompted. This deletes current demo complaints/institutions and related history. It does not run automatically on every startup.
- Regular users can maintain name, email, region/state and affiliated institution under **My profile**. The relationship graph includes an institution-only filter based on this profile.
- The login email field is blank by default; the prefilled demo administrator email has been removed.
- A short, time-boxed implementation scope and test cases are in `REQUIREMENTS-3-HOUR-SCOPE.md`.
- CSVs documenting the seed data are in `data/`.


## Latest prototype dataset and profile updates
- The seed dataset now contains 30 named Indian institutions and 47 fictional demonstration complaints. The complaints are synthetic test records, not factual allegations.
- To replace an existing local SQLite dataset, run `reset-demo-data.bat` and type `RESET` when prompted. This deletes current demo complaints/institutions and related history. It does not run automatically on every startup.
- Regular users can maintain name, email, region/state and affiliated institution under **My profile**. The relationship graph includes an institution-only filter based on this profile.
- The login email field is blank by default; the prefilled demo administrator email has been removed.
- A short, time-boxed implementation scope and test cases are in `REQUIREMENTS-3-HOUR-SCOPE.md`.
- CSVs documenting the seed data are in `data/`.


## Google sign-in and administrator notifications

Google sign-in uses Google Identity Services. Create an OAuth 2.0 **Web application** client in Google Cloud Console and configure the authorised JavaScript origin for your local Vite URL (for example `http://localhost:5173` and/or `http://127.0.0.1:5173`). Set the same client ID in the project-root `.env` as both `GOOGLE_CLIENT_ID` (Flask token audience verification) and `VITE_GOOGLE_CLIENT_ID` (Vite Google button). Restart both Flask and Vite after changing environment variables. Google sign-in is unavailable until these credentials are configured. Do not commit secrets or client credentials to a public repository.

The administrator bell shows High and Critical complaint notifications only. The notification endpoint is protected by administrator authorization. The prototype allows the same email identity to choose User or Administrator at sign-in, as requested; before any shared or production deployment, restrict Administrator workspace selection to a trusted allowlist or an approval workflow.


## UI and intelligence updates
- The relationship screen uses a zoomable geographic issue map with red unresolved-issue markers; institution names become visible as the map is zoomed in. Map tiles require an internet connection and use OpenStreetMap. Institutions without a recognized city coordinate are not plotted until a location is added.
- The notification bell opens the full Alerts page instead of a dropdown.
- AI complaint triage now requests 3–6 contextual tags alongside category, priority, bureau, summary, rationale and review steps. Tags are AI suggestions and should be reviewed by staff.
- Groq configuration is loaded from the project-root `.env`, with an optional `backend/.env` fallback. Keep the secret server-side; never put `GROQ_API_KEY` in a `VITE_` variable.
- Install updated frontend dependencies with `npm install` before running `npm run build`.
