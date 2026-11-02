import { NextResponse, type NextRequest } from "next/server";

// Per-request CSP nonce (Next.js 16 "proxy", formerly middleware).
export function proxy(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const isDev = process.env.NODE_ENV !== "production";

  let haOrigin = "";
  let haWs = "";
  try {
    const u = new URL(process.env.NEXT_PUBLIC_HA_URL ?? "");
    haOrigin = u.origin;
    haWs = `${u.protocol === "https:" ? "wss:" : "ws:"}//${u.host}`;
  } catch {
    // Misconfigured env: CSP stays strict (self only); the app shows a config error.
  }

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' 'nonce-${nonce}'${isDev ? " 'unsafe-inline'" : ""}`,
    "img-src 'self' data: blob:",
    `connect-src 'self' ${haOrigin} ${haWs}`.trim(),
    "manifest-src 'self'",
    "worker-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");

  const headers = new Headers(request.headers);
  headers.set("x-nonce", nonce);
  headers.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!_next/static|_next/image|favicon.ico|sw.js|icons/).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
