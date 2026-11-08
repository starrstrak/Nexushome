import type { Connection, HassEntities, HassEntity } from "home-assistant-js-websocket";
import type { EntityStore } from "./entity-store";

// Demo mode (NEXT_PUBLIC_DEMO=1): fake entities and a fake connection, no Home Assistant needed.
// Entity ids are fictional ("demo_*") and unrelated to the real installation.

export const isDemo = process.env.NEXT_PUBLIC_DEMO === "1";

const now = new Date().toISOString();
const ctx = { id: "demo", parent_id: null, user_id: null };

function ent(entity_id: string, state: string, attributes: Record<string, unknown>): HassEntity {
  return { entity_id, state, attributes, last_changed: now, last_updated: now, context: ctx };
}

function seed(): HassEntities {
  const list: HassEntity[] = [
    ent("light.demo_salon", "on", { friendly_name: "Démo Lampe salon", brightness: 180, color_temp_kelvin: 3000 }),
    ent("light.demo_chambre", "off", { friendly_name: "Démo Lampe chambre" }),
    ent("switch.demo_prise_a", "on", { friendly_name: "Démo Prise A" }),
    ent("sensor.demo_prise_a_puissance", "42.5", { friendly_name: "Démo Prise A puissance", unit_of_measurement: "W" }),
    ent("switch.demo_prise_b", "unavailable", { friendly_name: "Démo Prise B (hors ligne)" }),
    ent("vacuum.demo_robot", "docked", {
      friendly_name: "Démo Aspirateur",
      battery_level: 88,
      fan_speed: "balanced",
      fan_speed_list: ["quiet", "balanced", "turbo", "max"],
    }),
    ent("media_player.demo_tv", "playing", { friendly_name: "Démo TV", volume_level: 0.3, source: "HDMI 1" }),
    ent("media_player.demo_echo", "idle", { friendly_name: "Démo Echo Dot", volume_level: 0.4 }),
  ];
  return Object.fromEntries(list.map((e) => [e.entity_id, e]));
}

/** Fake Connection answering call_service by mutating the store. Cast: only sendMessagePromise is used. */
export function createDemoConnection(store: EntityStore): Connection {
  store.set(seed());

  const patch = (id: string, state: string | null, attrs: Record<string, unknown> = {}) => {
    const cur = store.get(id);
    if (!cur) return;
    const t = new Date().toISOString();
    store.set({
      ...store.getAll(),
      [id]: { ...cur, state: state ?? cur.state, attributes: { ...cur.attributes, ...attrs }, last_updated: t, last_changed: t },
    });
  };

  const fake = {
    async sendMessagePromise(msg: {
      type: string;
      domain?: string;
      service?: string;
      service_data?: Record<string, unknown>;
      target?: { entity_id?: string | string[] };
    }) {
      await new Promise((r) => setTimeout(r, 150));
      if (msg.type !== "call_service") return null;
      const raw = msg.target?.entity_id ?? msg.service_data?.entity_id;
      const ids = Array.isArray(raw) ? raw : raw ? [raw as string] : [];
      for (const id of ids) {
        const cur = store.get(id);
        const on = cur?.state === "on";
        switch (`${msg.domain}.${msg.service}`) {
          case "light.turn_on":
          case "switch.turn_on":
            patch(id, "on", msg.service_data ?? {});
            break;
          case "light.turn_off":
          case "switch.turn_off":
            patch(id, "off");
            break;
          case "light.toggle":
          case "switch.toggle":
            patch(id, on ? "off" : "on");
            break;
          case "vacuum.start":
            patch(id, "cleaning");
            break;
          case "vacuum.pause":
            patch(id, "paused");
            break;
          case "vacuum.return_to_base":
            patch(id, "returning");
            break;
          case "vacuum.set_fan_speed":
            patch(id, null, { fan_speed: msg.service_data?.fan_speed });
            break;
        }
      }
      return null;
    },
  };
  return fake as unknown as Connection;
}
