"use client";

import { Btn, Card } from "@/components/ui";
import { useEntity, useRelatedSensorId } from "@/hooks/useEntity";
import { useService } from "@/hooks/useService";
import { num, strList } from "@/lib/ha/features";
import { nameOf, target } from "./helpers";

const STATE_FR: Record<string, string> = {
  cleaning: "Nettoie",
  docked: "À la base",
  idle: "Inactif",
  paused: "En pause",
  returning: "Retour à la base",
  error: "Erreur",
};

/** Robot vacuum: start / pause / return to base, battery, suction modes read from fan_speed_list. */
export function VacuumCard({ entityId }: { entityId: string }) {
  const { entity, availability } = useEntity(entityId);
  const batteryId = useRelatedSensorId(entityId, "battery");
  const batterySensor = useEntity(batteryId ?? "sensor.none");
  const start = useService("vacuum", "start");
  const pause = useService("vacuum", "pause");
  const home = useService("vacuum", "return_to_base");
  const fan = useService("vacuum", "set_fan_speed");

  const state = entity?.state ?? "unknown";
  // Battery: legacy attribute if HA still sends it, else a related battery sensor.
  const battery = num(entity?.attributes.battery_level) ?? num(batterySensor.entity?.state);
  const speeds = strList(entity?.attributes.fan_speed_list);
  const speed = entity?.attributes.fan_speed;
  const t = target(entityId);

  return (
    <Card
      title={nameOf(entity, entityId)}
      subtitle={entityId}
      offline={availability === "unavailable"}
      badge={availability === "stale" ? "périmé" : battery !== undefined ? `${Math.round(battery)} %` : undefined}
    >
      <p className="text-sm">{STATE_FR[state] ?? state}</p>
      <div className="grid grid-cols-3 gap-2">
        <Btn disabled={state === "cleaning" || start.pending} onClick={() => void start.call(undefined, t)}>
          Démarrer
        </Btn>
        <Btn disabled={state !== "cleaning" || pause.pending} onClick={() => void pause.call(undefined, t)}>
          Pause
        </Btn>
        <Btn disabled={state === "docked" || state === "returning" || home.pending} onClick={() => void home.call(undefined, t)}>
          Base
        </Btn>
      </div>
      {speeds.length > 0 && (
        <div>
          <p className="mb-1 text-xs text-muted">Aspiration</p>
          <div className="flex flex-wrap gap-2">
            {speeds.map((s) => (
              <Btn key={s} active={s === speed} disabled={fan.pending} onClick={() => void fan.call({ fan_speed: s }, t)}>
                {s}
              </Btn>
            ))}
          </div>
        </div>
      )}
      {[start, pause, home, fan].map((s) => s.error).find(Boolean) && (
        <p className="text-xs text-bad">{[start, pause, home, fan].map((s) => s.error).find(Boolean)}</p>
      )}
    </Card>
  );
}
