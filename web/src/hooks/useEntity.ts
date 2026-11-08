"use client";

import { useCallback, useMemo, useRef, useSyncExternalStore } from "react";
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

const NO_IDS: readonly string[] = [];

/** Sorted entity ids; the array identity only changes when the set of ids changes. */
export function useEntityIds(): readonly string[] {
  const { store } = useHa();
  const cache = useRef<{ key: string; ids: readonly string[] }>({ key: "", ids: NO_IDS });
  const getSnapshot = useCallback(() => {
    const ids = Object.keys(store.getAll()).sort();
    const key = ids.join("|");
    if (key !== cache.current.key) cache.current = { key, ids };
    return cache.current.ids;
  }, [store]);
  return useSyncExternalStore(store.subscribeAll, getSnapshot, () => NO_IDS);
}

/**
 * Finds a sensor tied to a device by naming convention (sensor.<objectId>*) and device_class,
 * e.g. the "power" sensor of a plug or the "battery" sensor of a vacuum. Returns its id or undefined.
 */
export function useRelatedSensorId(entityId: string, deviceClass: string): string | undefined {
  const { store } = useHa();
  const prefix = `sensor.${entityId.split(".").slice(1).join(".")}`;
  const getSnapshot = useCallback(() => {
    for (const e of Object.values(store.getAll())) {
      if (e.entity_id.startsWith(prefix) && e.attributes.device_class === deviceClass) return e.entity_id;
    }
    return undefined;
  }, [store, prefix, deviceClass]);
  return useSyncExternalStore(store.subscribeAll, getSnapshot, () => undefined);
}
