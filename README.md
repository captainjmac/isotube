# Isotube

A YouTube playlist manager that lets you save, organize, and track progress on
YouTube videos outside of the main YouTube site to avoid distractions.

Live at **https://isotube.jmac.co**.

## Tech Stack

- React 19 + TypeScript (strict)
- Vite 7
- Tailwind CSS v4
- Radix UI / shadcn/ui patterns
- Optional cloud sync via Supabase (URL + anon key entered at runtime in Settings)

## Development

```bash
npm install
npm run dev        # http://localhost:5173
```

## Build

```bash
npm run build      # type-check + production build into dist/
npm run preview    # preview the production build locally
```

## Deployment

Pushes to `main` are built and published to GitHub Pages automatically by
`.github/workflows/deploy.yml` (no build artifacts are committed). The custom
domain is configured via `public/CNAME` (`isotube.jmac.co`).
