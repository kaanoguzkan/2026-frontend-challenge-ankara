# Plan — Missing Podo: The Ankara Case

> Living implementation plan. Tick steps as they're completed so future sessions can pick up cold.

## Context

3-hour timed Jotform Frontend Challenge. Goal: an investigation dashboard that pulls submissions from five Jotform forms, links records that belong to the same person, and lets a user browse/search/drill into them to reconstruct Podo's last sightings.

**Stack** (decided with user): React + TypeScript (Vite) client, Node + TypeScript (Express) server, monorepo via npm workspaces. Server keeps the Jotform API key off the browser and serves normalized records via `/api/...`.

**Guiding principle:** ship a working core end-to-end as fast as possible — every step leaves the app runnable. Bonuses only after core is committed. Each step is a commit boundary.

Form IDs, API shape, auth, and data-gotchas live in [CLAUDE.md](CLAUDE.md) — don't duplicate them here.

---

## Progress tracker

- [x] Step 0 — Repo scaffolding
- [x] Step 1 — Server: fetch + normalize
- [x] Step 2 — Client: scaffold + list view
- [ ] Step 3 — Record linking + people list
- [ ] Step 4 — Search, filter, detail
- [ ] Step 5 — Core ship (README + polish)
- [ ] Bonus A — Timeline
- [ ] Bonus B — Summary panels ("last seen with" / "most suspicious")
- [ ] Bonus C — Map
- [ ] Bonus D — Fuzzy matching

Update this block after each step. Current on-disk state: only [CLAUDE.md](CLAUDE.md) + [README.md](README.md) exist.

---

## Step 0 — Repo scaffolding

**Goal:** working monorepo layout; `npm install` at root succeeds.

Files:
- [.gitignore](.gitignore) — `node_modules/`, `dist/`, `.env`, `.DS_Store`, logs
- [package.json](package.json) — root, `"workspaces": ["server", "client"]`, `concurrently` dev dep, `dev` script runs both
- [server/package.json](server/package.json) — deps: `express`, `cors`, `dotenv`; dev: `tsx`, `typescript`, `@types/*`; scripts `dev` (tsx watch), `build` (tsc), `start`
- [server/tsconfig.json](server/tsconfig.json) — ES2022, ESM, strict
- [server/.env](server/.env) — `JOTFORM_API_KEY=ad39735f1449a6dc28d60e0921352665`, `PORT=3001` (gitignored)
- [server/.env.example](server/.env.example) — same keys, placeholder values

**Verify:** `npm install` at root completes; workspace symlinks exist under `node_modules`.

---

## Step 1 — Server: fetch + normalize

**Goal:** `curl localhost:3001/api/records` returns a flat array of normalized records from all 5 forms.

Files:
- [server/src/jotform.ts](server/src/jotform.ts) — `fetchSubmissions(formId)` (APIKEY header, `limit=1000`) + `normalize(raw, source)` → `{ id, source, createdAt, person?, partner?, sender?, recipient?, timestamp?, location?, coordinates?: {lat, lng}, text?, urgency?, note? }`. Handles: `DD-MM-YYYY HH:mm` → ISO, `"lat,lng"` split, skip `control_head`/`control_button` answers, skip empty answers.
- [server/src/index.ts](server/src/index.ts) — Express app. `GET /api/records` fetches all 5 forms in parallel via `Promise.all`, flattens, returns. `GET /api/health` for sanity. Basic error middleware. Loads `.env` via `dotenv`.
- Hardcoded `SOURCES = [{ id, source }, …]` constant for the 5 forms.

**Verify:** `npm run dev -w server` → `curl localhost:3001/api/records | jq '.[0]'` shows a normalized record; `jq 'length'` > 0.

---

## Step 2 — Client: scaffold + list view

**Goal:** `npm run dev` shows a browser page listing every record with source badge, person, timestamp, location, preview text. Loading / empty / error states all handled.

Files:
- [client/package.json](client/package.json), [client/tsconfig.json](client/tsconfig.json), [client/tsconfig.node.json](client/tsconfig.node.json), [client/vite.config.ts](client/vite.config.ts) (proxy `/api → http://localhost:3001`), [client/index.html](client/index.html)
- [client/src/main.tsx](client/src/main.tsx), [client/src/App.tsx](client/src/App.tsx)
- [client/src/types.ts](client/src/types.ts) — shared `Record` type matching server normalizer
- [client/src/api.ts](client/src/api.ts) — `fetchRecords(): Promise<Record[]>`
- [client/src/hooks/useRecords.ts](client/src/hooks/useRecords.ts) — returns `{ data, loading, error }`
- [client/src/components/RecordList.tsx](client/src/components/RecordList.tsx), [client/src/components/RecordItem.tsx](client/src/components/RecordItem.tsx)
- [client/src/styles.css](client/src/styles.css) — minimal investigation theme, no CSS framework

**Verify:** open `http://localhost:5173`, see ≥1 record per source; throttle network → loading UI appears; break API URL → error state renders.

---

## Step 3 — Record linking + people list

**Goal:** left pane shows unique people; clicking a person filters main pane to their records.

Files:
- [client/src/lib/link.ts](client/src/lib/link.ts) — `groupByPerson(records)`. Collect every name-like field (`person`, `partner`, `sender`, `recipient`, tip subjects). Normalize: lowercase, trim, collapse whitespace. Output `Map<normalizedName, { displayName, records: Record[] }>`.
- [client/src/components/PeopleList.tsx](client/src/components/PeopleList.tsx) — sorted by record count desc; highlight "Podo".
- Selected-person state lifted into `App.tsx`.

**Verify:** Podo appears with records from ≥2 sources; clicking a person restricts main pane; deselect clears filter.

---

## Step 4 — Search, filter, detail

**Goal:** top-bar search + source filter chips; selecting a record shows full detail panel.

Files:
- [client/src/components/SearchBar.tsx](client/src/components/SearchBar.tsx) — free-text match across person names, location, text/note.
- [client/src/components/SourceFilter.tsx](client/src/components/SourceFilter.tsx) — toggle chips for the 5 sources.
- [client/src/components/RecordDetail.tsx](client/src/components/RecordDetail.tsx) — full record + "Other records mentioning this person".

**Verify:** search "CerModern" narrows list; toggling off Messages hides them; clicking a record opens detail with cross-links.

---

## Step 5 — Core ship: README + polish

**Goal:** judge can `git clone && npm install && npm run dev` and see it work.

- Rewrite [README.md](README.md): project intro, how to run (prereqs, install, `.env` setup, `npm run dev`), 1-paragraph architecture (server proxy + normalizer + client), decisions/trade-offs, out-of-scope notes.
- Visual polish pass: spacing, typography, source color coding, empty-state copy.
- Commit message: "core complete".

**After this, only bonuses — core is safe.**

---

## Bonus A — Timeline view

Sort Podo-involving records by `timestamp`, render as vertical timeline with location + who-with. Tab/toggle beside the list.

## Bonus B — Summary panels

- "Last seen with" — most frequent co-occurrence from Sightings/Checkins for the selected person.
- "Most suspicious" — score: anonymous-tip mentions + high-urgency messages + proximity to Podo's last known location. Make heuristic visible.

## Bonus C — Map

Leaflet + OSM tiles (no key needed). Markers for any record with `coordinates`. Click marker ↔ select record. Synced with active filter.

## Bonus D — Fuzzy matching

Swap exact-match in `link.ts` for Levenshtein / `fast-fuzzy` with a threshold; show linking confidence in detail view. Keep behind a toggle.

---

## Critical files

- **Server core**: [server/src/index.ts](server/src/index.ts), [server/src/jotform.ts](server/src/jotform.ts)
- **Client core**: [client/src/App.tsx](client/src/App.tsx), [client/src/lib/link.ts](client/src/lib/link.ts), [client/src/types.ts](client/src/types.ts)
- **Docs**: [README.md](README.md), [CLAUDE.md](CLAUDE.md)

## Verification matrix

| Step | Check |
|---|---|
| 0 | `npm install` at root completes with no errors |
| 1 | `curl localhost:3001/api/records \| jq 'length'` > 0; sample has `person`, `source`, parsed `timestamp` |
| 2 | Browser shows all records; throttled loading UI visible |
| 3 | Podo has records from ≥2 sources; click filters list |
| 4 | Search + chip filter compose correctly; detail opens |
| 5 | Fresh clone → `npm i` → `npm run dev` succeeds from README alone |
| Bonuses | Each is additive; verify core still green after each |

## Time budget (3h total)

- Steps 0–2: first 45 min
- Steps 3–4: next 60 min
- Step 5 done by 2h15
- Bonuses fill remainder — map is biggest sink; only start if ≥45 min remain.

If any step slips: commit what works and move on. Judging is on commits before deadline.
