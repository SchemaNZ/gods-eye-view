# Security review — Blackout Watch handoff

Reviewed 2026-11-17 by Claude before import into `watch/`.

## Verdict

No malicious code found. Safe to deploy.

## Checks

| Check | Result |
|---|---|
| Lifecycle scripts (`preinstall`/`postinstall`) | None in `package.json` or `bun.lock` |
| Lockfile sources | All packages from default npm registry; no git/tarball/file deps |
| `npm audit --omit=dev` | 0 vulnerabilities (next 16.4.6, react 19.3.1, three 0.187.0) |
| `eval`, `new Function`, `innerHTML`, `dangerouslySetInnerHTML`, `child_process` | None |
| Runtime network calls (`fetch`, XHR, WebSocket) | None. Only dynamic `import("react-globe.gl")` |
| Storage / tracking (`localStorage`, cookies, analytics) | None |
| External links | `target="_blank"` all carry `rel="noopener noreferrer"` |
| Env vars / secrets | None required; none present |
| Hidden or binary files | None besides `.gitignore` |

## Changes made on import

- Globe texture was loaded from an unpinned `unpkg.com/three-globe` URL at runtime. Now self-hosted at `public/earth-dark.jpg` (copied from three-globe 2.45.6).
- Removed stub `src/app/api/route.ts` (unused "Hello, world" endpoint).
- `scripts/export-events.ts` wrote to a hardcoded `/home/z/my-project/...` path (the authoring agent's sandbox). Now writes to `data/`.
- Added `vercel.json`: skip builds when `watch/` is unchanged; never deploy the `data` branch.

## Known debt (not security)

- `next.config.ts` sets `typescript.ignoreBuildErrors: true`, masking 5 type errors in `flat-panel.tsx` and a missing `tailwindcss-animate` import in `tailwind.config.ts`.
- Dataset was produced by an AI agent; its "verified" label is self-asserted. Not independently re-verified here. Spot-checked the Microsoft 12 Nov 2026 incident against news coverage: consistent.
