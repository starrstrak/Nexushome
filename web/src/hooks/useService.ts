"use client";

import { callService } from "home-assistant-js-websocket";
import { useCallback, useState } from "react";
import { useHa } from "@/providers/HaProvider";
import type { ServiceData, ServiceTarget } from "@/types/ha";

export interface UseServiceResult {
  readonly call: (data?: ServiceData, target?: ServiceTarget) => Promise<boolean>;
  readonly pending: boolean;
  readonly error: string | null;
}

/** Wraps one HA service, e.g. useService("light", "turn_on"). Never throws. */
export function useService(domain: string, service: string): UseServiceResult {
  const { connection, status } = useHa();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const call = useCallback(
    async (data?: ServiceData, target?: ServiceTarget): Promise<boolean> => {
      if (!connection || status !== "connected") {
        setError("Hors ligne");
        return false;
      }
      setPending(true);
      setError(null);
      try {
        await callService(connection, domain, service, data, target as Record<string, unknown> | undefined);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Échec de l'appel de service");
        return false;
      } finally {
        setPending(false);
      }
    },
    [connection, status, domain, service],
  );

  return { call, pending, error };
}
