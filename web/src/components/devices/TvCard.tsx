"use client";

import { Btn, Card, Slider } from "@/components/ui";
import { useEntity } from "@/hooks/useEntity";
import { useService } from "@/hooks/useService";
import { hasFeature, MP, num, strList } from "@/lib/ha/features";
import { isFireTv } from "@/config/devices";
import { NavPad } from "./NavPad";
import { nameOf, target } from "./helpers";

/** TV / streaming box: power, volume, source, and for Fire TV the d-pad and app shortcuts. */
export function TvCard({ entityId }: { entityId: string }) {
  const { entity, availability } = useEntity(entityId);
  const power = useService("media_player", "toggle");
  const volUp = useService("media_player", "volume_up");
  const volDown = useService("media_player", "volume_down");
  const mute = useService("media_player", "volume_mute");
  const volSet = useService("media_player", "volume_set");
  const source = useService("media_player", "select_source");

  const t = target(entityId);
  const off = entity?.state === "off" || entity?.state === "standby";
  const sources = strList(entity?.attributes.source_list);
  const current = entity?.attributes.source;
  const volume = num(entity?.attributes.volume_level);
  const muted = entity?.attributes.is_volume_muted === true;
  const fire = isFireTv(entityId);
  const canVol = hasFeature(entity, MP.VOLUME_STEP) || hasFeature(entity, MP.VOLUME_SET);

  return (
    <Card title={nameOf(entity, entityId)} subtitle={entityId} offline={availability === "unavailable"} badge={availability === "stale" ? "périmé" : entity?.state}>
      <Btn active={!off} disabled={power.pending} onClick={() => void power.call(undefined, t)} className="w-full">
        {off ? "Allumer" : "Éteindre"}
      </Btn>
      {!off && (
        <>
          {canVol && (
            <div className="flex items-center gap-2">
              <Btn label="Volume -" onClick={() => void volDown.call(undefined, t)}>−</Btn>
              <Btn label="Muet" active={muted} onClick={() => void mute.call({ is_volume_muted: !muted }, t)}>Muet</Btn>
              <Btn label="Volume +" onClick={() => void volUp.call(undefined, t)}>+</Btn>
            </div>
          )}
          {volume !== undefined && hasFeature(entity, MP.VOLUME_SET) && (
            <Slider label="Volume" unit=" %" min={0} max={100} value={volume * 100} onCommit={(v) => volSet.call({ volume_level: v / 100 }, t)} />
          )}
          {sources.length > 0 &&
            (fire ? (
              <div>
                <p className="mb-1 text-xs text-muted">Applications</p>
                <div className="flex flex-wrap gap-2">
                  {sources.map((s) => (
                    <Btn key={s} active={s === current} onClick={() => void source.call({ source: s }, t)}>
                      {s}
                    </Btn>
                  ))}
                </div>
              </div>
            ) : (
              <label className="block text-sm">
                <span className="text-muted">Source</span>
                <select
                  value={typeof current === "string" ? current : ""}
                  onChange={(e) => void source.call({ source: e.target.value }, t)}
                  className="mt-1 min-h-11 w-full rounded-xl border border-line bg-surface px-3"
                >
                  {typeof current !== "string" && <option value="">—</option>}
                  {sources.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          {fire && <NavPad entityId={entityId} />}
        </>
      )}
      {[power, volUp, volDown, mute, volSet, source].map((s) => s.error).find(Boolean) && (
        <p className="text-xs text-bad">{[power, volUp, volDown, mute, volSet, source].map((s) => s.error).find(Boolean)}</p>
      )}
    </Card>
  );
}
