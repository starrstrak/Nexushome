"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";

type HS = readonly [number, number];

/**
 * Hue/saturation wheel. Value is [hue 0-360, saturation 0-100] (HA hs_color).
 * Marker position is set through the CSSOM (not a style attribute) to stay compatible with a strict CSP.
 */
export function ColorWheel({ value, onPick }: { value: HS; onPick: (hs: HS) => void }) {
  const wheel = useRef<HTMLDivElement>(null);
  const marker = useRef<HTMLSpanElement>(null);
  const dragging = useRef(false);
  const [local, setLocal] = useState<HS | null>(null);
  const shown = local ?? value;

  useEffect(() => {
    const m = marker.current;
    if (!m) return;
    const rad = ((shown[0] - 90) * Math.PI) / 180;
    const r = (shown[1] / 100) * 50;
    m.style.left = `${50 + Math.cos(rad) * r}%`;
    m.style.top = `${50 + Math.sin(rad) * r}%`;
  }, [shown]);

  function read(e: PointerEvent): HS | null {
    const el = wheel.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    let hue = (Math.atan2(y, x) * 180) / Math.PI + 90;
    if (hue < 0) hue += 360;
    const sat = Math.min(Math.hypot(x, y) / (rect.width / 2), 1) * 100;
    return [Math.round(hue), Math.round(sat)];
  }

  return (
    <div
      ref={wheel}
      role="slider"
      aria-label="Couleur"
      aria-valuetext={`teinte ${Math.round(shown[0])}°, saturation ${Math.round(shown[1])}%`}
      aria-valuenow={Math.round(shown[0])}
      aria-valuemin={0}
      aria-valuemax={360}
      tabIndex={0}
      onPointerDown={(e) => {
        dragging.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        const hs = read(e);
        if (hs) setLocal(hs);
      }}
      onPointerMove={(e) => {
        if (!dragging.current) return;
        const hs = read(e);
        if (hs) setLocal(hs);
      }}
      onPointerUp={(e) => {
        dragging.current = false;
        const hs = read(e);
        if (hs) onPick(hs);
        setLocal(null);
      }}
      onPointerCancel={() => {
        dragging.current = false;
        setLocal(null);
      }}
      className="relative mx-auto aspect-square w-full max-w-48 touch-none rounded-full bg-[conic-gradient(red,yellow,lime,cyan,blue,magenta,red)]"
    >
      <span className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_closest-side,white,transparent)]" />
      <span
        ref={marker}
        className="pointer-events-none absolute size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-transparent shadow-[0_0_0_1px_black]"
      />
    </div>
  );
}
