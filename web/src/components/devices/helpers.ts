import type { HassEntity } from "home-assistant-js-websocket";
import type { EntityId } from "@/types/ha";

export const asId = (id: string): EntityId => id as EntityId;

export function nameOf(entity: HassEntity | undefined, fallback: string): string {
  const n = entity?.attributes.friendly_name;
  return typeof n === "string" ? n : fallback;
}

export function target(id: string) {
  return { entity_id: asId(id) };
}
