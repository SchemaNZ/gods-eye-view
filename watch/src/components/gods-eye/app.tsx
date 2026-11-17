"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CATEGORY_META,
  DATA_CUTOFF,
  EVENTS,
  PATTERNS,
  SEVERITY_META,
  WINDOW_END,
  WINDOW_START,
  type Category,
  type GEEvent,
  type Severity,
} from "@/lib/events";
import { GlobePanel, type GlobeHandle } from "./globe-panel";
import { FlatPanel, type FlatHandle } from "./flat-panel";
import { Timeline } from "./timeline";
import { EventModal } from "./event-modal";

const HOUR = 3600 * 1000;
const DAY_MS = 24 * HOUR;

const fmtClock = (ms: number) => {
  const d = new Date(ms);
  const dd = d
    .toLocaleString("en-GB", { timeZone: "UTC", day: "2-digit", month: "short" })
    .toUpperCase();
  const hh = `${d.getUTCHours().toString().padStart(2, "0")}:${d.getUTCMinutes().toString().padStart(2, "0")}Z`;
  return `${dd} · ${hh}`;
};

const fmtDelta = (ms: number) => {
  const diff = Math.max(0, ms - new Date(WINDOW_START).getTime());
  const d = Math.floor(diff / DAY_MS);
  const h = Math.floor((diff % DAY_MS) / HOUR);
  return `T+${d.toString().padStart(2, "0")}D ${h.toString().padStart(2, "0")}H`;
};

const ALL_CATEGORIES = Object.keys(CATEGORY_META) as Category[];
const SPEEDS = [1, 6, 24];

export function GodsEyeApp() {
  const startMs = useMemo(() => new Date(WINDOW_START).getTime(), []);
  const endMs = useMemo(() => new Date(WINDOW_END).getTime(), []);
  const cutoffMs = useMemo(() => new Date(DATA_CUTOFF).getTime(), []);

  const [cursorMs, setCursorMs] = useState(startMs);
  const cursorRef = useRef(startMs);
  useEffect(() => {
    cursorRef.current = cursorMs;
  }, [cursorMs]);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(6);
  const [windowHours, setWindowHours] = useState(72);
  const [activeCats, setActiveCats] = useState<Set<Category>>(new Set(ALL_CATEGORIES));
  const [minSevIdx, setMinSevIdx] = useState(0);
  const [attackOnly, setAttackOnly] = useState(false);
  const [selected, setSelected] = useState<GEEvent | null>(null);
  const [viewMode, setViewMode] = useState<"globe" | "flat">("globe");
  const [aboutOpen, setAboutOpen] = useState(false);
  const [simAnnounce, setSimAnnounce] = useState("");
  const globeHandle = useRef<GlobeHandle | null>(null);

  const sevOrder: Severity[] = ["info", "minor", "moderate", "major", "critical"];
  const minSevRank = minSevIdx === 0 ? -1 : SEVERITY_META[sevOrder[minSevIdx]].rank;

  // playback loop
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const step = (now: number) => {
      const dt = Math.min(0.25, (now - last) / 1000);
      last = now;
      const next = cursorRef.current + dt * speed * HOUR;
      if (next >= endMs) {
        cursorRef.current = endMs;
        setCursorMs(endMs);
        setPlaying(false);
        return;
      }
      cursorRef.current = next;
      setCursorMs(next);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed, endMs]);

  const visibleEvents = useMemo(
    () =>
      EVENTS.filter((e) => {
        const ts = new Date(e.ts).getTime();
        if (ts > cursorMs) return false;
        if (windowHours > 0 && cursorMs - ts > windowHours * HOUR) return false;
        if (minSevRank >= 0 && SEVERITY_META[e.severity].rank < minSevRank) return false;
        if (attackOnly && e.attackStatus !== "attack") return false;
        if (!activeCats.has(e.category)) return false;
        return true;
      }),
    [cursorMs, windowHours, minSevRank, attackOnly, activeCats]
  );

  const ringEvents = useMemo(
    () => visibleEvents.filter((e) => cursorMs - new Date(e.ts).getTime() <= 36 * HOUR),
    [visibleEvents, cursorMs]
  );
  const labelEvents = useMemo(
    () => visibleEvents.filter((e) => SEVERITY_META[e.severity].rank >= 3),
    [visibleEvents]
  );

  const sortedEvents = useMemo(
    () => [...EVENTS].sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime()),
    []
  );

  const stats = useMemo(() => {
    const attack = visibleEvents.filter((e) => e.attackStatus === "attack").length;
    const crit = visibleEvents.filter((e) => e.severity === "critical").length;
    const sectors = new Set(visibleEvents.map((e) => e.category)).size;
    return { n: visibleEvents.length, attack, crit, sectors };
  }, [visibleEvents]);

  const jumpEvent = (dir: 1 | -1) => {
    const cur = cursorMs;
    const next =
      dir === 1
        ? sortedEvents.find((e) => new Date(e.ts).getTime() > cur)
        : [...sortedEvents].reverse().find((e) => new Date(e.ts).getTime() < cur);
    if (next) {
      setCursorMs(new Date(next.ts).getTime() + 30 * 60000);
      setSimAnnounce(next.id);
      globeHandle.current?.flyTo(next.location.lat, next.location.lng);
      setTimeout(() => setSimAnnounce(""), 1500);
    }
  };

  const selectEvent = (e: GEEvent) => {
    setSelected(e);
    globeHandle.current?.flyTo(e.location.lat, e.location.lng);
  };

  const syncToEvent = (e: GEEvent) => {
    setCursorMs(Math.min(endMs, new Date(e.ts).getTime() + 30 * 60000));
    setPlaying(false);
    setSelected(null);
    setSimAnnounce(e.id);
    globeHandle.current?.flyTo(e.location.lat, e.location.lng);
    setTimeout(() => setSimAnnounce(""), 1500);
  };

  const toggleCat = (c: Category) => {
    setActiveCats((prev) => {
      const n = new Set(prev);
      if (n.has(c)) n.delete(c);
      else n.add(c);
      return n;
    });
  };

  const handlePlay = () => {
    if (!playing && cursorMs >= endMs) setCursorMs(startMs);
    setPlaying((p) => !p);
  };

  return (
    <div className="relative flex h-[100dvh] flex-col overflow-hidden bg-[#050404] font-mono text-zinc-300">
      {/* ============ HEADER ============ */}
      <header className="z-20 flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-b border-amber-500/20 bg-black/70 px-3 py-2">
        <div className="flex shrink-0 items-center gap-2">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500 shadow-[0_0_8px_#ff4545]" aria-hidden />
          <span className="text-[10px] tracking-[0.3em] text-red-400">REC</span>
        </div>
        <h1 className="whitespace-nowrap text-xs font-bold tracking-[0.2em] text-amber-300 md:text-sm">
          GOD&apos;S EYE <span className="text-amber-500/60">{"//"}</span> BLACKOUT WATCH
        </h1>
        <span className="hidden border border-amber-500/30 px-1.5 py-0.5 text-[9px] tracking-[0.2em] text-amber-200/60 md:inline">
          OVERLAY v1.0
        </span>

        <div className="order-last flex basis-full items-baseline justify-between gap-2 md:order-none md:ml-2 md:flex-1 md:flex-col md:items-start md:justify-start">
          <span className="whitespace-nowrap text-sm tabular-nums tracking-widest text-amber-100">
            {fmtClock(cursorMs)}
          </span>
          <span className="whitespace-nowrap text-[9px] tracking-[0.3em] text-amber-200/40">
            SIM TIME · {fmtDelta(cursorMs)}
            <span className="hidden md:inline"> · CUTOFF 17 NOV 2026 04:00Z</span>
          </span>
        </div>

        <div className="hidden items-center gap-3 text-[10px] tracking-widest md:flex">
          <Stat label="ACTIVE" value={stats.n} tone="text-amber-200" />
          <Stat label="ATTACK" value={stats.attack} tone="text-red-400" />
          <Stat label="CRIT" value={stats.crit} tone="text-red-300" />
          <Stat label="SECTORS" value={stats.sectors} tone="text-teal-300" />
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={() => setViewMode("globe")}
            aria-pressed={viewMode === "globe"}
            title="Spherical orbital view"
            className={`border px-2 py-1 text-[10px] tracking-[0.2em] transition ${
              viewMode === "globe"
                ? "border-amber-400/70 bg-amber-400/10 text-amber-300"
                : "border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300"
            }`}
          >
            GLOBE
          </button>
          <button
            onClick={() => setViewMode("flat")}
            aria-pressed={viewMode === "flat"}
            title="Unrolled equirectangular view — whole planet at once"
            className={`border px-2 py-1 text-[10px] tracking-[0.2em] transition ${
              viewMode === "flat"
                ? "border-amber-400/70 bg-amber-400/10 text-amber-300"
                : "border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300"
            }`}
          >
            FLAT MAP
          </button>
        </div>

        <button
          onClick={() => setAboutOpen(true)}
          className="shrink-0 border border-amber-500/40 px-2 py-1 text-[10px] tracking-[0.2em] text-amber-300/80 transition hover:bg-amber-500/10 hover:text-amber-200"
        >
          ABOUT / DATA
        </button>
      </header>

      {/* ============ BODY ============ */}
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* LEFT: filters + patterns */}
        <aside className="hidden w-72 shrink-0 flex-col gap-4 overflow-y-auto border-r border-amber-500/15 bg-black/50 p-3 lg:flex">
          <section>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-[10px] tracking-[0.35em] text-amber-400/80">▸ SECTOR FILTERS</h2>
              <div className="flex gap-1">
                <button
                  onClick={() => setActiveCats(new Set(ALL_CATEGORIES))}
                  aria-pressed={activeCats.size === ALL_CATEGORIES.length}
                  title="Enable every sector"
                  className={`border px-1.5 py-0.5 text-[9px] tracking-widest transition ${
                    activeCats.size === ALL_CATEGORIES.length
                      ? "border-amber-400/70 bg-amber-400/10 text-amber-300"
                      : "border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
                  }`}
                >
                  ALL
                </button>
                <button
                  onClick={() => setActiveCats(new Set<Category>())}
                  aria-pressed={activeCats.size === 0}
                  title="Mute every sector"
                  className={`border px-1.5 py-0.5 text-[9px] tracking-widest transition ${
                    activeCats.size === 0
                      ? "border-amber-400/70 bg-amber-400/10 text-amber-300"
                      : "border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
                  }`}
                >
                  NONE
                </button>
              </div>
            </div>
            <div className="space-y-1">
              {ALL_CATEGORIES.map((c) => {
                const meta = CATEGORY_META[c];
                const count = EVENTS.filter((e) => e.category === c).length;
                const on = activeCats.has(c);
                return (
                  <button
                    key={c}
                    onClick={() => toggleCat(c)}
                    aria-pressed={on}
                    className={`flex w-full items-center justify-between border px-2 py-1.5 text-left text-[11px] tracking-wider transition ${
                      on
                        ? "border-zinc-700 bg-zinc-900/60 text-zinc-200"
                        : "border-zinc-800/60 bg-transparent text-zinc-600"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ background: meta.color, opacity: on ? 1 : 0.25 }}
                      />
                      {meta.label}
                    </span>
                    <span className="text-[10px] text-zinc-500">{on ? count : "–"}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-[10px] tracking-[0.35em] text-amber-400/80">▸ MIN SEVERITY</h2>
            <div className="flex flex-wrap gap-1">
              {["ALL", "INFO+", "MINOR+", "MODERATE+", "MAJOR+", "CRITICAL+"].map((lbl, i) => (
                <button
                  key={lbl}
                  onClick={() => setMinSevIdx(i)}
                  aria-pressed={minSevIdx === i}
                  className={`border px-2 py-1 text-[9px] tracking-widest transition ${
                    minSevIdx === i
                      ? "border-amber-400/70 bg-amber-400/10 text-amber-300"
                      : "border-zinc-800 text-zinc-500 hover:border-zinc-600"
                  }`}
                >
                  {lbl}
                </button>
              ))}
            </div>
            <label className="mt-3 flex cursor-pointer items-center gap-2 text-[10px] tracking-widest text-zinc-400">
              <input
                type="checkbox"
                checked={attackOnly}
                onChange={(ev) => setAttackOnly(ev.target.checked)}
                className="h-3.5 w-3.5 accent-red-500"
              />
              ATTACK-ATTRIBUTED ONLY
            </label>
          </section>

          <section className="min-h-0">
            <h2 className="mb-2 text-[10px] tracking-[0.35em] text-amber-400/80">▸ PATTERN ANALYSIS</h2>
            <div className="space-y-1">
              {PATTERNS.map((p) => (
                <details key={p.title} className="group border border-zinc-800/80 bg-zinc-950/50">
                  <summary className="cursor-pointer list-none px-2 py-1.5 text-[11px] leading-snug text-zinc-300 marker:hidden transition hover:text-amber-200">
                    <span className="mr-1 text-[9px] tracking-widest text-amber-500/70">[{p.tag}]</span>
                    {p.title}
                  </summary>
                  <p className="border-t border-zinc-800/80 px-2 py-2 text-[11px] leading-relaxed text-zinc-400">
                    {p.body}
                  </p>
                </details>
              ))}
            </div>
          </section>
        </aside>

        {/* CENTER: globe */}
        <main className="relative min-h-[240px] flex-1 bg-[radial-gradient(ellipse_at_center,#0d0a06_0%,#050404_70%)]">
          {viewMode === "globe" ? (
            <GlobePanel
              visibleEvents={visibleEvents}
              ringEvents={ringEvents}
              labelEvents={labelEvents}
              selectedId={selected?.id ?? null}
              onSelect={selectEvent}
              onReady={(h) => (globeHandle.current = h)}
            />
          ) : (
            <FlatPanel
              visibleEvents={visibleEvents}
              ringEvents={ringEvents}
              labelEvents={labelEvents}
              selectedId={selected?.id ?? null}
              onSelect={selectEvent}
              onReady={(h: FlatHandle) => (globeHandle.current = h)}
            />
          )}
          {stats.n === 0 && (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
              <p className="border border-amber-500/30 bg-black/80 px-4 py-2 text-[11px] tracking-[0.25em] text-amber-300/80">
                {activeCats.size === 0
                  ? "ALL SECTORS MUTED — HIT [ALL] IN SECTOR FILTERS"
                  : "NO SIGNALS IN SCAN WINDOW — SCRUB THE TIMELINE OR WIDEN SCAN WINDOW"}
              </p>
            </div>
          )}
          {simAnnounce && (
            <div className="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2 border border-amber-400/50 bg-black/85 px-3 py-1.5 text-[10px] tracking-[0.25em] text-amber-300">
              SIGNAL LOCK ▸ {simAnnounce.toUpperCase()}
            </div>
          )}
        </main>

        {/* RIGHT: event feed */}
        <aside className="flex h-56 shrink-0 flex-col border-t border-amber-500/15 bg-black/50 lg:h-auto lg:w-80 lg:border-l lg:border-t-0">
          <div className="flex shrink-0 items-center justify-between border-b border-amber-500/15 px-3 py-2">
            <h2 className="text-[10px] tracking-[0.35em] text-amber-400/80">▸ EVENT FEED {"//"} {EVENTS.length}</h2>
            <span className="text-[9px] tracking-widest text-zinc-500">CHRONO ASC</span>
          </div>
          <div className="max-h-full flex-1 overflow-y-auto p-2 feed-scroll">
            {sortedEvents.map((e) => {
              const ts = new Date(e.ts).getTime();
              const active = ts <= cursorMs && (windowHours === 0 || cursorMs - ts <= windowHours * HOUR);
              const pending = ts > cursorMs;
              const meta = CATEGORY_META[e.category];
              return (
                <button
                  key={e.id}
                  onClick={() => selectEvent(e)}
                  className={`mb-1 flex w-full items-center gap-2 border px-2 py-1.5 text-left transition ${
                    active
                      ? "border-amber-500/40 bg-amber-400/[0.07]"
                      : "border-transparent hover:border-zinc-700 hover:bg-zinc-900/40"
                  }`}
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ background: meta.color, opacity: pending ? 0.3 : 1 }}
                    aria-hidden
                  />
                  <span className="w-24 shrink-0 text-[9px] tabular-nums tracking-wider text-zinc-500">
                    {new Date(e.ts)
                      .toLocaleString("en-GB", { timeZone: "UTC", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false })
                      .replace(",", "")}Z
                  </span>
                  <span className={`min-w-0 flex-1 truncate text-[11px] ${pending ? "text-zinc-600" : "text-zinc-200"}`}>
                    {e.title}
                  </span>
                  <span
                    className={`shrink-0 text-[8px] tracking-widest ${
                      pending ? "text-zinc-600" : active ? "text-amber-300" : "text-zinc-500"
                    }`}
                  >
                    {pending ? "PEND" : active ? "LIVE" : "PAST"}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>
      </div>

      {/* ============ FOOTER: transport + timeline ============ */}
      <footer className="z-20 shrink-0 border-t border-amber-500/15 bg-black/70 p-2">
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <TBtn onClick={() => jumpEvent(-1)} label="⏮ PREV EV" title="Jump to previous event" />
          <TBtn onClick={() => setCursorMs(Math.max(startMs, cursorMs - 6 * HOUR))} label="◀ −6H" title="Back 6 hours" />
          <button
            onClick={handlePlay}
            className={`border px-4 py-1.5 text-[10px] tracking-[0.2em] transition ${
              playing
                ? "border-red-400/70 bg-red-400/10 text-red-300"
                : "border-amber-400/70 bg-amber-400/10 text-amber-300"
            }`}
            aria-label={playing ? "Pause simulation" : "Play simulation"}
          >
            {playing ? "⏸ PAUSE" : "▶ PLAY"}
          </button>
          <TBtn onClick={() => setCursorMs(Math.min(endMs, cursorMs + 6 * HOUR))} label="▶ +6H" title="Forward 6 hours" />
          <TBtn onClick={() => jumpEvent(1)} label="NEXT EV ⏭" title="Jump to next event" />
          <TBtn onClick={() => { setCursorMs(startMs); setPlaying(false); }} label="⟲ RESET" title="Rewind to window start" />
          <TBtn onClick={() => { setCursorMs(cutoffMs); setPlaying(false); }} label="▸▸ LIVE" title="Jump to data cutoff" />

          <span className="ml-2 flex items-center gap-1 text-[9px] tracking-widest text-zinc-500">
            SPEED:
            {SPEEDS.map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                aria-pressed={speed === s}
                className={`border px-1.5 py-1 transition ${
                  speed === s ? "border-amber-400/70 text-amber-300" : "border-zinc-800 text-zinc-500 hover:border-zinc-600"
                }`}
              >
                {s}H/S
              </button>
            ))}
          </span>

          <span className="flex items-center gap-1 text-[9px] tracking-widest text-zinc-500">
            SCAN WINDOW:
            {[
              { lbl: "24H", v: 24 },
              { lbl: "72H", v: 72 },
              { lbl: "168H", v: 168 },
              { lbl: "ALL", v: 0 },
            ].map((o) => (
              <button
                key={o.lbl}
                onClick={() => setWindowHours(o.v)}
                aria-pressed={windowHours === o.v}
                className={`border px-1.5 py-1 transition ${
                  windowHours === o.v ? "border-amber-400/70 text-amber-300" : "border-zinc-800 text-zinc-500 hover:border-zinc-600"
                }`}
              >
                {o.lbl}
              </button>
            ))}
          </span>

          <span className="ml-auto hidden text-[9px] tracking-widest text-zinc-600 xl:inline">
            {visibleEvents.length}/{EVENTS.length} SIGNALS DISPLAYED · DRAG TIMELINE TO SCRUB · CLICK TICKS &amp; MARKERS FOR INTEL
          </span>
        </div>

        <Timeline
          events={EVENTS}
          startMs={startMs}
          endMs={endMs}
          cursorMs={cursorMs}
          windowHours={windowHours}
          onCursorChange={(ms) => setCursorMs(ms)}
          onTickClick={selectEvent}
        />      </footer>

      {/* ============ MODALS ============ */}
      {selected && <EventModal event={selected} onClose={() => setSelected(null)} onJump={syncToEvent} />}

      {aboutOpen && <AboutModal onClose={() => setAboutOpen(false)} />}

      {/* CRT overlay */}
      <div className="crt-scanlines pointer-events-none fixed inset-0 z-50" aria-hidden />
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className="text-zinc-600">{label}</span>
      <span className={`tabular-nums ${tone}`}>{value.toString().padStart(2, "0")}</span>
    </span>
  );
}

function TBtn({ onClick, label, title }: { onClick: () => void; label: string; title: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="border border-zinc-700 px-2.5 py-1.5 text-[10px] tracking-[0.2em] text-zinc-300 transition hover:border-amber-400/70 hover:text-amber-300"
    >
      {label}
    </button>
  );
}

function AboutModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="About and data notes"
    >
      <div
        className="max-h-[85vh] w-full max-w-xl overflow-y-auto border border-amber-500/40 bg-[#0a0908] p-5 text-sm leading-relaxed text-zinc-300"
        onClick={(ev) => ev.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold tracking-[0.2em] text-amber-300">ABOUT / DATA NOTES</h2>
          <button
            onClick={onClose}
            className="border border-zinc-600 px-2 py-0.5 text-[10px] tracking-widest text-zinc-400 hover:border-amber-400 hover:text-amber-300"
          >
            ESC ✕
          </button>
        </div>
        <div className="space-y-3 text-xs">
          <p>
            <b className="text-amber-200">GOD&apos;S EYE {"//"} BLACKOUT WATCH</b> is a global electronic-system-malfunction
            overlay in the spirit of the open-source{" "}
            <a
              href="https://github.com/bilawalsidhu/gods-eye-view"
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-300 underline decoration-teal-300/30"
            >
              God&apos;s Eye View
            </a>{" "}
            project (bilawalsidhu, Vite + Cesium, photorealistic globe with pluggable data layers). That stack requires
            Cesium ion / API keys, so this overlay ships as a self-contained web app implementing the same concept —
            a spy-HUD globe with a time-scrubbing event timeline — plus a pluggable JSON event dataset you can feed
            into other God&apos;s Eye deployments.
          </p>
          <p>
            <b className="text-amber-200">Coverage:</b> 11 Oct – 17 Nov 2026 UTC (the last month-plus, extended to
            capture the full cold-chain attack arc). Research cutoff: <b>17 Nov 2026, 04:00 UTC</b>. Every event is
            sourced — open any event card for the citations. Events whose time of day was never published are placed
            at 12:00 UTC and marked <b>DATE-LEVEL PRECISION</b>; approximate times are marked as such.
          </p>
          <p>
            <b className="text-amber-200">Honesty policy:</b> nothing is invented. Where Microsoft, Chase, Japanese
            authorities or others explicitly ruled out a cyberattack, the event is tagged{" "}
            <span className="text-emerald-300">NO ATTACK EVIDENCE</span>. Where attribution is open, it is{" "}
            <span className="text-amber-300">ATTRIBUTION UNCLEAR</span>. The viral &quot;Nov 17 bank-wipe&quot; claim is
            tagged <span className="text-zinc-400">UNVERIFIED RUMOR</span> and kept separate from real incidents.
          </p>
          <p>
            <b className="text-amber-200">How to drive it:</b> drag the timeline or click anywhere on it to scrub
            forwards/backwards · PLAY simulates events appearing as they occurred (choose 1H/S, 6H/S or 24H/S) ·
            PREV EV / NEXT EV hop between incidents · SCAN WINDOW controls how long a signal stays lit after it
            fires (ALL = cumulative) · click globe markers or feed rows for full intel cards with sources.
          </p>
        </div>
        <button
          onClick={onClose}
          className="mt-4 border border-amber-400/70 bg-amber-400/10 px-4 py-2 text-[11px] tracking-[0.25em] text-amber-300 transition hover:bg-amber-400/20"
        >
          RESUME WATCH
        </button>
      </div>
    </div>
  );
}
