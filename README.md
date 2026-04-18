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
# 1. Install (root + both workspaces)
npm install

# 2. Configure Jotform API keys
cp server/.env.example server/.env
# Edit server/.env — set JOTFORM_API_KEY=key1,key2,key3
# (multiple keys are rotated on 429 rate-limits)

# 3. Run both server and client in dev
npm run dev
```

- Client: <http://localhost:5173>
- Server: <http://localhost:3001/api/records>

See [PLAN.md](PLAN.md) for the step-by-step build plan and [CLAUDE.md](CLAUDE.md) for API reference, form IDs, and data shape.

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
