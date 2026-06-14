# Isotube

A YouTube playlist manager that lets you save, organize, and track progress on
YouTube videos outside of the main YouTube site to avoid distractions.

Live at **https://isotube.jmac.co**.

## Tech Stack

- React 19 + TypeScript (strict)
- Vite 7
- Tailwind CSS v4
- Radix UI / shadcn/ui patterns
- Cloudflare Pages (static) + Pages Functions + D1 for optional cloud sync
- Optional cloud sync via a private **sync code** (generated in Settings → Cloud Sync)

State is stored in `localStorage` and works fully offline. Cloud sync is opt-in:
generate a sync code, then paste the same code on another device to sync the same
library. Anyone with the code can read/edit it, so keep it private.

## Development

### App only (UI + playback, with HMR)

```bash
npm install
npm run dev        # http://localhost:5173
```

This is enough to browse, play, and edit playlists (state lives in `localStorage`).
Without the backend running, the API-backed features are unavailable: cloud sync is
off, and adding a video/playlist/channel falls back to YouTube's keyless **oEmbed**
endpoint — so you get a title but no upload date, and playlist/channel import won't work.

### Full stack (sync + YouTube proxy + D1)

Everything works locally, including cloud sync. One-time setup:

```bash
cp .dev.vars.example .dev.vars   # set SYNC_SECRET + a real YOUTUBE_API_KEY
npm run db:local                 # apply schema.sql to a local D1 database
```

Then run the whole stack with one command:

```bash
npm run dev:full                 # app (HMR) on :5173 + API (Functions + local D1) on :8788
```

Open **http://localhost:5173**. `vite.config.ts` proxies `/api/*` to :8788, so the
browser sees a single origin. `dev:full` just runs `npm run dev` and `npm run dev:api`
together (via `concurrently`); you can also run those two in separate terminals.

A real `YOUTUBE_API_KEY` in `.dev.vars` is required for full metadata and
playlist/channel import. Notes on local vs. production:

- Local D1 is a separate SQLite under `.wrangler/state` — its data is independent
  of production.
- Sync codes are signed with `SYNC_SECRET`, so codes minted locally won't validate
  against production (different secret) and vice versa.

(Alternative single-port mode, no HMR: `npm run build` then `wrangler pages dev dist`
serves the built app + Functions together on one port.)

## Build

```bash
npm run build      # type-check + production build into dist/
npm run preview    # preview the production build locally
```

## Deployment

Deployed to **Cloudflare Pages** via Git integration: pushes to `main` are built
(`npm run build`, output `dist/`) and Pages Functions under `functions/` are
deployed alongside the static site. No build artifacts are committed.

One-time setup:

1. `wrangler d1 create isotube`, paste the `database_id` into `wrangler.toml`,
   and bind `DB` → `isotube` on the Pages project (Settings → Functions → D1).
2. Apply the schema to the remote DB:
   `wrangler d1 execute isotube --remote --file=schema.sql`.
3. Set `SYNC_SECRET` and `YOUTUBE_API_KEY` as encrypted environment variables on
   the Pages project (Production + Preview).
4. Add `isotube.jmac.co` as a custom domain on the Pages project.
