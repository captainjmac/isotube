# Isotube

A YouTube playlist manager that lets you save, organize, and track progress on YouTube videos outside of the main youtube site to avoid distractions. Deployed to GitHub Pages at `https://isotube.jmac.co`.

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
- Video metadata fetched via oembed API (see `src/utils/youtube.ts`)

## Development

- `npm run dev` runs Vite at `http://localhost:5173/` with `base: '/'`.
- Source `index.html` lives at the repo root and loads `/src/main.tsx`.
- No HTML generation step — Vite handles the entry HTML directly.

## Deployment to GitHub Pages

Isotube is a standalone GitHub Pages site served at `https://isotube.jmac.co`.

- Pushes to `main` trigger `.github/workflows/deploy.yml`, which runs
  `npm ci && npm run build` and publishes `dist/` via the official Pages actions.
- **No build artifacts are committed** — `dist/` is gitignored and produced by CI.
- The custom domain is set by `public/CNAME` (`isotube.jmac.co`), which Vite copies
  into `dist/` on every build.
