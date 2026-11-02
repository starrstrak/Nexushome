// Validated public configuration. HA URL must be https (browsers block ws:// on https pages).

export interface HaConfig {
  /** Origin of Home Assistant, https only, no trailing slash. */
  readonly hassUrl: string;
}

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

export function readHaConfig(): HaConfig {
  const raw = process.env.NEXT_PUBLIC_HA_URL?.trim();
  if (!raw) throw new Error("NEXT_PUBLIC_HA_URL is not set (see .env.example).");

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("NEXT_PUBLIC_HA_URL is not a valid URL.");
  }
  // http is tolerated for localhost development only.
  if (url.protocol !== "https:" && !(url.protocol === "http:" && LOCAL_HOSTS.has(url.hostname))) {
    throw new Error("NEXT_PUBLIC_HA_URL must use https (http allowed for localhost only).");
  }
  return { hassUrl: url.origin };
}
