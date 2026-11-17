"use client";

import { useEffect } from "react";
import { CATEGORY_META, SEVERITY_META, type GEEvent } from "@/lib/events";

const ATTACK_LABEL: Record<GEEvent["attackStatus"], string> = {
  attack: "ATTACK-ATTRIBUTED",
  none: "NO ATTACK EVIDENCE",
  unclear: "ATTRIBUTION UNCLEAR",
  rumor: "UNVERIFIED RUMOR",
};

const ATTACK_COLOR: Record<GEEvent["attackStatus"], string> = {
  attack: "border-red-500/60 bg-red-500/10 text-red-300",
  none: "border-emerald-500/50 bg-emerald-500/10 text-emerald-300",
  unclear: "border-amber-500/50 bg-amber-500/10 text-amber-300",
  rumor: "border-zinc-500/50 bg-zinc-500/10 text-zinc-300",
};

interface EventModalProps {
  event: GEEvent;
  onClose: () => void;
  onJump: (e: GEEvent) => void;
}

function fmt(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    timeZone: "UTC",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).replace(",", "") + " UTC";
}

export function EventModal({ event, onClose, onJump }: EventModalProps) {
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const cat = CATEGORY_META[event.category];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={event.title}
    >
      <div
        className="relative max-h-[85vh] w-full max-w-2xl overflow-y-auto border bg-[#0a0908] p-5 shadow-[0_0_40px_rgba(255,196,0,0.08)]"
        style={{ borderColor: `${cat.color}55` }}
        onClick={(ev) => ev.stopPropagation()}
      >
        {/* corner brackets */}
        <div className="pointer-events-none absolute left-0 top-0 h-3 w-3 border-l-2 border-t-2" style={{ borderColor: cat.color }} />
        <div className="pointer-events-none absolute right-0 top-0 h-3 w-3 border-r-2 border-t-2" style={{ borderColor: cat.color }} />
        <div className="pointer-events-none absolute bottom-0 left-0 h-3 w-3 border-b-2 border-l-2" style={{ borderColor: cat.color }} />
        <div className="pointer-events-none absolute bottom-0 right-0 h-3 w-3 border-b-2 border-r-2" style={{ borderColor: cat.color }} />

        <div className="mb-1 flex items-center justify-between">
          <span className="text-[10px] tracking-[0.3em]" style={{ color: cat.color }}>
            {cat.label.toUpperCase()}
          </span>
          <button
            onClick={onClose}
            className="border border-zinc-600 px-2 py-0.5 text-[10px] tracking-widest text-zinc-400 hover:border-amber-400 hover:text-amber-300"
            aria-label="Close"
          >
            ESC ✕
          </button>
        </div>

        <h2 className="mb-3 text-lg font-semibold leading-snug text-amber-50">{event.title}</h2>

        <div className="mb-4 flex flex-wrap gap-2 text-[10px] tracking-widest">
          <span className={`border px-2 py-1 ${ATTACK_COLOR[event.attackStatus]}`}>
            {ATTACK_LABEL[event.attackStatus]}
          </span>
          <span className="border border-zinc-600 bg-zinc-900 px-2 py-1 text-zinc-300">
            {SEVERITY_META[event.severity].label}
          </span>
          <span className="border border-zinc-600 bg-zinc-900 px-2 py-1 text-zinc-300">
            {fmt(event.ts)} · {event.tsPrecision === "day" ? "DATE-LEVEL PRECISION" : event.tsPrecision === "approx" ? "TIME APPROX." : "TIME VERIFIED"}
          </span>
          {event.duration && (
            <span className="border border-zinc-600 bg-zinc-900 px-2 py-1 text-zinc-300">DUR: {event.duration}</span>
          )}
        </div>

        <div className="space-y-3 text-sm leading-relaxed text-zinc-300">
          <p>{event.summary}</p>
          {event.impact && (
            <div>
              <h3 className="mb-1 text-[10px] tracking-[0.3em] text-amber-400/90">▸ IMPACT</h3>
              <p>{event.impact}</p>
            </div>
          )}
          {event.cause && (
            <div>
              <h3 className="mb-1 text-[10px] tracking-[0.3em] text-amber-400/90">▸ ROOT CAUSE / VECTOR</h3>
              <p>{event.cause}</p>
            </div>
          )}
          {event.response && (
            <div>
              <h3 className="mb-1 text-[10px] tracking-[0.3em] text-amber-400/90">▸ RESPONSE</h3>
              <p>{event.response}</p>
            </div>
          )}
          <div>
            <h3 className="mb-1 text-[10px] tracking-[0.3em] text-amber-400/90">▸ GEOLOCATION</h3>
            <p className="font-mono text-xs text-zinc-400">
              {event.location.label} — {event.location.lat.toFixed(2)}°, {event.location.lng.toFixed(2)}°
            </p>
          </div>
          <div>
            <h3 className="mb-1 text-[10px] tracking-[0.3em] text-amber-400/90">▸ SOURCES ({event.sources.length})</h3>
            <ul className="space-y-1">
              {event.sources.map((s, i) => (
                <li key={i} className="text-xs">
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-300 underline decoration-teal-300/30 hover:decoration-teal-300"
                  >
                    [{s.outlet}] {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <button
            onClick={() => onJump(event)}
            className="border border-amber-400/70 bg-amber-400/10 px-4 py-2 text-[11px] tracking-[0.25em] text-amber-300 transition hover:bg-amber-400/20"
          >
            ▶ SYNC TIMELINE TO EVENT
          </button>
          <button
            onClick={onClose}
            className="border border-zinc-600 px-4 py-2 text-[11px] tracking-[0.25em] text-zinc-400 transition hover:border-zinc-400 hover:text-zinc-200"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}
