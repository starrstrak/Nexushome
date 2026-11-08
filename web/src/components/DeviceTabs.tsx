"use client";

import { useMemo, useState, type ReactNode } from "react";
import { isAlexa, isHidden } from "@/config/devices";
import { useEntityIds } from "@/hooks/useEntity";
import { domainOf } from "@/types/ha";
import { AlexaPanel } from "./devices/AlexaPanel";
import { LightCard } from "./devices/LightCard";
import { PlugCard } from "./devices/PlugCard";
import { TvCard } from "./devices/TvCard";
import { VacuumCard } from "./devices/VacuumCard";
import { EntityRow } from "./EntityRow";

type TabKey = "lights" | "plugs" | "vacuums" | "tv" | "alexa" | "all";

const LABEL: Record<TabKey, string> = {
  lights: "Lumières",
  plugs: "Prises",
  vacuums: "Aspirateurs",
  tv: "TV",
  alexa: "Alexa",
  all: "Entités",
};

const GRID = "grid gap-4 sm:grid-cols-2";

export function DeviceTabs() {
  const ids = useEntityIds();
  const [tab, setTab] = useState<TabKey>("lights");

  const groups = useMemo(() => {
    const visible = ids.filter((id) => !isHidden(id));
    return {
      lights: visible.filter((id) => domainOf(id) === "light"),
      plugs: visible.filter((id) => domainOf(id) === "switch" && !isAlexa(id)),
      vacuums: visible.filter((id) => domainOf(id) === "vacuum"),
      tv: visible.filter((id) => domainOf(id) === "media_player" && !isAlexa(id)),
      alexa: visible.filter((id) => domainOf(id) === "media_player" && isAlexa(id)),
      all: visible,
    } satisfies Record<TabKey, string[]>;
  }, [ids]);

  const tabs = (Object.keys(LABEL) as TabKey[]).filter((k) => k === "all" || groups[k].length > 0);
  const active: TabKey = tabs.includes(tab) ? tab : (tabs[0] ?? "all");

  let content: ReactNode;
  switch (active) {
    case "lights":
      content = <div className={GRID}>{groups.lights.map((id) => <LightCard key={id} entityId={id} />)}</div>;
      break;
    case "plugs":
      content = <div className={GRID}>{groups.plugs.map((id) => <PlugCard key={id} entityId={id} />)}</div>;
      break;
    case "vacuums":
      content = <div className={GRID}>{groups.vacuums.map((id) => <VacuumCard key={id} entityId={id} />)}</div>;
      break;
    case "tv":
      content = <div className={GRID}>{groups.tv.map((id) => <TvCard key={id} entityId={id} />)}</div>;
      break;
    case "alexa":
      content = <AlexaPanel entityIds={groups.alexa} />;
      break;
    case "all":
      content = (
        <ul className="divide-y divide-line rounded-2xl border border-line bg-card px-4">
          {groups.all.map((id) => <EntityRow key={id} entityId={id} />)}
        </ul>
      );
      break;
  }

  return (
    <>
      <div className="pb-24">{content}</div>
      <nav
        aria-label="Catégories"
        className="fixed inset-x-0 bottom-0 z-10 flex justify-around border-t border-line bg-surface/95 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur"
      >
        {tabs.map((k) => (
          <button
            key={k}
            type="button"
            aria-current={k === active ? "page" : undefined}
            onClick={() => setTab(k)}
            className={`min-h-14 flex-1 px-1 text-xs font-medium ${k === active ? "text-accent" : "text-muted"}`}
          >
            {LABEL[k]}
            <span className="block text-[10px] opacity-70">{k === "all" ? ids.length : groups[k].length}</span>
          </button>
        ))}
      </nav>
    </>
  );
}
