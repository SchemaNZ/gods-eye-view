"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type ComponentType, type Ref } from "react";
import type { GlobeMethods } from "react-globe.gl";
import { CATEGORY_META, type GEEvent } from "@/lib/events";

interface PointDatum {
  lat: number;
  lng: number;
  color: string;
  altitude: number;
  radius: number;
  label: string;
  event: GEEvent;
}

interface RingDatum {
  lat: number;
  lng: number;
  color: string;
  maxR: number;
  speed: number;
  period: number;
}

interface LabelDatum {
  lat: number;
  lng: number;
  text: string;
  color: string;
  size: number;
  altitude: number;
}

interface GlobeProps {
  ref?: Ref<GlobeMethods>;
  width?: number;
  height?: number;
  globeImageUrl?: string;
  backgroundColor?: string;
  showAtmosphere?: boolean;
  atmosphereColor?: string;
  atmosphereAltitude?: number;
  showGraticules?: boolean;
  pointsData?: PointDatum[];
  pointColor?: (d: object) => string;
  pointAltitude?: (d: object) => number;
  pointRadius?: (d: object) => number;
  pointLabel?: (d: object) => string;
  onPointClick?: (d: object) => void;
  ringsData?: RingDatum[];
  ringColor?: (d: object) => (t: number) => string;
  ringMaxRadius?: (d: object) => number;
  ringPropagationSpeed?: (d: object) => number;
  ringRepeatPeriod?: (d: object) => number;
  ringAltitude?: number;
  labelsData?: LabelDatum[];
  labelText?: (d: object) => string;
  labelSize?: (d: object) => number;
  labelColor?: (d: object) => string;
  labelDot?: boolean;
  labelResolution?: number;
  labelAltitude?: (d: object) => number;
  onGlobeReady?: () => void;
}

const Globe = dynamic(() => import("react-globe.gl"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-amber-500/30 border-t-amber-400" />
        <p className="text-xs tracking-[0.3em] text-amber-200/60">ACQUIRING ORBITAL VIEW…</p>
      </div>
    </div>
  ),
}) as unknown as ComponentType<GlobeProps>;

// Self-hosted (was an unpinned unpkg.com URL — third-party runtime fetch)
const EARTH_TEX = "/earth-dark.jpg";

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

export interface GlobeHandle {
  flyTo: (lat: number, lng: number) => void;
}

interface GlobePanelProps {
  visibleEvents: GEEvent[];
  ringEvents: GEEvent[];
  labelEvents: GEEvent[];
  selectedId: string | null;
  onSelect: (e: GEEvent) => void;
  onReady: (handle: GlobeHandle) => void;
}

const SEV_RANK: Record<GEEvent["severity"], number> = {
  info: 0,
  minor: 1,
  moderate: 2,
  major: 3,
  critical: 4,
};

export function GlobePanel({ visibleEvents, ringEvents, labelEvents, selectedId, onSelect, onReady }: GlobePanelProps) {
  const globeRef = useRef<GlobeMethods | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 800, h: 500 });
  const [ready, setReady] = useState(false);

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

  const points: PointDatum[] = visibleEvents.map((e) => {
    const sevRank = SEV_RANK[e.severity];
    return {
      lat: e.location.lat,
      lng: e.location.lng,
      color: CATEGORY_META[e.category].color,
      altitude: 0.02 + sevRank * 0.015,
      radius: 0.28 + sevRank * 0.16,
      label: `<div style="font-family:ui-monospace,monospace;max-width:320px;background:rgba(5,4,4,0.92);border:1px solid ${CATEGORY_META[e.category].color}55;padding:6px 8px;border-radius:2px;color:#f5f0e6;font-size:11px"><b style="color:${CATEGORY_META[e.category].color}">${CATEGORY_META[e.category].short}</b> · ${e.title}</div>`,
      event: e,
    };
  });

  const rings: RingDatum[] = ringEvents.map((e) => {
    const sevRank = SEV_RANK[e.severity];
    return {
      lat: e.location.lat,
      lng: e.location.lng,
      color: CATEGORY_META[e.category].color,
      maxR: 2.2 + sevRank * 1.1,
      speed: 1.4,
      period: 500 + (4 - sevRank) * 350,
    };
  });

  const labels: LabelDatum[] = labelEvents.map((e) => ({
    lat: e.location.lat,
    lng: e.location.lng,
    text: e.title.length > 34 ? e.title.slice(0, 33).toUpperCase() + "…" : e.title.toUpperCase(),
    color: CATEGORY_META[e.category].color,
    size: 0.62,
    altitude: 0.09,
  }));

  const ringColorFn = (d: object) => {
    const rgb = hexToRgb((d as RingDatum).color);
    return (t: number) => `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${Math.max(0, 0.85 * (1 - t))})`;
  };

  const selected = visibleEvents.find((e) => e.id === selectedId);

  useEffect(() => {
    if (!ready) return;
    onReady({
      flyTo: (lat: number, lng: number) => {
        const g = globeRef.current;
        if (!g) return;
        const ctrl = g.controls() as unknown as { autoRotate: boolean };
        ctrl.autoRotate = false;
        g.pointOfView({ lat, lng, altitude: 1.8 }, 900);
      },
    });
  }, [ready]);

  return (
    <div ref={wrapRef} className="relative h-full w-full overflow-hidden">
      <Globe
        ref={globeRef as Ref<GlobeMethods>}
        width={size.w}
        height={size.h}
        globeImageUrl={EARTH_TEX}
        backgroundColor="rgba(0,0,0,0)"
        showAtmosphere
        atmosphereColor="#ffb347"
        atmosphereAltitude={0.16}
        showGraticules
        pointsData={points}
        pointColor={(d: object) => (d as PointDatum).color}
        pointAltitude={(d: object) => (d as PointDatum).altitude}
        pointRadius={(d: object) => (d as PointDatum).radius}
        pointLabel={(d: object) => (d as PointDatum).label}
        onPointClick={(d: object) => onSelect((d as PointDatum).event)}
        ringsData={rings}
        ringColor={ringColorFn}
        ringMaxRadius={(d: object) => (d as RingDatum).maxR}
        ringPropagationSpeed={(d: object) => (d as RingDatum).speed}
        ringRepeatPeriod={(d: object) => (d as RingDatum).period}
        ringAltitude={0.012}
        labelsData={labels}
        labelText={(d: object) => (d as LabelDatum).text}
        labelSize={(d: object) => (d as LabelDatum).size}
        labelColor={(d: object) => (d as LabelDatum).color}
        labelDot={false}
        labelResolution={2}
        labelAltitude={(d: object) => (d as LabelDatum).altitude}
        onGlobeReady={() => {
          const g = globeRef.current;
          if (g) {
            const ctrl = g.controls() as unknown as { autoRotate: boolean; autoRotateSpeed: number };
            ctrl.autoRotate = true;
            ctrl.autoRotateSpeed = 0.45;
            g.pointOfView({ lat: 28, lng: 15, altitude: 2.4 }, 0);
          }
          setReady(true);
        }}
      />

      {selected && (
        <div className="pointer-events-none absolute left-3 top-3 z-10 border border-amber-400/50 bg-black/80 px-3 py-2 text-[10px] tracking-widest text-amber-200/90">
          TRACKING ▸ {selected.location.label.toUpperCase()}
        </div>
      )}
    </div>
  );
}
