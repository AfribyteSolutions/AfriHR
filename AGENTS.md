# AfriHRM — Base44 Development Setup

## Overview
Next.js 14.0.3 app ("AfriHRM") — an HR management platform. Uses Firebase (Auth + Firestore + Storage), Stripe, Fapshi payments, and nodemailer. App Router with TypeScript, Tailwind, MUI, Redux Toolkit.

## Running the app
```bash
docker compose -f docker-compose.base44.yml up -d
```
- Web service on port 3000 (Next.js dev server, `next dev -H 0.0.0.0`)
- Source is bind-mounted; edits hot-reload via Next.js dev server
- `npm install --legacy-peer-deps` runs on every container start (uses anonymous volume for node_modules)
- File-watch polling enabled (`WATCHPACK_POLLING=true`, `CHOKIDAR_USEPOLLING=true`) for bind-mount compatibility

## Environment
- `.env.base44-defaults` — placeholder values so the app boots without real credentials
- `/run/base44/app.env` — real secrets (platform-managed, overrides defaults)
- The landing page (`/`) is fully static and renders without any credentials
- Firebase Auth/Firestore, Stripe, Fapshi, and email features require real credentials to function

## Key env vars (all defined in `.base44/environment.json`)
- `NEXT_PUBLIC_FIREBASE_*` — Firebase client config (6 vars)
- `FIREBASE_ADMIN_KEY` — Firebase Admin service account JSON (used in API routes only; gracefully degrades if missing)
- `STRIPE_*` / `NEXT_PUBLIC_STRIPE_*` — Stripe keys
- `FAPSHI_*` — Fapshi payment API
- `EMAIL_USER` / `EMAIL_PASS` — nodemailer SMTP
- `CRON_SECRET` — protects cron endpoints

## Notes
- `next.config.js` has `allowedDevOrigins` for the preview origin (ignored by Next.js 14 with a warning, but harmless)
- `serverExternalPackages` in next.config.js is also unrecognized by Next.js 14 (pre-existing; was `serverComponentsExternalPackages` in 14)
- `experimental.turbo: false` is invalid (should be an object) but pre-existing and harmless
- Puppeteer browser download is skipped (`PUPPETEER_SKIP_DOWNLOAD=true`) — only needed for server-side PDF generation
- `functions/` directory contains Firebase Cloud Functions (not used in local dev)
- `npm install --legacy-peer-deps` is required due to peer dependency conflicts
