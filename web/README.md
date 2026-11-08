# Nexushome web (Phase 3)

Next.js 16 (App Router) + React 19 + TypeScript strict + Tailwind 4 + home-assistant-js-websocket 9.8.1.

```bash
cp .env.example .env.local   # set NEXT_PUBLIC_HA_URL=https://ha.<domain>
npm install
npm run dev                  # http://localhost:3000 (OAuth needs HA to accept this origin, see below)
npm run typecheck && npm run build
```

- Auth: OAuth code flow (`getAuth`) against HA; short-lived access token + refresh token in localStorage. No long-lived token.
- Connection: `createConnection` (wss derived from https URL), automatic reconnect, status in `HaProvider`.
- Hooks: `useEntity`, `useAllEntities`, `useService`, `useConnectionStatus`.
- Security headers: HSTS etc. in `next.config.ts`; per-request CSP nonce in `src/proxy.ts`.
- PWA: `manifest.ts`, `public/sw.js` (shell only, never caches HA traffic), icons in `public/icons`.

## Demo mode (no Home Assistant needed)

```bash
NEXT_PUBLIC_DEMO=1 NEXT_PUBLIC_HA_URL=https://ha.example.ch npm run dev
```
Fake `demo_*` entities, fake connection; never set `NEXT_PUBLIC_DEMO` in production.
