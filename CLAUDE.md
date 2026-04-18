# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Status

Fork of the Jotform 2026 Frontend Challenge Ankara starter. As of init, the repo contains only `README.md` and this file — no framework, package manifest, or source has been scaffolded yet. Re-inspect the tree before assuming any tooling exists.

## Challenge: "Missing Podo: The Ankara Case"

3-hour timed challenge. Build an **investigation dashboard** that stitches scattered Jotform submissions into a coherent view of Podo's last sightings and surfaces who looks suspicious.

Required features: data fetching from the API below, record linking across sources (same person across forms), browsable investigation UI, search/filter by person/location/content, detail view showing all linked info for a selected person/record, proper loading/empty/error states.

Bonus (only after core ships): map view with markers, time-based timeline, "last seen with" / "most suspicious" summary panels, fuzzy person matching, responsive polish, map↔list sync.

Judging: functional success, DX (code quality, component structure, state mgmt, naming, error handling, README), product/UX thinking. Commits before the deadline count.

## Jotform API

- Base URL: `https://api.jotform.com`
- Auth: `?apiKey={key}` query param **or** `APIKEY: {key}` header. Keep the key server-side — do not ship it to the browser.
- Key endpoints:
  - `GET /form/{id}/submissions?limit=1000` — list submissions (default limit is small; pass `limit` up to 1000)
  - `GET /form/{id}/questions` — field metadata (qid → name mapping)
  - `GET /user/forms` — list all forms on the account

### Form IDs (data sources)

| Source | Form ID | Field names (from `answers[qid].name`) |
|---|---|---|
| Checkins | `261065067494966` | `personName`, `timestamp`, `location`, `coordinates`, `note` |
| Messages | `261065765723966` | `senderName`, `recipientName`, `timestamp`, `location`, `coordinates`, `text`, `urgency` |
| Sightings | `261065244786967` | (verify via `/questions`) |
| Personal Notes | `261065509008958` | (verify via `/questions`) |
| Anonymous Tips | `261065875889981` | (verify via `/questions`) |

Forms are in `DISABLED` status — read-only access is expected; don't try to POST submissions.

### Submission shape

```jsonc
{
  "content": [{
    "id": "...",
    "form_id": "...",
    "created_at": "2026-04-17 14:00:58",
    "answers": {
      "2": { "name": "personName", "text": "Person Name", "answer": "Podo" },
      "3": { "name": "timestamp",  "answer": "18-04-2026 19:05" },
      "4": { "name": "location",   "answer": "CerModern" },
      "5": { "name": "coordinates","answer": "39.93159,32.84967" },
      ...
    }
  }]
}
```

- Timestamps in `answer` fields use `DD-MM-YYYY HH:mm` (not ISO). Parse accordingly.
- `coordinates` is a `"lat,lng"` string — split before feeding to a map.
- Some `answers` entries are non-data (`control_head`, `control_button`) — filter by `type` or by presence of `answer`.
- Flatten submissions to `{ id, source, createdAt, ...fieldsByName }` early; downstream UI should not see raw qids.

### API keys (provided by organizers)

```
ad39735f1449a6dc28d60e0921352665
54a934fa20b1ccc3a5bd1d2076f90556
5593acd695caab1a3805c3af8532df09
```

Put the active one in a gitignored `.env` (`JOTFORM_API_KEY=...`) — never commit it. All three work against the same account.

## Architectural guidance (once scaffolded)

- Prefer a Node framework that lets the API key stay server-side (Next.js server components / route handlers, or Express + a client bundle). Avoid calling Jotform directly from the browser.
- Build a thin `lib/jotform.ts` (or `.js`) module: one `fetchSubmissions(formId)` + one `normalize(rawSubmission, source)` that returns `{ id, source, createdAt, person, timestamp, location, coordinates, text, ... }`. All UI should consume the normalized shape.
- Person linking will likely be by exact `name.toLowerCase().trim()` for the core pass; fuzzy matching is a bonus. Keep the matcher isolated so it can be swapped.
- Submissions are bounded (~hundreds), so client-side filtering/search is fine — no need for server-side pagination or a DB.
- Judging weights README quality: keep `README.md` focused on `how to run` + a short architecture/decisions note.

## Commands

None defined yet. Once a framework is scaffolded, replace this section with concrete install / dev / build / lint commands.
