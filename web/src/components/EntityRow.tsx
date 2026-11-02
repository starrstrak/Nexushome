"use client";

import { useEntity } from "@/hooks/useEntity";

/** Generic read-only row, used by the discovery list until Phase 4 device cards exist. */
export function EntityRow({ entityId }: { entityId: string }) {
  const { entity, availability } = useEntity(entityId);
  const name = (entity?.attributes.friendly_name as string | undefined) ?? entityId;
  const badge =
    availability === "unavailable" ? "Hors ligne" : availability === "stale" ? `${entity?.state} (périmé)` : entity?.state;
  return (
    <li className={`flex items-center justify-between gap-3 py-2 ${availability !== "available" ? "opacity-60" : ""}`}>
      <span className="min-w-0 truncate">
        {name}
        <span className="block truncate text-xs text-muted">{entityId}</span>
      </span>
      <span className="shrink-0 text-sm text-muted">{badge}</span>
    </li>
  );
}
