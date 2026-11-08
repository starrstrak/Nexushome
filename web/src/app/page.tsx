"use client";

import { ConnectionBadge } from "@/components/ConnectionBadge";
import { ConnectionBanner } from "@/components/ConnectionBanner";
import { EntityRow } from "@/components/EntityRow";
import { useAllEntities } from "@/hooks/useEntity";
import { isDemo } from "@/lib/ha/demo";
import { domainOf } from "@/types/ha";

// Domains useful for this project (Phase 2). Used to discover real entity ids.
const DOMAINS = ["light", "switch", "vacuum", "media_player", "sensor"] as const;

export default function HomePage() {
  const entities = useAllEntities();
  const ids = Object.keys(entities).sort();

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Nexushome</h1>
        <ConnectionBadge />
      </header>
      {isDemo && (
        <p className="mb-4 rounded-xl border border-warn/40 bg-card p-3 text-sm text-warn">Mode démo : données fictives, aucun Home Assistant connecté.</p>
      )}
      <ConnectionBanner />
      {DOMAINS.map((domain) => {
        const list = ids.filter((id) => domainOf(id) === domain);
        if (list.length === 0) return null;
        return (
          <section key={domain} className="mb-4 rounded-xl border border-line bg-card px-4 py-3">
            <h2 className="mb-1 text-sm font-medium uppercase tracking-wide text-muted">
              {domain} ({list.length})
            </h2>
            <ul className="divide-y divide-line">
              {list.map((id) => (
                <EntityRow key={id} entityId={id} />
              ))}
            </ul>
          </section>
        );
      })}
    </main>
  );
}
