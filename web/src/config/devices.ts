// Device classification. No entity id is hardcoded: cards are built from discovered entities.
// Heuristics match the object id (e.g. media_player.echo_dot_salon). Add exact ids to the
// arrays below to force a classification, or to hide an entity.

export const deviceConfig = {
  /** Object ids matching this are shown in the Alexa panel. */
  alexaPattern: /(echo|alexa)/i,
  /** Object ids matching this get the d-pad and app shortcuts (Android Debug Bridge). */
  fireTvPattern: /(fire_?tv)/i,
  alexaPlayers: [] as readonly string[],
  fireTvPlayers: [] as readonly string[],
  hidden: [] as readonly string[],
};

export function objectId(entityId: string): string {
  return entityId.split(".").slice(1).join(".");
}

export function isAlexa(entityId: string): boolean {
  return deviceConfig.alexaPlayers.includes(entityId) || deviceConfig.alexaPattern.test(objectId(entityId));
}

export function isFireTv(entityId: string): boolean {
  return deviceConfig.fireTvPlayers.includes(entityId) || deviceConfig.fireTvPattern.test(objectId(entityId));
}

export function isHidden(entityId: string): boolean {
  return deviceConfig.hidden.includes(entityId);
}
