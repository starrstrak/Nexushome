"use client";

import { useConnectionStatus } from "@/hooks/useConnectionStatus";

/** Full-width notice when the socket is down or the session is invalid. */
export function ConnectionBanner() {
  const { status, error, logout } = useConnectionStatus();
  if (status === "connected" || status === "initializing" || status === "authenticating" || status === "connecting") {
    return null;
  }
  return (
    <div role="alert" className="mb-4 rounded-xl border border-line bg-card p-4 text-sm">
      {status === "reconnecting" ? (
        <p>Connexion perdue. Reconnexion automatique… les états affichés peuvent être périmés.</p>
      ) : (
        <>
          <p className="text-bad">{error ?? "Erreur de connexion."}</p>
          <button type="button" onClick={logout} className="mt-3 rounded-lg bg-accent px-4 py-2 font-medium text-black">
            Se reconnecter
          </button>
        </>
      )}
    </div>
  );
}
