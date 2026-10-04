# Railway — single service deployment

This repository is configured so the Vite frontend and Express/tRPC API run from one Railway service and one domain.

## Railway settings

- Root Directory: `/`
- Build Command: `pnpm build`
- Start Command: `pnpm start`
- If `SERVER_PORT=3001` is set, point the Railway public domain to port `3001`.

## Required production variables

Set at least:

- `NODE_ENV=production`
- `AUTH_SECRET`
- `DATABASE_URL`
- `S3_ENDPOINT`
- `S3_REGION`
- `S3_BUCKET`
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`
- `S3_FORCE_PATH_STYLE`

`CLIENT_ORIGIN` and `VITE_API_URL` are not required for the single-domain production deployment. They remain useful for local development.

## What changed

- The root project now has a `start` script.
- The server compiles to `apps/server/dist/index.js`.
- Express serves `apps/web/dist` in production and falls back to `index.html` for SPA routes.
- The production frontend calls `/trpc` and `/api/...` on the same domain.
- Local development still uses Vite on port 5173 and the API on port 3001.
