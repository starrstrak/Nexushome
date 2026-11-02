import type { HassEntity } from "home-assistant-js-websocket";

export type { HassEntity };

/** Home Assistant entity id, e.g. "light.salon". */
export type EntityId = `${string}.${string}`;

/** Connection lifecycle exposed to the UI. */
export type ConnectionStatus =
  | "initializing" // reading config / tokens
  | "authenticating" // redirecting to or completing the HA OAuth flow
  | "connecting"
  | "connected"
  | "reconnecting" // socket lost, library retries automatically
  | "error"; // fatal (config, auth refused)

/** Availability of an entity as the UI must present it. */
export type Availability = "available" | "unavailable" | "stale";

export interface EntityView {
  readonly entity: HassEntity | undefined;
  readonly availability: Availability;
}

export type ServiceData = Record<string, unknown>;

export interface ServiceTarget {
  readonly entity_id?: EntityId | readonly EntityId[];
}

export function domainOf(id: string): string {
  return id.split(".", 1)[0] ?? "";
}
