"use client";

import { ConnectionBadge } from "@/components/ConnectionBadge";
import { ConnectionBanner } from "@/components/ConnectionBanner";
import { DeviceTabs } from "@/components/DeviceTabs";
import { isDemo } from "@/lib/ha/demo";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Nexushome</h1>
        <ConnectionBadge />
      </header>
      {isDemo && (
        <p className="mb-4 rounded-xl border border-warn/40 bg-card p-3 text-sm text-warn">
          Mode démo : données fictives, aucun Home Assistant connecté.
        </p>
      )}
      <ConnectionBanner />
      <DeviceTabs />
    </main>
  );
}
