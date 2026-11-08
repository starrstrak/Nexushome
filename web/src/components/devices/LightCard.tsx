"use client";

import { Btn, Card, Slider } from "@/components/ui";
import { useEntity } from "@/hooks/useEntity";
import { useService } from "@/hooks/useService";
import { num, strList } from "@/lib/ha/features";
import { ColorWheel } from "./ColorWheel";
import { nameOf, target } from "./helpers";

const COLOR_MODES = ["hs", "rgb", "rgbw", "rgbww", "xy"];

/** Light (WiZ): toggle, brightness, white temperature, colour wheel — each shown only if supported. */
export function LightCard({ entityId }: { entityId: string }) {
  const { entity, availability } = useEntity(entityId);
  const toggle = useService("light", "toggle");
  const turnOn = useService("light", "turn_on");

  const modes = strList(entity?.attributes.supported_color_modes);
  const hasBrightness = modes.length === 0 ? entity?.attributes.brightness !== undefined : modes.some((m) => m !== "onoff");
  const hasTemp = modes.includes("color_temp");
  const hasColor = modes.some((m) => COLOR_MODES.includes(m));

  const on = entity?.state === "on";
  const brightness = num(entity?.attributes.brightness);
  const kelvin = num(entity?.attributes.color_temp_kelvin);
  const minK = num(entity?.attributes.min_color_temp_kelvin) ?? 2200;
  const maxK = num(entity?.attributes.max_color_temp_kelvin) ?? 6500;
  const hsRaw = entity?.attributes.hs_color;
  const hs: readonly [number, number] =
    Array.isArray(hsRaw) && typeof hsRaw[0] === "number" && typeof hsRaw[1] === "number" ? [hsRaw[0], hsRaw[1]] : [0, 0];

  const light = (data: Record<string, unknown>) => turnOn.call(data, target(entityId));

  return (
    <Card title={nameOf(entity, entityId)} subtitle={entityId} offline={availability === "unavailable"} badge={availability === "stale" ? "périmé" : undefined}>
      <Btn active={on} disabled={toggle.pending} onClick={() => void toggle.call(undefined, target(entityId))} className="w-full">
        {on ? "Allumée" : "Éteinte"}
      </Btn>
      {on && hasBrightness && (
        <Slider label="Luminosité" unit=" %" min={1} max={100} value={Math.round(((brightness ?? 255) / 255) * 100)} onCommit={(v) => light({ brightness_pct: v })} />
      )}
      {on && hasTemp && (
        <Slider label="Blanc" unit=" K" min={minK} max={maxK} step={50} value={kelvin ?? minK} onCommit={(v) => light({ color_temp_kelvin: v })} />
      )}
      {on && hasColor && <ColorWheel value={hs} onPick={(c) => void light({ hs_color: [c[0], c[1]] })} />}
      {(toggle.error || turnOn.error) && <p className="text-xs text-bad">{toggle.error ?? turnOn.error}</p>}
    </Card>
  );
}
