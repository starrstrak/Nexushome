import type { HassEntity } from "home-assistant-js-websocket";

// MediaPlayerEntityFeature bit values (Home Assistant core).
export const MP = {
  PAUSE: 1,
  VOLUME_SET: 4,
  VOLUME_MUTE: 8,
  TURN_ON: 128,
  TURN_OFF: 256,
  VOLUME_STEP: 1024,
  SELECT_SOURCE: 2048,
  PLAY: 16384,
} as const;

/** True when the feature is advertised; permissive when HA sent no bitmask at all. */
export function hasFeature(entity: HassEntity | undefined, bit: number): boolean {
  const f = entity?.attributes.supported_features;
  return typeof f === "number" ? (f & bit) !== 0 : true;
}

export function num(v: unknown): number | undefined {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number.parseFloat(v) : Number.NaN;
  return Number.isFinite(n) ? n : undefined;
}

export function strList(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}
