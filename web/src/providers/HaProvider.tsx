"use client";

import {
  createConnection,
  subscribeEntities,
  ERR_CANNOT_CONNECT,
  ERR_INVALID_AUTH,
  type Connection,
} from "home-assistant-js-websocket";
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { authenticate, clearTokens } from "@/lib/ha/auth";
import { readHaConfig } from "@/lib/ha/config";
import { createDemoConnection, isDemo } from "@/lib/ha/demo";
import { EntityStore } from "@/lib/ha/entity-store";
import type { ConnectionStatus } from "@/types/ha";

interface HaContextValue {
  readonly status: ConnectionStatus;
  readonly error: string | null;
  readonly connection: Connection | null;
  readonly store: EntityStore;
  readonly logout: () => void;
}

const HaContext = createContext<HaContextValue | null>(null);

export function HaProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<EntityStore | null>(null);
  storeRef.current ??= new EntityStore();
  const store = storeRef.current;

  const [status, setStatus] = useState<ConnectionStatus>("initializing");
  const [error, setError] = useState<string | null>(null);
  const [connection, setConnection] = useState<Connection | null>(null);

  useEffect(() => {
    let cancelled = false;
    let conn: Connection | null = null;
    let unsubEntities: (() => void) | null = null;

    if (isDemo) {
      // Demo: fake entities, no network, no auth.
      const demo = createDemoConnection(store);
      setConnection(demo);
      setStatus("connected");
      return () => {
        demo.close();
        store.clear();
        setConnection(null);
      };
    }

    (async () => {
      try {
        // Plain http (except localhost) would make wss impossible and leak tokens.
        if (location.protocol !== "https:" && location.hostname !== "localhost") {
          throw new Error("This app must be served over HTTPS.");
        }
        const { hassUrl } = readHaConfig();

        setStatus("authenticating");
        const auth = await authenticate(hassUrl);
        if (cancelled) return;

        setStatus("connecting");
        // createConnection derives wss:// from the https hassUrl and refreshes the
        // access token itself; the library re-establishes the socket after drops.
        conn = await createConnection({ auth });
        if (cancelled) {
          conn.close();
          return;
        }

        conn.addEventListener("ready", () => {
          setStatus("connected");
          setError(null);
        });
        conn.addEventListener("disconnected", () => setStatus("reconnecting"));
        conn.addEventListener("reconnect-error", (_c, code) => {
          if (code === ERR_INVALID_AUTH) {
            clearTokens();
            setError("Session expirée, reconnexion requise.");
            setStatus("error");
          } else {
            setStatus("reconnecting");
          }
        });

        unsubEntities = subscribeEntities(conn, (entities) => store.set(entities));
        setConnection(conn);
        setStatus("connected");
      } catch (err) {
        if (cancelled) return;
        if (err === ERR_INVALID_AUTH) clearTokens();
        setError(describeError(err));
        setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
      unsubEntities?.();
      conn?.close();
      store.clear();
      setConnection(null);
    };
  }, [store]);

  const value = useMemo<HaContextValue>(
    () => ({
      status,
      error,
      connection,
      store,
      logout: () => {
        clearTokens();
        location.reload();
      },
    }),
    [status, error, connection, store],
  );

  return <HaContext.Provider value={value}>{children}</HaContext.Provider>;
}

function describeError(err: unknown): string {
  if (err === ERR_CANNOT_CONNECT) return "Home Assistant injoignable (tunnel, URL ou CORS).";
  if (err === ERR_INVALID_AUTH) return "Authentification refusée.";
  if (err instanceof Error) return err.message;
  return `Erreur inconnue (${String(err)})`;
}

export function useHa(): HaContextValue {
  const ctx = useContext(HaContext);
  if (!ctx) throw new Error("useHa must be used inside <HaProvider>.");
  return ctx;
}
