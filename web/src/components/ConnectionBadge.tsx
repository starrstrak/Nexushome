"use client";

import { useConnectionStatus } from "@/hooks/useConnectionStatus";
import type { ConnectionStatus } from "@/types/ha";

const LABEL: Record<ConnectionStatus, string> = {
  initializing: "Initialisation",
  authenticating: "Authentification",
  connecting: "Connexion…",
  connected: "Connecté",
  reconnecting: "Reconnexion…",
  error: "Erreur",
};

const COLOR: Record<ConnectionStatus, string> = {
  initializing: "bg-muted",
  authenticating: "bg-warn",
  connecting: "bg-warn",
  connected: "bg-ok",
  reconnecting: "bg-warn animate-pulse",
  error: "bg-bad",
};

export function ConnectionBadge() {
  const { status } = useConnectionStatus();
  return (
    <span role="status" className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1 text-xs text-muted">
      <span className={`size-2 rounded-full ${COLOR[status]}`} aria-hidden />
      {LABEL[status]}
    </span>
  );
}
