# Herbal Nexus — simulated demo frontend

Vue frontend for the workbook-only FastAPI demo:
https://github.com/hacking-health-2026/hacking-health-2026-backend.

All scores are explicitly fictional. The workbook is the only active dataset.
DDInter remains archived in the backend and is not used for demo results.

## Run

Start `uvicorn app.main:app` in the backend on port 8000, then:

```sh
npm ci
npm run dev
```

Open the local URL and choose **Vérifier**. Vite proxies `/api` to
`http://127.0.0.1:8000`. With pnpm, use `pnpm install --frozen-lockfile`
and `pnpm dev` instead.

For a single-server demo:

```sh
npm run build
```

The backend serves the sibling frontend's `dist/` at
http://127.0.0.1:8000/compatibility. Set its `FRONTEND_DIST` for another location.
For separate hosting set frontend `VITE_API_BASE_URL` before building and allow
that origin in backend `CORS_ORIGINS`.

## Demo script

1. Click **Leeloo Gé + Millepertuis**: 80 fictional points, simulated red.
2. Click **Xanax + Sommeil Fort**: 50 points, simulated orange.
3. Click **Essayer 72 ans et 50 kg**: 65 points, simulated red.

The UI displays brand-to-class and supplement-to-ingredient mappings, the exact
arithmetic, its invented coefficients, the pair matrix and source worksheet cells.
Age/weight modifiers are not derived from workbook observations. A source label
such as ANSM in the workbook is displayed as unverified, not as a checked citation.

Editing products or the fictional profile clears stale results and cancels pending
analysis. Unknown associations have no score and are never shown as safe.
The source workbook is downloadable from the result. Profile-risk rules come from
the workbook; all numeric weighting is explicitly simulated.

## Build checks

`npm run build` runs Vue/TypeScript checks and the production build. Individual
checks: `npm run type-check`, `npm run build-only`. Requires Node 24.12+ or the
alternative engine version specified by `package.json`.
