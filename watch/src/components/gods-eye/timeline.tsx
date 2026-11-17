"use client";

import { useCallback, useMemo, useRef } from "react";
import {
  CATEGORY_META,
  SEVERITY_META,
  type GEEvent,
} from "@/lib/events";

interface TimelineProps {
  events: GEEvent[];
  startMs: number;
  endMs: number;
  cursorMs: number;
  windowHours: number; // 0 = cumulative
  onCursorChange: (ms: number) => void;
  onTickClick: (e: GEEvent) => void;
}

const DAY = 24 * 3600 * 1000;

const SEV_H: Record<string, number> = {
  critical: 44,
  major: 34,
  moderate: 25,
  minor: 16,
  info: 11,
};

export function Timeline({
  events,
  startMs,
  endMs,
  cursorMs,
  windowHours,
  onCursorChange,
  onTickClick,
}: TimelineProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const range = endMs - startMs;

  const posOf = useCallback(
    (ts: number) => ((ts - startMs) / range) * 100,
    [startMs, range]
  );

  const jumpToClientX = useCallback(
    (clientX: number) => {
      const el = trackRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const pct = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      onCursorChange(startMs + pct * range);
    },
    [startMs, range, onCursorChange]
  );

  const onPointerDown = useCallback(
    (ev: React.PointerEvent) => {
      draggingRef.current = true;
      try {
        (ev.target as HTMLElement).setPointerCapture?.(ev.pointerId);
      } catch {
        // synthetic or invalid pointerId — scrubbing still works without capture
      }
      jumpToClientX(ev.clientX);
    },
    [jumpToClientX]
  );
  const onPointerMove = useCallback(
    (ev: React.PointerEvent) => {
      if (draggingRef.current) jumpToClientX(ev.clientX);
    },
    [jumpToClientX]
  );
  const onPointerUp = useCallback(() => {
    draggingRef.current = false;
  }, []);

  // day gridlines + date labels every 4 days
  const gridlines = useMemo(() => {
    const out: { pct: number; label: string | null }[] = [];
    const first = new Date(startMs);
    const dayStart = Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), first.getUTCDate());
    for (let t = dayStart; t <= endMs; t += DAY) {
      const pct = ((t - startMs) / range) * 100;
      if (pct < 0 || pct > 100) continue;
      const d = new Date(t);
      const label =
        d.getUTCDate() % 4 === 1
          ? `${d.getUTCDate().toString().padStart(2, "0")} ${d.toLocaleString("en-US", { month: "short", timeZone: "UTC" })}`
          : null;
      out.push({ pct, label });
    }
    return out;
  }, [startMs, endMs, range]);

  const shadeLeft = windowHours > 0 ? posOf(Math.max(startMs, cursorMs - windowHours * 3600 * 1000)) : 0;

  return (
    <div className="select-none">
      <div
        ref={trackRef}
        className="relative h-24 w-full cursor-ew-resize touch-none border border-amber-500/20 bg-black/60"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        role="slider"
        aria-label="Timeline scrubber"
        aria-valuemin={startMs}
        aria-valuemax={endMs}
        aria-valuenow={cursorMs}
        tabIndex={0}
        onKeyDown={(ev) => {
          if (ev.key === "ArrowLeft") onCursorChange(Math.max(startMs, cursorMs - 6 * 3600 * 1000));
          if (ev.key === "ArrowRight") onCursorChange(Math.min(endMs, cursorMs + 6 * 3600 * 1000));
        }}
      >
        {/* day grid */}
        {gridlines.map((g, i) => (
          <div key={i} className="absolute inset-y-0 w-px bg-amber-500/10" style={{ left: `${g.pct}%` }}>
            {g.label && (
              <span className="absolute bottom-0 left-1 -translate-x-1/2 text-[9px] tracking-wider text-amber-200/30">
                {g.label}
              </span>
            )}
          </div>
        ))}

        {/* scan window shade */}
        {windowHours > 0 && (
          <div
            className="absolute inset-y-0 border-x border-amber-400/25 bg-amber-400/[0.06]"
            style={{ left: `${shadeLeft}%`, width: `${posOf(cursorMs) - shadeLeft}%` }}
          />
        )}

        {/* event ticks */}
        {events.map((e) => {
          const pct = posOf(new Date(e.ts).getTime());
          const h = SEV_H[e.severity] ?? 16;
          const active = new Date(e.ts).getTime() <= cursorMs;
          const c = CATEGORY_META[e.category].color;
          return (
            <button
              key={e.id}
              title={`${e.title}`}
              className="absolute bottom-3 w-1.5 -translate-x-1/2 rounded-t transition-all hover:w-2.5"
              style={{
                left: `${pct}%`,
                height: `${h}px`,
                background: c,
                opacity: active ? 1 : 0.28,
                boxShadow: active ? `0 0 8px ${c}` : "none",
              }}
              onPointerDown={(ev) => {
                ev.stopPropagation();
              }}
              onClick={(ev) => {
                ev.stopPropagation();
                onTickClick(e);
              }}
            />
          );
        })}

        {/* cursor */}
        <div
          className="pointer-events-none absolute inset-y-0 z-10 w-px bg-amber-300"
          style={{ left: `${posOf(cursorMs)}%`, boxShadow: "0 0 12px rgba(255,196,0,0.9)" }}
        >
          <div className="absolute -top-px left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 bg-amber-300" />
          <div className="absolute -bottom-0.5 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-amber-300" />
        </div>
      </div>
    </div>
  );
}

export function severityLabel(s: GEEvent["severity"]) {
  return SEVERITY_META[s].label;
}
