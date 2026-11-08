"use client";

import { callService } from "home-assistant-js-websocket";
import { useState } from "react";
import { Btn, Card, Slider } from "@/components/ui";
import { useEntity } from "@/hooks/useEntity";
import { useService } from "@/hooks/useService";
import { useHa } from "@/providers/HaProvider";
import { num } from "@/lib/ha/features";
import { objectId } from "@/config/devices";
import { nameOf, target } from "./helpers";

function AlexaRow({ entityId }: { entityId: string }) {
  const { entity, availability } = useEntity(entityId);
  const playPause = useService("media_player", "media_play_pause");
  const volSet = useService("media_player", "volume_set");
  const t = target(entityId);
  const volume = num(entity?.attributes.volume_level);
  return (
    <Card title={nameOf(entity, entityId)} subtitle={entityId} offline={availability === "unavailable"} badge={availability === "stale" ? "périmé" : entity?.state}>
      <div className="flex items-center gap-3">
        <Btn label="Lecture / pause" active={entity?.state === "playing"} onClick={() => void playPause.call(undefined, t)}>
          {entity?.state === "playing" ? "⏸ Pause" : "▶ Lecture"}
        </Btn>
      </div>
      {volume !== undefined && (
        <Slider label="Volume" unit=" %" min={0} max={100} value={volume * 100} onCommit={(v) => volSet.call({ volume_level: v / 100 }, t)} />
      )}
    </Card>
  );
}

/**
 * Alexa devices: playback + volume per device, one master volume for all, and text-to-speech.
 * TTS uses notify.alexa_media_<object_id> with data.type = "tts" (Alexa Media Player convention:
 * confirm the exact notify service names in Developer Tools > Services).
 */
export function AlexaPanel({ entityIds }: { entityIds: readonly string[] }) {
  const { connection, status } = useHa();
  const [text, setText] = useState("");
  const [targetId, setTargetId] = useState<string>(entityIds[0] ?? "");
  const [info, setInfo] = useState<{ ok: boolean; msg: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [master, setMaster] = useState(0.3);

  const online = !!connection && status === "connected";

  async function speak() {
    if (!connection || !targetId || !text.trim()) return;
    setBusy(true);
    setInfo(null);
    try {
      await callService(connection, "notify", `alexa_media_${objectId(targetId)}`, { message: text.trim(), data: { type: "tts" } });
      setInfo({ ok: true, msg: "Message envoyé." });
      setText("");
    } catch (err) {
      setInfo({ ok: false, msg: err instanceof Error ? err.message : "Échec (service notify introuvable ?)" });
    } finally {
      setBusy(false);
    }
  }

  async function setAll(v: number) {
    if (!connection) return;
    setMaster(v);
    await callService(connection, "media_player", "volume_set", { volume_level: v }, { entity_id: [...entityIds] }).catch(() => undefined);
  }

  return (
    <div className="space-y-4">
      <Card title="Volume général" subtitle="Tous les appareils Alexa" offline={!online}>
        <Slider label="Volume" unit=" %" min={0} max={100} value={master * 100} onCommit={(v) => setAll(v / 100)} />
      </Card>
      <Card title="Parler (TTS)" subtitle="Annonce vocale sur un appareil" offline={!online}>
        <label className="block text-sm">
          <span className="text-muted">Appareil</span>
          <select value={targetId} onChange={(e) => setTargetId(e.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-line bg-surface px-3">
            {entityIds.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-muted">Message</span>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} maxLength={250} className="mt-1 w-full rounded-xl border border-line bg-surface p-3" />
        </label>
        <Btn active disabled={busy || !text.trim()} onClick={() => void speak()} className="w-full">
          {busy ? "Envoi…" : "Envoyer"}
        </Btn>
        {info && <p className={`text-xs ${info.ok ? "text-ok" : "text-bad"}`}>{info.msg}</p>}
      </Card>
      {entityIds.map((id) => (
        <AlexaRow key={id} entityId={id} />
      ))}
    </div>
  );
}
