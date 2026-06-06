## Why

yachi8000.app is currently a pure static site (GitHub Pages + static JSON/JS). The current proposals for **submission-form** (B) and **circle-notifications** (C) introduce capabilities that genuinely need persistent server-side state — submissions need to be accepted from anonymous users and queued for moderation, notifications need a cron-driven dispatcher that fans out per-user webhook payloads. Bolting a different ad-hoc backend onto each feature (one for B, one for C, one for E delta routing) is more expensive than landing a single shared minimal backend that all three can sit on. Establish the platform once.

## What Changes

- Introduce a single backend service — candidate stacks evaluated in `design.md`:
  - **Cloudflare Workers + D1/KV** (recommended starting point: free tier sufficient, zero infra, edge-fast)
  - Vercel Serverless + Postgres (if relational queries become important)
  - Tiny Node/Python service on a $5/month VPS (if neither serverless option fits)
- Define a thin API contract — JSON over HTTPS — that the static frontend can call
  - `POST /submissions` — accept submissions for moderation queue (used by proposal B)
  - `POST /notifications/register` — register a delivery channel + favorites (used by proposal C)
  - `POST /notifications/dispatch` — internal endpoint cron calls to fan-out pending notifications
  - `GET /recon/delta` — internal endpoint for the recon pipeline to push deltas (used by proposal E)
- Persistence: single source of truth (D1 or SQLite or Postgres depending on stack pick) for submissions, registrations, and delta state. The static circles.json + per-event data.js remain canonical for read-mode site content
- Authentication: no end-user accounts; submissions are anonymous; moderation endpoints gated by a single shared secret (Discord bot pattern) held in environment vars
- Observability: cron health check + simple `/health` endpoint; failures surface to a Discord webhook
- Deployment: GitHub Actions workflow that deploys on `main` push, same repo

## Capabilities

### New Capabilities

- `backend-runtime`: the hosting platform itself — process, edge location, environment vars, build/deploy pipeline
- `backend-persistence`: structured storage layer for submissions, notification registrations, and recon deltas
- `backend-api-contract`: the public + internal endpoint surface, JSON request/response schemas, error model
- `backend-secrets-management`: how Discord webhook URL, shared secrets, X Bearer Token are stored and injected at runtime
- `backend-observability`: health endpoints, error reporting (Discord webhook on exception), basic request log

### Modified Capabilities

(none — this is greenfield; nothing existing changes)

## Impact

- **New repo layout**: `backend/` directory at repo root (separate from `circles/`, `if7-2026-05/` etc.). May graduate to a sub-repo or separate deploy unit later
- **New CI/CD**: `.github/workflows/backend-deploy.yml` runs on `main` push affecting `backend/`
- **Cost**: Cloudflare Workers free tier covers ~100K req/day, D1 free tier 5GB storage — almost certainly sufficient at fan-guide scale (single-digit submissions/week, <100 favorites users)
- **Operational surface**: a backend = a thing that can break. Need monitoring + a clear oncall (probably "Discord webhook tells howish")
- **No breaking changes**: read-mode site stays purely static — no fetch to backend for general browsing. Backend is only invoked from `/submit`, `/notifications`, and recon pipeline

## Dependencies

- (none — this is the foundation other proposals can build on)

## Enables

- `add-submission-form` (B) — uses `POST /submissions`
- `add-circle-notifications` (C) — uses `POST /notifications/register` + `POST /notifications/dispatch`
- `automate-recon-pipeline` (E) — optionally uses `POST /recon/delta` to push deltas into the backend (otherwise E runs as pure GitHub Actions cron)
