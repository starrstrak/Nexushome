import {
  ERR_HASS_HOST_REQUIRED,
  ERR_INVALID_AUTH,
  getAuth,
  type Auth,
  type AuthData,
} from "home-assistant-js-websocket";

const STORAGE_KEY = "nexushome.hassTokens";

// Tokens (short-lived access + refresh) come from the OAuth code flow after the user
// logged in on HA (2FA included). No long-lived access token is ever used or stored.
async function loadTokens(): Promise<AuthData | null | undefined> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthData) : undefined;
  } catch {
    return undefined;
  }
}

function saveTokens(data: AuthData | null): void {
  try {
    if (data) localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage unavailable (private mode): user will re-login on next visit.
  }
}

export function clearTokens(): void {
  saveTokens(null);
}

/**
 * Returns an Auth object. Without valid tokens the library redirects the browser to
 * `${hassUrl}/auth/authorize` and resolves after the redirect back (never resolves
 * in the redirecting page). client_id / redirect_uri default to the page origin, which
 * must be https://home.<domain>/.
 */
export async function authenticate(hassUrl: string): Promise<Auth> {
  try {
    return await getAuth({ hassUrl, saveTokens, loadTokens });
  } catch (err) {
    if (err === ERR_INVALID_AUTH) {
      // Refresh token revoked or expired: start over.
      clearTokens();
      return getAuth({ hassUrl, saveTokens, loadTokens: async () => undefined });
    }
    throw err;
  }
}

export { ERR_HASS_HOST_REQUIRED, ERR_INVALID_AUTH };
