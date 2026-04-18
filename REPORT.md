# Missing Podo — Build Report

**Challenge:** Jotform 2026 Frontend Challenge (Ankara) — 3-hour timed build.
**Author:** Sırrı Kaan Oğuzkan
**Repo:** `2026-frontend-challenge-ankara`

---

## 1. What was built

An investigation dashboard that fetches submissions from five Jotform forms (Checkins, Messages, Sightings, Personal Notes, Anonymous Tips), links records across them by the people mentioned, and lets an investigator reconstruct Podo's last movements.

## 2. Stack and architecture

- **Client:** React 18 + TypeScript + Vite.
- **Server:** Node + Express + TypeScript.
- **Monorepo:** npm workspaces (`client/`, `server/`), single `npm run dev` boots both.
- **Data flow:** browser → `/api/records` on the server → Jotform API. The API key lives only in `server/.env`. The server normalizes the five forms into one shape `{ id, source, createdAt, timestamp, location, coordinates, people, text, urgency, confidence, fields }` so the UI never sees raw `qid`s.
- **Key rotation:** `.env` accepts a comma-separated list; a 429 rotates to the next key automatically.

## 3. Core features

| Area | Summary |
|---|---|
| Fetch | Parallel `Promise.all` over 5 form IDs; partial failures reported to UI instead of failing the whole page. |
| Normalize | `DD-MM-YYYY HH:mm` → ISO, `"lat,lng"` → `{lat, lng}`, skip `control_head`/`control_button` entries. |
| Link | `groupByPerson` collects every name field (`person`, `partner`, `sender`, `recipient`, tip subjects), normalizes, returns people with their records. |
| Views | Overview, People (list + detail), Timeline, Map, Graph — top-nav switchable, all share the same filtered set and URL hash. |
| Search | Matches across names, locations, and text. |
| Filter | Source chips + time-range scrubber + selected person all compose. |
| Detail | Full record view + "Other records mentioning these people" cross-links. |
| States | Loading skeletons, error banner, partial-fetch warning, per-view empty states. |

## 4. Bonuses

### Overview dashboard
Dedicated landing page framing the case at a glance:

- **Case brief** header: last confirmed Podo sighting (absolute + relative time), last known location with coordinates, and "last seen with" chips that jump straight to the person.
- **Stat cards** (records, people, post-disappearance records, persons of interest) — each clickable, routing to the relevant view.
- **Records-by-source breakdown** as proportional bars.
- Embedded **SummaryPanel** ("most suspicious") and a **Most recent** feed with fuzzy-aware name merging (aliases collapse to one entry when fuzzy mode is on).

The time scrubber is hidden here so the Overview always reads against the full dataset; it reappears on People/Timeline/Map/Graph.

### Timeline view
Records grouped by day, ordered by timestamp. Focuses on the selected person if any.

### Map view
- OSM tiles via react-leaflet.
- Markers colored per source; click opens a popup and selects the record.
- **Star pin** at Podo's last confirmed location, with a **1 km dashed magenta circle** for proximity.
- **Teal polyline** connecting Podo's geotagged appearances in chronological order.
- **Numbered step badges** on each unique Podo location (1 = earliest). Records at the same place share a number — numbering reindexes against the current filter so it's always `1..N` without gaps.
- **Legend overlay** explaining the star, steps, and source colors.
- Map ↔ list sync: clicking a marker selects the record, selecting a record pans the map.

### Co-occurrence graph
SVG radial layout. Podo centered, other people on the ring, edges weighted by how often they share records. Clicking a node selects that person.

### "Most suspicious" scoring
Heuristic surfaced in the Summary panel:

- +2 per anonymous tip naming the person
- +1 per high-urgency message involving them
- +1 if they were seen within 1 km of Podo's last known location

Each entry expands to show which records drove the score, so the heuristic is legible instead of opaque.

### "Last seen with"
Top co-occurrences for the selected person, drawn from Sightings and Checkins.

### Post-disappearance anomaly flag
Records timestamped after Podo's last confirmed sighting get a `⚠ post-disappearance` badge — quick way to spot leads or contradictions.

### Fuzzy name matching
Turkish character folding (`ğ→g`, `ş→s`, etc.) + Levenshtein distance. Toggle in the Controls so both modes are demoable. Selecting a person preserves selection across the toggle by re-mapping aliases.

### Time-range scrubber
Dual-handle range over the data's min/max timestamps. Filters every view except Overview, including the graph and the map's numbered path. The scrubber keeps a local draft during drag and commits the global filter only on release, so fast scrubbing never cascades into a filter/map rebuild per frame.

### Shareable deep links
URL hash serializes `view`, `person`, `q`, `sources`, `fuzzy`, `from`, `to`, `record`. A "Share link" button copies the current URL. Initial record deep-link applied once on data load so closing the detail panel doesn't re-open it from stale hash.

### Keyboard shortcuts
- `/` focuses search
- `↑` / `↓` walks the visible record list
- `Esc` clears selection

### Theming
Light/dark toggle backed by a `useTheme` hook. Persisted to `localStorage`, defaults to `prefers-color-scheme`. All colors routed through CSS custom properties (`--bg`, `--surface`, `--text`, `--text-soft`, `--muted`, `--accent`, `--chart-*`).

### Responsive pass
Header stacks at ≤900 px, layout collapses to one column at ≤720 px, controls and sliders re-flow.

## 5. Notable fixes along the way

- **Close-button race in the detail panel.** The deep-link effect was re-applying `hash.record` on every render, so closing the panel immediately re-opened it. Fixed by applying the initial deep link once via a ref.
- **Responsive header stayed right-aligned.** The base `.app__header` rule was defined *after* the `@media` block, so the cascade re-applied the non-responsive version inside the media range. Moved all media queries to the end of the stylesheet.
- **Map step numbers appeared to skip (1, 4, 8, 12…).** Multiple records were sharing coordinates, so markers stacked. Deduped steps by rounded lat/lng — every unique place gets one step, and records at that place share its number.
- **`react-leaflet-cluster` incompatibility.** Clustering crashed at runtime against react-leaflet 4 + React 18, so it was dropped in favor of the numbered path + legend, which read cleaner for 45 records anyway.
- **Time scrubber crash on fast drag.** Every pixel of motion was committing a new `timeRange`, which re-ran `applyFilters`, rebuilt Leaflet markers, and wrote the URL hash — enough to lock up or crash the page. Split into a local draft + release-to-commit so drags are cheap and only the final value propagates.
- **Most Recent row alignment.** Source badges vary in width ("Checkin" vs "Anonymous Tips"), so the timestamp and name columns in the Overview's recent feed shifted row-to-row. Pinned the badge and timestamp to fixed grid columns; long names ellipsize.

## 6. Decisions and trade-offs

- **Server proxy over client-side fetch** — required to keep the API key off the browser, and lets the server do the normalization once.
- **Client-side filtering/search** — the dataset is bounded (~45 records), so no server pagination or search index is needed.
- **CSS variables over a framework** — kept the dep footprint tiny and made the theme toggle a two-line change.
- **Heuristic scoring, not ML** — explainability matters more than accuracy here; the breakdown under each score shows *why*.
- **Numbered map path, not clustering** — clearer for a small dataset; clustering was tried and dropped due to library incompatibility.
- **Commit + push per step** — judging happens on commit history within the 3h window, so every verifiable checkpoint was committed.

## 7. What's intentionally out of scope

- Server-side caching / rate-limit retries beyond simple key rotation.
- Automated tests.
- Backend pagination, database persistence, or write endpoints (forms are `DISABLED`).
- Marker clustering (attempted, dropped).

## 8. How to run

```bash
npm install
npm run dev                           # client + server together
```

The three challenge API keys ship as defaults, so no `.env` setup is required. To override, create `server/.env` with `JOTFORM_API_KEY=key1,key2,key3` (comma-separated; rotated on 429).

Client at `http://localhost:5173`, API at `http://localhost:3001/api/records`.
