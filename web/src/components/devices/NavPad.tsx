"use client";

import { Btn } from "@/components/ui";
import { useService } from "@/hooks/useService";
import { target } from "./helpers";

// Key names for androidtv.adb_command. Verify against the Android Debug Bridge integration docs.
const KEYS = { up: "UP", down: "DOWN", left: "LEFT", right: "RIGHT", ok: "ENTER", back: "BACK", home: "HOME" } as const;

/** D-pad for Fire TV through the androidtv.adb_command service. */
export function NavPad({ entityId }: { entityId: string }) {
  const adb = useService("androidtv", "adb_command");
  const send = (command: string) => void adb.call({ command }, target(entityId));
  return (
    <div>
      <div className="mx-auto grid w-48 grid-cols-3 gap-2">
        <span />
        <Btn label="Haut" onClick={() => send(KEYS.up)}>▲</Btn>
        <span />
        <Btn label="Gauche" onClick={() => send(KEYS.left)}>◀</Btn>
        <Btn label="OK" onClick={() => send(KEYS.ok)} active>OK</Btn>
        <Btn label="Droite" onClick={() => send(KEYS.right)}>▶</Btn>
        <Btn label="Retour" onClick={() => send(KEYS.back)}>↩</Btn>
        <Btn label="Bas" onClick={() => send(KEYS.down)}>▼</Btn>
        <Btn label="Accueil" onClick={() => send(KEYS.home)}>⌂</Btn>
      </div>
      {adb.error && <p className="mt-2 text-center text-xs text-bad">{adb.error}</p>}
    </div>
  );
}
