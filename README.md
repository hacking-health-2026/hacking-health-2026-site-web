# Herbal Nexus — simulated demo frontend

Vue frontend for the workbook-only FastAPI demo:
https://github.com/hacking-health-2026/hacking-health-2026-backend.

All scores are explicitly fictional. Interaction rules come from the workbook.
Three explicit medicine formulations have a curated BDPM composition overlay.
DDInter remains archived in the backend and is not used for demo results.

## Run

Start `uvicorn app.main:app` in the backend on port 8000, then:

```sh
npm ci
npm run dev
```

Open the local URL and choose **Explorer**. Vite proxies `/api` to
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

See [the complete path mapping](docs/path-mapping.md) for source aliases, static
assets, routes, API endpoints and GitHub Pages prefixes. Run `npm run check:paths`
after building. CI runs the same check before publishing. GitHub Pages only hosts
the frontend: set the repository variable `VITE_API_BASE_URL` to a deployed HTTPS
backend for search and scoring to work there.

## Demo script

The **Accueil** page presents three documented interaction cases with direct
primary-source links and contextual limitations; see `docs/homepage-sources.md`.
The team page has been removed. The Vue app now lives at the repository root.

1. Click **Leeloo Gé + Millepertuis**: 80 fictional points, simulated red.
2. Click **Xanax + Sommeil Fort**: 50 points, simulated orange.
3. Click **Essayer 72 ans et 50 kg**: 65 points, simulated red.
4. Reload the sleep example, then **Comparer ×2**: 60 points. The quantity tile
   adds 10 points. Editing only melatonin from 1 to 4 mg also gives 60; the
   valerian relation stays unchanged. These are demo heuristics, not clinical dosing.

The presentation interface uses a violet, coral and lime palette, product cards,
a prominent score ring and five color-coded contribution tiles. Both examples
run an analysis directly. The UI displays ingredient mappings, point contributions,
the pair matrix and source worksheet cells. The numeric coefficients are invented.
Age/weight modifiers are not derived from workbook observations. A source label
such as ANSM in the workbook is displayed as unverified, not as a checked citation.

Editing products or the fictional profile clears stale results and cancels pending
analysis. Unknown associations have no score and are never shown as safe.
The source workbook is downloadable from the result. Profile-risk rules come from
the workbook; all numeric weighting is explicitly simulated.

Each product lists its declared ingredients with editable mg per unit and units
per day. Daily quantities are sent to the backend, which returns per-ingredient
relations and a quantity-coverage count. BDPM links identify the exact selected
formulation and RCP date. Other products have unknown amounts, except the clearly
simulated Sommeil Fort example. A blank quantity stays unknown. Uncalibrated
compositions do not receive an invented quantitative score. Botanical extract
mass is labelled separately from isolated active-substance mass.

## Build checks

`npm run build` runs Vue/TypeScript checks and the production build. Individual
checks: `npm run type-check`, `npm run build-only`. Requires Node 24.12+ or the
alternative engine version specified by `package.json`.
