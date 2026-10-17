# Hacking Health 2026 — Vue frontend

Interaction checker connected to the FastAPI backend:
https://github.com/hacking-health-2026/hacking-health-2026-backend.
Requires Node 24.12+ (or the version supported by `package.json`).

## Development

Start the backend on port 8000 (see its README), then:

```sh
npm ci
npm run dev
```

Open the printed local URL and choose **Vérifier**. Vite proxies `/api` to
`http://127.0.0.1:8000`. A pnpm lockfile is also provided; with pnpm use
`pnpm install --frozen-lockfile` and `pnpm dev` instead.

## Single-server demo

```sh
npm run build
```

The backend serves this `dist/` folder automatically when both repositories are
cloned next to each other with their default names. Open
http://127.0.0.1:8000/compatibility. Override its `FRONTEND_DIST` if necessary.
For a separately hosted frontend set `VITE_API_BASE_URL` before building and
allow the frontend origin in the backend's `CORS_ORIGINS`.

## Behavior

- Search English ingredient names and select a DDInter result in each field.
- Compare 2–5 distinct ingredients, with add/remove controls.
- Display the symmetric pairwise matrix, raw source levels, source-file links,
  source version/license and coverage of the submitted pairs.
- Major/Moderate = danger flag. Minor = no major alert, not guaranteed safe.
  Missing/Unknown stays unknown.
- Editing any ingredient clears previous results and cancels pending analysis.
- Search and analysis failures are visible; there is no hardcoded fallback.

This checks co-administration interactions, not physical mixing or stability.
Patient profiles, doses, brands, higher-order effects and exhaustive coverage of
supplements/essential oils are outside this PoC.

## Verification

`npm run build` runs Vue/TypeScript checks and the production build.
For individual checks use `npm run type-check` and `npm run build-only`.
