# Monitoring Dashboard

A production-ready, real-time monitoring dashboard built as a **Next.js 14 (App
Router) + TypeScript** monorepo. It surfaces three categories of metrics in one
unified UI — **system health**, **API/application performance**, and **business
KPIs** — all refreshing live over Server-Sent Events with no manual reload.

```
┌──────────────────────────────────────────────────────────┐
│  Overview · System · API Health · Business                 │
│  ● Live   CPU 47%   Mem 63%   P95 280ms   Rev $24,910      │
└──────────────────────────────────────────────────────────┘
```

---

## Features

- **Live SSE stream** (`/api/stream`) pushing a full metric envelope every 2s,
  with automatic exponential-backoff reconnect (capped at 30s).
- **Three deep-dive pages** plus an at-a-glance overview with an alert feed.
- **Threshold alerting** evaluated server-side on every tick.
- **Dark/light themes**, collapsible sidebar, responsive down to 375px.
- **Seeded mock generators** that produce smooth, coherent, non-random-looking
  data — fully deterministic for reproducible tests.
- **Recharts** visualizations, **Zustand** state with capped rolling windows,
  **shadcn/ui**-style primitives on **Tailwind**.

---

## Prerequisites

| Tool | Version |
| ---- | ------- |
| Node | 20.x    |
| pnpm | 9.x     |

> pnpm ships with Node via Corepack: `corepack enable && corepack prepare pnpm@9 --activate`

---

## Quickstart

```bash
pnpm install
cp .env.example .env
pnpm dev
```

Open <http://localhost:3000>. The live indicator dot turns green once the SSE
stream connects.

### Other scripts

```bash
pnpm build          # production build (next build, standalone output)
pnpm lint           # eslint
pnpm format:check   # prettier --check
pnpm typecheck      # tsc --noEmit across the workspace
pnpm test           # vitest unit tests
pnpm test:coverage  # vitest with coverage (>80% on pure modules)
pnpm e2e            # playwright end-to-end tests
```

---

## Screenshots

> _Placeholder — add captures once running locally._

| Overview | System | API Health | Business |
| -------- | ------ | ---------- | -------- |
| _TODO_   | _TODO_ | _TODO_     | _TODO_   |

---

## Environment Variables

| Variable               | Default                  | Description                                  |
| ---------------------- | ------------------------ | -------------------------------------------- |
| `NEXT_PUBLIC_APP_NAME` | `"Monitoring Dashboard"` | App name shown in the sidebar and `<title>`. |
| `NEXT_PUBLIC_SSE_PATH` | `/api/stream`            | SSE endpoint the client subscribes to.       |
| `METRICS_REFRESH_MS`   | `2000`                   | Server stream tick interval (ms).            |
| `ALERT_WEBHOOK_URL`    | _(empty)_                | Optional Slack webhook for critical alerts.  |

---

## Docker

```bash
docker compose up --build
```

The image is a multi-stage build (`docker/Dockerfile`) emitting Next.js
`standalone` output on a minimal Node 20 Alpine runtime. The container exposes
port 3000 and self-reports health via `/api/metrics/system`.

---

## Architecture

```
                         ┌──────────────────────────┐
                         │      Browser (client)     │
                         │  Zustand stores + Recharts│
                         └───────────▲──────────────┘
                                     │ EventSource (SSE)
                                     │ auto-reconnect (backoff ≤ 30s)
                         ┌───────────┴──────────────┐
                         │  /api/stream  (Node route)│
                         │  MetricsEngine.tick() / 2s│
                         │  + threshold alert eval    │
                         └───────────▲──────────────┘
                                     │
                         ┌───────────┴──────────────┐
                         │  lib/metrics.ts            │
                         │  seeded value-noise gens   │
                         └────────────────────────────┘
```

### CI/CD

```
push / PR ──▶  CI (ci.yml)
               ├─ lint        (eslint + prettier)
               ├─ typecheck   (tsc --noEmit)
               ├─ unit-tests  (vitest + coverage ▶ Codecov)
               └─ build       (next build)
                     │ on success (main)
                     ▼
          Deploy (deploy.yml)
               ├─ build & push image ▶ ghcr.io  (tags: latest, <sha>)
               ├─ ssh ▶ docker pull + compose up -d --no-deps web
               ├─ smoke test: curl --fail /api/metrics/system
               └─ on failure ▶ auto-rollback to previous image tag
```

Required deploy secrets: `GHCR_TOKEN`, `SSH_HOST`, `SSH_USER`, `SSH_KEY`
(and optionally `CODECOV_TOKEN` for coverage upload).

---

## Project Structure

```
apps/web              Next.js 14 App Router application
  app/                routes, API handlers, SSE stream
  components/         layout · charts · widgets · ui
  lib/                metrics generators · sse hook · zustand store
packages/types        shared TypeScript contracts
docker/               multi-stage Dockerfile
.github/workflows/    ci.yml · deploy.yml
```

---

## Contributing

**Branch naming:** `type/short-description` — e.g. `feat/funnel-widget`,
`fix/sse-reconnect`, `chore/bump-deps`.

**PR checklist:**

- [ ] `pnpm lint` and `pnpm format:check` pass
- [ ] `pnpm typecheck` passes
- [ ] `pnpm test` passes (add/extend tests for new logic)
- [ ] `pnpm build` succeeds
- [ ] Screenshots attached for UI changes
- [ ] PR description explains the _why_, not just the _what_

---

## License

MIT
