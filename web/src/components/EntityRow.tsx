"use client";

import { useEntity } from "@/hooks/useEntity";
import { useService } from "@/hooks/useService";
import { domainOf } from "@/types/ha";

/** Generic read-only row, used by the discovery list until Phase 4 device cards exist. */
export function EntityRow({ entityId }: { entityId: string }) {
  const { entity, availability } = useEntity(entityId);
  const domain = domainOf(entityId);
  const toggle = useService(domain === "light" ? "light" : "switch", "toggle");
  const canToggle = (domain === "light" || domain === "switch") && availability === "available";
  const name = (entity?.attributes.friendly_name as string | undefined) ?? entityId;
  const badge =
    availability === "unavailable" ? "Hors ligne" : availability === "stale" ? `${entity?.state} (périmé)` : entity?.state;
  return (
    <li className={`flex items-center justify-between gap-3 py-2 ${availability !== "available" ? "opacity-60" : ""}`}>
      <span className="min-w-0 truncate">
        {name}
        <span className="block truncate text-xs text-muted">{entityId}</span>
      </span>
      <span className="flex shrink-0 items-center gap-3 text-sm text-muted">
        {badge}
        {canToggle && (
          <button
            type="button"
            disabled={toggle.pending}
            onClick={() => void toggle.call(undefined, { entity_id: entityId as `${string}.${string}` })}
            className="rounded-lg bg-accent px-3 py-1.5 font-medium text-black disabled:opacity-50"
          >
            {entity?.state === "on" ? "Éteindre" : "Allumer"}
          </button>
        )}
      </span>
    </li>
  );
}
