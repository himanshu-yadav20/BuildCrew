# BuildCrew

BuildCrew is a full-stack student-first professional network focused on hackathon teams, skill credibility, and technical collaboration.

## Folder Structure

```text
BuildCrew/
  index.html
  package.json
  README.md
  src/
    app.js
    styles.css
  backend/
    api.js
    auth.js
    database.js
    http.js
    seed.js
  data/
    db.json
```

## Setup

Run the Node backend and frontend server:

```bash
npm run serve
```

The app will be available at `http://localhost:4173`.

The backend exposes REST APIs under `/api/*` and stores local development data in `data/db.json`. Delete that file to reset the local database from seed data.

## Implementation Notes

- Vanilla JavaScript SPA with reusable render helpers.
- Node.js backend using built-in `http`, `fs`, and `crypto` modules.
- JSON-file persistence for local development without external dependencies.
- Password hashing with PBKDF2 and bearer-token sessions.
- REST endpoints for authentication, onboarding, members, teams, invitations, hackathons, saved events, and applications.
- Complete authentication, onboarding, dashboard, members, profiles, teams, and hackathon flows backed by API data.
- Form validation, loading skeletons, empty states, error states, modal interactions, and toasts are included.
- Responsive app shell with mobile bottom navigation and accessible controls.
