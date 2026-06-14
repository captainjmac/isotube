# Isotube

A YouTube playlist manager that lets you save, organize, and track progress on YouTube videos outside of the main youtube site to avoid distractions. Deployed to Cloudflare Pages at `https://isotube.jmac.co`.

## Tech Stack

- React 19 with functional components and hooks
- TypeScript (strict mode)
- Vite 7 for bundling
- Tailwind CSS v4 (via @tailwindcss/vite plugin)
- Radix UI primitives with shadcn/ui patterns
- ESLint for linting

## Commands

- `npm run dev` - Start dev server
- `npm run build` - Type check and build
- `npm run preview` - Preview the production build locally
- `npm run lint` - Run ESLint

## Code Style

- 4-space indentation
- Single quotes for imports, double quotes in JSX attributes
- Functional components only (no class components)
- Named exports for components, default export for App
- Use `@/` path alias for imports from src/

## Project Structure

```
src/
├── components/
│   ├── common/         # Shared components and icons
│   ├── ui/             # shadcn/ui components (Radix wrappers)
│   ├── Player/         # YouTube player with custom controls
│   ├── Sidebar/        # Playlist navigation
│   ├── VideoList/      # Video cards and add form
│   └── VideoDetail/    # Video details and rating
├── hooks/              # Custom hooks (useYouTubePlayer, usePlaylists, etc.)
├── types/              # TypeScript interfaces (Video, Playlist, AppState)
├── utils/              # Helpers (youtube.ts for URL parsing)
└── lib/                # Utilities (cn() for class merging)
```

## Component Patterns

- Props interfaces defined inline or in the same file
- Use `forwardRef` when exposing imperative handles
- Callbacks wrapped in `useCallback` when passed as props
- State managed via Context (PlaylistsContext) with localStorage persistence

## Styling

- Tailwind utility classes directly in JSX
- Use `cn()` from `@/lib/utils` to merge conditional classes
- Dark theme by default (`.dark` class on root)
- shadcn/ui components in `src/components/ui/` - these are copied source, not dependencies

## YouTube Integration

- Embeds use YouTube IFrame API with controls disabled
- Custom progress bar and playback controls in Player component
- Video/playlist/channel metadata fetched via the YouTube Data API v3, **proxied
  through `functions/api/youtube/`** so the API key stays server-side. Client code
  in `src/utils/youtube.ts` calls `/api/youtube/<resource>` (via the `YT()` helper)
  with no key. The oEmbed fallback (`fetchVideoMetadata`) still calls YouTube directly

## Backend (Cloudflare Pages Functions + D1)

- `functions/api/mint` (`POST`) returns a server-signed sync code (`uuid.HMAC`).
- `functions/api/state/[key]` (`GET`/`PUT`) reads/writes the whole `AppState` as a
  JSON blob in D1 (table `isotube_state`, see `schema.sql`), keyed by sync code.
  Keys are HMAC-validated server-side; payloads capped at ~1 MB.
- `functions/api/youtube/[[path]]` proxies whitelisted YouTube Data API resources.
- `functions/_shared.ts` holds `Env`, HMAC helpers, and `json()`. Functions type-check
  against `functions/tsconfig.json` (Workers types), separate from the app build.
- Secrets `SYNC_SECRET` + `YOUTUBE_API_KEY`: `.dev.vars` locally, Pages env vars in prod.

## Cloud Sync

- Offline-first: `localStorage` (`isotube-state`) is the source of truth; sync is additive.
- `StorageAdapter` (`src/storage/`) is the seam; `CloudflareAdapter` talks to the API.
- `useCloudSync` does debounced (2s) last-write-wins sync; `useSyncSettings` stores the
  sync code and migrates away any legacy Supabase settings.

## Development

- `npm run dev` runs Vite at `http://localhost:5173/` with `base: '/'`.
- Source `index.html` lives at the repo root and loads `/src/main.tsx`.
- No HTML generation step — Vite handles the entry HTML directly.

## Deployment to Cloudflare Pages

Isotube is a Cloudflare Pages site (static `dist/` + Functions) at `https://isotube.jmac.co`.

- Deployed via Cloudflare Pages **Git integration**: pushes to `main` run
  `npm run build` (output `dist/`) and deploy `functions/` automatically.
- **No build artifacts are committed** — `dist/` is gitignored and produced by the build.
- D1 binding `DB` → `isotube` and encrypted env vars (`SYNC_SECRET`, `YOUTUBE_API_KEY`)
  are configured on the Pages project. Schema lives in `schema.sql`.
- Custom domain is configured in the Pages dashboard (no `CNAME` file needed).

### Local dev with the backend

- `npm run dev` runs the app on :5173 (HMR) and proxies `/api/*` to `wrangler pages dev`.
- Run the API with `wrangler pages dev --port 8788` after creating `.dev.vars`
  (copy `.dev.vars.example`) and a local D1: `wrangler d1 execute isotube --local --file=schema.sql`.
