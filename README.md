# Jotform Frontend Challenge Project

## User Information
Please fill in your information after forking this repository:

- **Name**: Sırrı Kaan Oğuzkan

## Project Description
**Missing Podo: The Ankara Case** — an investigation dashboard that stitches scattered Jotform submissions (Checkins, Messages, Sightings, Personal Notes, Anonymous Tips) into a coherent picture of Podo's last sightings and the people around them. Records are linked across forms by the people they mention, so clicking any person surfaces every trace of them regardless of which form captured it.

Stack: React + TypeScript (Vite) on the client, Node + TypeScript (Express) on the server. The server proxies the Jotform API so the API key never reaches the browser.

## Getting Started

**Prereqs:** Node 20+, npm 10+.

```bash
npm install
npm run dev
```

The challenge's Jotform API keys ship as defaults, so no `.env` setup is needed. To use your own, create `server/.env` with `JOTFORM_API_KEY=key1,key2,key3` (multiple keys are rotated on 429 rate-limits).

- Client: <http://localhost:5173>
- Server: <http://localhost:3001/api/records>

Additional info — architecture, every bonus, fixes, and trade-offs — is in [REPORT.md](REPORT.md) (or [REPORT.pdf](REPORT.pdf)).

## Features

**Core**
- Fetches and normalizes submissions from all 5 Jotform forms server-side (API key never hits the browser).
- Links records across forms by person name so clicking a person shows every trace of them.
- Search, source filter chips, and a detail panel with cross-linked related records.
- Loading skeletons, partial-fetch warnings, and an error boundary.

**Bonuses**
- **Timeline view** grouped by day.
- **Map view** with OSM tiles, source-colored markers, a star pin at Podo's last confirmed location, a 1 km radius circle, and a numbered polyline showing Podo's chronological path (one step per unique place).
- **Co-occurrence graph** — SVG radial layout, edges weighted by shared records.
- **"Most suspicious" scoring** with an explainable breakdown (anonymous tips, urgent messages, proximity to Podo's last location).
- **"Last seen with"** co-occurrence for the selected person.
- **Post-disappearance anomaly flag** on records timestamped after Podo's last confirmed sighting.
- **Fuzzy name matching** (Turkish-fold + Levenshtein) behind a toggle.
- **Time-range scrubber** that filters every view.
- **Shareable deep links** — view, person, search, sources, fuzzy, time range, and selected record all round-trip through the URL hash.
- **Keyboard shortcuts** — `/` focuses search, `↑/↓` walks records, `Esc` clears selection.
- **Light / dark theme** toggle, persisted and respecting `prefers-color-scheme`.
- **Responsive pass** for narrow viewports.

# 🚀 Challenge Duyurusu

## 📅 Tarih ve Saat
Cumartesi günü başlama saatinden itibaren üç saattir.

## 🎯 Challenge Konsepti
Bu challenge'da, size özel hazırlanmış bir senaryo üzerine web uygulaması geliştirmeniz istenecektir. Challenge başlangıcında senaryo detayları paylaşılacaktır.Katılımcılar, verilen GitHub reposunu fork ederek kendi geliştirme ortamlarını oluşturacaklardır.

## 📦 GitHub Reposu
Challenge için kullanılacak repo: https://github.com/cemjotform/2026-frontend-challenge-ankara

## 🛠️ Hazırlık Süreci
1. GitHub reposunu fork edin
2. Tercih ettiğiniz framework ile geliştirme ortamınızı hazırlayın
3. Hazırladığınız setup'ı fork ettiğiniz repoya gönderin

## 💡 Önemli Notlar
- Katılımcılar kendi tercih ettikleri framework'leri kullanabilirler
