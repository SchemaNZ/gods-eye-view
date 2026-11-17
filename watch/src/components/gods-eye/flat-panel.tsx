"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { geoEquirectangular, geoGraticule10, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import worldTopo from "world-atlas/countries-110m.json";
import { CATEGORY_META, type GEEvent } from "@/lib/events";

/* ---------- static world geometry (built once) ---------- */
const TOPO = worldTopo as unknown as Parameters<typeof feature>[0];
const LAND = feature(
  TOPO,
  (TOPO as unknown as { objects: Record<string, never> }).objects.countries
);

const SEV_RANK: Record<GEEvent["severity"], number> = {
  info: 0,
  minor: 1,
  moderate: 2,
  major: 3,
  critical: 4,
};

export interface FlatHandle {
  flyTo: (lat: number, lng: number) => void;
}

interface FlatPanelProps {
  visibleEvents: GEEvent[];
  ringEvents: GEEvent[];
  labelEvents: GEEvent[];
  selectedId: string | null;
  onSelect: (e: GEEvent) => void;
  onReady: (handle: FlatHandle) => void;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function FlatPanel({ visibleEvents, ringEvents, labelEvents, selectedId, onSelect, onReady }: FlatPanelProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState({ w: 800, h: 500 });
  const [view, setView] = useState({ k: 1, x: 0, y: 0 });
  const [hover, setHover] = useState<{ lat: number; lng: number } | null>(null);
  const viewRef = useRef(view);
  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  /* container sizing */
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      setSize({ w: Math.max(320, r.width), h: Math.max(300, r.height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* equirectangular projection fitted to the box */
  const projection = useMemo(() => {
    return geoEquirectangular().fitSize([size.w, size.h], { type: "Sphere" } as never);
  }, [size.w, size.h]);

  const pathGen = useMemo(() => geoPath(projection), [projection]);
  const landPath = useMemo(() => pathGen(LAND as never), [pathGen]);
  const gratPath = useMemo(() => pathGen(geoGraticule10() as never), [pathGen]);
  const spherePath = useMemo(() => pathGen({ type: "Sphere" } as never), [pathGen]);

  const proj = (lng: number, lat: number): [number, number] => {
    const p = projection([lng, lat]);
    return p ? [p[0], p[1]] : [-9999, -9999];
  };

  /* clamp pan so the map can't leave the frame */
  const clampView = (k: number, x: number, y: number, w: number, h: number) => ({
    k,
    x: clamp(x, w - k * w, 0),
    y: clamp(y, h - k * h, 0),
  });

  /* wheel zoom around pointer (non-passive so we can preventDefault) */
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (ev: WheelEvent) => {
      ev.preventDefault();
      const rect = svg.getBoundingClientRect();
      const px = ev.clientX - rect.left;
      const py = ev.clientY - rect.top;
      const { k, x, y } = viewRef.current;
      const k2 = clamp(k * Math.exp(-ev.deltaY * 0.0016), 1, 12);
      const nx = px - ((px - x) * k2) / k;
      const ny = py - ((py - y) * k2) / k;
      setView(clampView(k2, nx, ny, rect.width, rect.height));
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, []);

  /* drag to pan */
  const dragRef = useRef<{ sx: number; sy: number; vx: number; vy: number; moved: boolean } | null>(null);
  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    const { k, x, y } = viewRef.current;
    dragRef.current = { sx: e.clientX, sy: e.clientY, vx: x, vy: y, moved: false };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const drag = dragRef.current;
    if (drag) {
      const dx = e.clientX - drag.sx;
      const dy = e.clientY - drag.sy;
      if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true;
      const { k } = viewRef.current;
      setView(clampView(k, drag.vx + dx, drag.vy + dy, rect.width, rect.height));
    }
    /* hover lat/lng readout */
    const { k, x, y } = viewRef.current;
    const mx = (e.clientX - rect.left - x) / k;
    const my = (e.clientY - rect.top - y) / k;
    const inv = projection.invert?.([mx, my]);
    setHover(inv ? { lat: inv[1], lng: inv[0] } : null);
  };
  const onPointerUp = () => {
    setTimeout(() => {
      dragRef.current = null;
    }, 0);
  };
  const reset = () => setView({ k: 1, x: 0, y: 0 });

  /* handle */
  const handleRef = useRef<FlatHandle | null>(null);
  handleRef.current = {
    flyTo: (lat, lng) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const [px, py] = proj(lng, lat);
      const k2 = Math.max(viewRef.current.k, 3);
      setView(clampView(k2, rect.width / 2 - k2 * px, rect.height / 2 - k2 * py, rect.width, rect.height));
    },
  };
  useEffect(() => {
    onReady(handleRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* data layers */
  const markers = visibleEvents.map((e) => {
    const [x, y] = proj(e.location.lng, e.location.lat);
    return { e, x, y, r: 2.4 + SEV_RANK[e.severity] * 1.25, color: CATEGORY_META[e.category].color };
  });
  const rings = ringEvents.map((e) => {
    const [x, y] = proj(e.location.lng, e.location.lat);
    const sevRank = SEV_RANK[e.severity];
    return { x, y, color: CATEGORY_META[e.category].color, rMax: 6 + sevRank * 3.5, dur: (500 + (4 - sevRank) * 350) / 1000 };
  });
  const labels = labelEvents.map((e) => {
    const [x, y] = proj(e.location.lng, e.location.lat);
    return {
      x,
      y,
      text: e.title.length > 38 ? e.title.slice(0, 37).toUpperCase() + "…" : e.title.toUpperCase(),
      color: CATEGORY_META[e.category].color,
      e,
    };
  });
  const selected = markers.find((m) => m.e.id === selectedId);

  return (
    <div ref={wrapRef} className="relative h-full w-full overflow-hidden">
      <svg
        ref={svgRef}
        width={size.w}
        height={size.h}
        className="block cursor-crosshair touch-none select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={() => {
          setHover(null);
          onPointerUp();
        }}
        onDoubleClick={reset}
      >
        <defs>
          <radialGradient id="flat-ocean" cx="50%" cy="50%" r="75%">
            <stop offset="0%" stopColor="#0d0a06" />
            <stop offset="100%" stopColor="#050404" />
          </radialGradient>
        </defs>

        <rect width={size.w} height={size.h} fill="url(#flat-ocean)" />

        <g transform={`translate(${view.x},${view.y}) scale(${view.k})`}>
          <path d={spherePath} fill="#0a0805" stroke="#3a2f14" strokeWidth={1 / view.k} />
          <path d={gratPath} fill="none" stroke="#181a1e" strokeWidth={0.5 / view.k} />
          <path d={landPath} fill="#14171c" stroke="#2b2f36" strokeWidth={0.5 / view.k} />

          {/* scan rings */}
          {rings.map((r, i) => (
            <g key={i} pointerEvents="none">
              <circle cx={r.x} cy={r.y} fill="none" stroke={r.color} strokeWidth={1.1 / view.k}>
                <animate attributeName="r" values={`2;${r.rMax}`} dur={`${r.dur}s`} repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.85;0" dur={`${r.dur}s`} repeatCount="indefinite" />
              </circle>
            </g>
          ))}

          {/* markers */}
          {markers.map((m) => (
            <g key={m.e.id} transform={`translate(${m.x},${m.y})`}>
              <circle
                r={m.r}
                fill={m.color}
                stroke="#050404"
                strokeWidth={0.8 / view.k}
                opacity={m.e.id === selectedId ? 1 : 0.92}
                className="cursor-pointer"
                onClick={() => {
                  if (!dragRef.current?.moved) onSelect(m.e);
                }}
              />
              {m.e.id === selectedId && (
                <>
                  <circle r={m.r + 4} fill="none" stroke="#ffb347" strokeWidth={1 / view.k} strokeDasharray="3 2" />
                  <line x1={-(m.r + 12)} y1={0} x2={-(m.r + 4)} y2={0} stroke="#ffb347" strokeWidth={1 / view.k} />
                  <line x1={m.r + 4} y1={0} x2={m.r + 12} y2={0} stroke="#ffb347" strokeWidth={1 / view.k} />
                  <line x1={0} y1={-(m.r + 12)} x2={0} y2={-(m.r + 4)} stroke="#ffb347" strokeWidth={1 / view.k} />
                  <line x1={0} y1={m.r + 4} x2={0} y2={m.r + 12} stroke="#ffb347" strokeWidth={1 / view.k} />
                </>
              )}
            </g>
          ))}

          {/* labels for major+ events */}
          {labels.map((l, i) => (
            <text
              key={i}
              x={l.x + 7}
              y={l.y - 5}
              fill={l.color}
              opacity={0.75}
              fontSize={7}
              fontFamily="ui-monospace, SFMono-Regular, monospace"
              letterSpacing={0.5}
              pointerEvents="none"
              stroke="#050404"
              strokeWidth={2 / view.k}
              paintOrder="stroke"
            >
              {l.text}
            </text>
          ))}
        </g>
      </svg>

      {/* HUD chrome */}
      <div className="pointer-events-none absolute left-3 top-3 z-10 border border-amber-400/40 bg-black/80 px-3 py-2 text-[10px] tracking-widest text-amber-200/90">
        FLAT PROJECTION <span className="text-amber-500/60">{"//"}</span> EQUIRECTANGULAR
      </div>
      <div className="pointer-events-none absolute right-3 top-3 z-10 border border-amber-400/30 bg-black/70 px-2 py-1 text-[9px] tabular-nums tracking-widest text-amber-200/70">
        {hover
          ? `${Math.abs(hover.lat).toFixed(1)}°${hover.lat >= 0 ? "N" : "S"} ${Math.abs(hover.lng).toFixed(1)}°${hover.lng >= 0 ? "E" : "W"}`
          : "—— · ——"}
      </div>
      <div className="pointer-events-none absolute bottom-3 right-3 z-10 text-[9px] tracking-widest text-zinc-600">
        SCROLL=ZOOM · DRAG=PAN · DBLCLICK=RESET
      </div>
      {selected && (
        <div className="pointer-events-none absolute bottom-3 left-3 z-10 border border-amber-400/50 bg-black/80 px-3 py-2 text-[10px] tracking-widest text-amber-200/90">
          TRACKING ▸ {selected.e.location.label.toUpperCase()}
        </div>
      )}
    </div>
  );
}
