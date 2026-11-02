"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { useHa } from "@/providers/HaProvider";
import type { Availability, EntityView } from "@/types/ha";

/**
 * Subscribes to one entity. `availability`:
 *  - "stale": socket is down, last known state shown
 *  - "unavailable": HA reports the device as unavailable/unknown/missing (offline device)
 */
export function useEntity(entityId: string): EntityView {
  const { store, status } = useHa();
  const subscribe = useCallback((cb: () => void) => store.subscribe(entityId, cb), [store, entityId]);
  const entity = useSyncExternalStore(
    subscribe,
    () => store.get(entityId),
    () => undefined,
  );

  return useMemo(() => {
    let availability: Availability = "available";
    if (!entity || entity.state === "unavailable" || entity.state === "unknown") availability = "unavailable";
    else if (status !== "connected") availability = "stale";
    return { entity, availability };
  }, [entity, status]);
}

/** Subscribes to the full entity map (for listings; re-renders on every change). */
export function useAllEntities() {
  const { store } = useHa();
  return useSyncExternalStore(store.subscribeAll, store.getAll, () => ({}));
}
