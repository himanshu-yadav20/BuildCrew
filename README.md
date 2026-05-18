# BuildCrew

BuildCrew is a production-ready frontend prototype for a student-first professional network focused on hackathon teams, skill credibility, and technical collaboration.

## Folder Structure

```text
BuildCrew/
  index.html
  package.json
  README.md
  src/
    app.js
    data.js
    styles.css
```

## Setup

Open `index.html` directly in a browser, or run a local static server:

```bash
npm run serve
```

The app will be available at `http://localhost:4173`.

## Implementation Notes

- Vanilla JavaScript SPA with hash-style internal state and reusable render helpers.
- Complete authentication, onboarding, dashboard, members, profiles, teams, and hackathon flows.
- Form validation, loading skeletons, empty states, error states, modal interactions, and toasts are included.
- Responsive app shell with mobile bottom navigation and accessible controls.
