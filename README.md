<<<<<<< HEAD
# <!-- Team name --> · Tech for Good 2026

Team repository for **Build with AI: Code for Communities** — GDG Coimbatore
(hackathon **Aug 8–9, 2026**, GRD College).

Everything your team does lives here from day one: the proposal, code, docs, and
progress. Organizers follow along through this repo, so keep it active.

## Start here
1. **Fill in [`PROPOSAL.md`](./PROPOSAL.md)** and commit it by **Jul 24, 11:59 PM IST**. That's your Ideation-Phase submission.
2. **Add your teammates** as collaborators (Settings → Collaborators), or ask your organizer to add them by GitHub username.
3. **Build in the open** — commit early and often. Put source in `/src`, notes and diagrams in `/docs`.

## Repo layout
| Path | For |
|------|-----|
| `PROPOSAL.md` | Your architecture proposal (the submission) |
| `/src` | Application code |
| `/docs` | Design notes, diagrams, research |
| Issues | Track tasks; use the **Progress update** template for weekly check-ins |

## Ground rules
- Teams are **2–4 people**.
- Keep the repo **public** — it's part of the open-source, tech-for-good spirit and helps judging.
- Use the four SDG tracks; build something that helps a real community.

Questions? Ping the organizers in the mixer WhatsApp group or open an issue.

— GDG Coimbatore · TiE Kovai Con · GRD College · Startup Culture
=======
﻿# CarePilot

AI-powered medicine information assistant.

## Quick Start

1. `npm install`
2. Copy `.env.example` to `.env` and add your `VITE_GEMINI_API_KEY`
3. `npm run dev`
4. Load your medicine dataset (XLSX) via Settings

## Build
`npm run build`

## Dataset Columns Required
- Medicine Name, Composition, Uses, Side_effects, Image URL, Manufacturer, Excellent Review %, Average Review %, Poor Review %

## Deploy
Vercel: Push to GitHub, import repo, set VITE_GEMINI_API_KEY env var.

## Android APK (Capacitor)
`npm install @capacitor/core @capacitor/cli @capacitor/android`
`npx cap init CarePilot com.carepilot.app`
`npm run build && npx cap add android && npx cap sync && npx cap open android`

## Safety
CarePilot never guesses a medicine. Not a replacement for a doctor or pharmacist.
>>>>>>> 2a0788b (Add CarePilot project source code)
