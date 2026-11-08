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
    ent("light.demo_salon", "on", {
      friendly_name: "Démo Lampe salon",
      supported_color_modes: ["color_temp", "hs"],
      brightness: 180,
      color_temp_kelvin: 3000,
      min_color_temp_kelvin: 2200,
      max_color_temp_kelvin: 6500,
      hs_color: [30, 60],
    }),
    ent("light.demo_chambre", "off", { friendly_name: "Démo Lampe chambre", supported_color_modes: ["brightness"], brightness: 120 }),
    ent("switch.demo_prise_a", "on", { friendly_name: "Démo Prise A" }),
    ent("sensor.demo_prise_a_power", "42.5", { friendly_name: "Démo Prise A puissance", unit_of_measurement: "W", device_class: "power" }),
    ent("switch.demo_prise_c", "on", { friendly_name: "Démo Prise C", current_power_w: 7.2 }),
    ent("switch.demo_prise_b", "unavailable", { friendly_name: "Démo Prise B (hors ligne)" }),
    ent("vacuum.demo_robot", "docked", {
      friendly_name: "Démo Aspirateur",
      fan_speed: "balanced",
      fan_speed_list: ["quiet", "balanced", "turbo", "max"],
    }),
    ent("sensor.demo_robot_battery", "88", { friendly_name: "Démo Aspirateur batterie", device_class: "battery", unit_of_measurement: "%" }),
    ent("media_player.demo_tv", "playing", {
      friendly_name: "Démo TV",
      supported_features: 128 | 256 | 4 | 8 | 1024 | 2048,
      volume_level: 0.3,
      is_volume_muted: false,
      source: "HDMI 1",
      source_list: ["HDMI 1", "HDMI 2", "TV"],
    }),
    ent("media_player.demo_firetv", "idle", {
      friendly_name: "Démo Fire TV",
      volume_level: 0.5,
      source: "Netflix",
      source_list: ["Netflix", "YouTube", "Prime Video", "Disney+"],
    }),
    ent("media_player.demo_echo_dot", "idle", { friendly_name: "Démo Echo Dot", volume_level: 0.4 }),
    ent("media_player.demo_echo_spot", "playing", { friendly_name: "Démo Echo Spot", volume_level: 0.25 }),
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

  // Live power readings that follow the plug state, to show the streaming UI.
  const timer = setInterval(() => {
    const a = store.get("switch.demo_prise_a")?.state === "on";
    patch("sensor.demo_prise_a_power", a ? (40 + Math.random() * 6).toFixed(1) : "0");
    const c = store.get("switch.demo_prise_c")?.state === "on";
    patch("switch.demo_prise_c", null, { current_power_w: c ? Number((7 + Math.random()).toFixed(1)) : 0 });
  }, 2000);

  const fake = {
    close() {
      clearInterval(timer);
    },
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
          case "light.turn_on": {
            const d = { ...(msg.service_data ?? {}) } as Record<string, unknown>;
            if (typeof d.brightness_pct === "number") d.brightness = Math.round(d.brightness_pct * 2.55);
            delete d.brightness_pct;
            patch(id, "on", d);
            break;
          }
          case "switch.turn_on":
            patch(id, "on");
            break;
          case "light.turn_off":
          case "switch.turn_off":
            patch(id, "off");
            break;
          case "light.toggle":
          case "switch.toggle":
            patch(id, on ? "off" : "on");
            break;
          case "media_player.toggle":
            patch(id, cur?.state === "off" ? "idle" : "off");
            break;
          case "media_player.volume_set":
            patch(id, null, { volume_level: msg.service_data?.volume_level });
            break;
          case "media_player.volume_up":
            patch(id, null, { volume_level: Math.min(1, ((cur?.attributes.volume_level as number) ?? 0) + 0.05) });
            break;
          case "media_player.volume_down":
            patch(id, null, { volume_level: Math.max(0, ((cur?.attributes.volume_level as number) ?? 0) - 0.05) });
            break;
          case "media_player.volume_mute":
            patch(id, null, { is_volume_muted: msg.service_data?.is_volume_muted });
            break;
          case "media_player.select_source":
            patch(id, "playing", { source: msg.service_data?.source });
            break;
          case "media_player.media_play_pause":
            patch(id, on || cur?.state === "playing" ? "paused" : "playing");
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
