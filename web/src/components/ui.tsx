"use client";

import { useState, type ReactNode } from "react";
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback";

export function Card({
  title,
  subtitle,
  badge,
  offline,
  children,
}: {
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  offline?: boolean;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line bg-card p-4">
      <header className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-medium">{title}</h3>
          {subtitle && <p className="truncate text-xs text-muted">{subtitle}</p>}
        </div>
        <div className="shrink-0 text-sm text-muted">{offline ? <span className="text-warn">Hors ligne</span> : badge}</div>
      </header>
      {/* A disabled fieldset disables every control inside (offline / stale device). */}
      <fieldset disabled={offline} className="m-0 min-w-0 border-0 p-0 disabled:opacity-50">
        <div className="space-y-3">{children}</div>
      </fieldset>
    </section>
  );
}

export function Btn({
  children,
  onClick,
  active,
  disabled,
  label,
  className = "",
}: {
  children: ReactNode;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`min-h-11 min-w-11 rounded-xl border px-3 text-sm font-medium transition active:scale-95 disabled:opacity-40 ${
        active ? "border-accent bg-accent text-black" : "border-line bg-surface text-ink"
      } ${className}`}
    >
      {children}
    </button>
  );
}

/** Range input: follows the entity value, shows the drag value locally, commits debounced. */
export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  unit = "",
  onCommit,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onCommit: (v: number) => Promise<unknown> | void;
}) {
  const [local, setLocal] = useState<number | null>(null);
  const commit = useDebouncedCallback((v: number) => {
    void Promise.resolve(onCommit(v)).finally(() => setLocal(null));
  }, 250);
  const shown = local ?? value;
  return (
    <label className="block text-sm">
      <span className="flex justify-between text-muted">
        <span>{label}</span>
        <span>
          {Math.round(shown)}
          {unit}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={shown}
        onChange={(e) => {
          const v = Number(e.target.value);
          setLocal(v);
          commit(v);
        }}
        className="mt-1 h-8 w-full accent-accent"
      />
    </label>
  );
}
