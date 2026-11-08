"use client";

import { Btn, Card } from "@/components/ui";
import { useEntity, useRelatedSensorId } from "@/hooks/useEntity";
import { useService } from "@/hooks/useService";
import { num } from "@/lib/ha/features";
import { nameOf, target } from "./helpers";

/** Smart plug: on/off + live power in W (power sensor, else the current_power_w attribute). */
export function PlugCard({ entityId }: { entityId: string }) {
  const { entity, availability } = useEntity(entityId);
  const sensorId = useRelatedSensorId(entityId, "power");
  const sensor = useEntity(sensorId ?? "sensor.none");
  const toggle = useService("switch", "toggle");

  const watts = num(sensor.entity?.state) ?? num(entity?.attributes.current_power_w);
  const on = entity?.state === "on";

  return (
    <Card title={nameOf(entity, entityId)} subtitle={entityId} offline={availability === "unavailable"} badge={availability === "stale" ? "périmé" : undefined}>
      <div className="flex items-end justify-between">
        <p className="text-3xl font-semibold tabular-nums">
          {watts === undefined ? "—" : watts.toLocaleString("fr-CH", { maximumFractionDigits: 1 })}
          <span className="ml-1 text-base font-normal text-muted">W</span>
        </p>
        <Btn active={on} disabled={toggle.pending} onClick={() => void toggle.call(undefined, target(entityId))} className="w-28">
          {on ? "Allumée" : "Éteinte"}
        </Btn>
      </div>
      {toggle.error && <p className="text-xs text-bad">{toggle.error}</p>}
    </Card>
  );
}
