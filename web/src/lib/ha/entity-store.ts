import type { HassEntities, HassEntity } from "home-assistant-js-websocket";

type Listener = () => void;

/**
 * Minimal external store holding all HA entities. Components subscribe per entity
 * (useSyncExternalStore) so a change on one light does not re-render the whole app.
 * HA's subscribeEntities keeps object identity for unchanged entities.
 */
export class EntityStore {
  private entities: HassEntities = {};
  private listeners = new Map<string, Set<Listener>>();
  private allListeners = new Set<Listener>();

  set(next: HassEntities): void {
    const prev = this.entities;
    this.entities = next;
    const ids = new Set([...Object.keys(prev), ...Object.keys(next)]);
    for (const id of ids) {
      if (prev[id] !== next[id]) this.listeners.get(id)?.forEach((l) => l());
    }
    this.allListeners.forEach((l) => l());
  }

  clear(): void {
    this.set({});
  }

  get = (id: string): HassEntity | undefined => this.entities[id];
  getAll = (): HassEntities => this.entities;

  subscribe = (id: string, listener: Listener): (() => void) => {
    let set = this.listeners.get(id);
    if (!set) this.listeners.set(id, (set = new Set()));
    set.add(listener);
    return () => {
      set.delete(listener);
    };
  };

  subscribeAll = (listener: Listener): (() => void) => {
    this.allListeners.add(listener);
    return () => {
      this.allListeners.delete(listener);
    };
  };
}
