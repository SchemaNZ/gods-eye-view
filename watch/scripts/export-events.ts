// Exports the verified events dataset as a standalone JSON file for reuse
// (e.g., feeding into other God's Eye View deployments / Cesium overlays).
import { writeFileSync, mkdirSync } from "fs";
import {
  EVENTS,
  CATEGORY_META,
  SEVERITY_META,
  WINDOW_START,
  WINDOW_END,
  DATA_CUTOFF,
} from "../src/lib/events";

const payload = {
  $schema: "gods-eye-blackout-watch/v1",
  name: "GOD'S EYE // BLACKOUT WATCH — Global Electronic System Malfunction Overlay",
  description:
    "Verified global electronic system malfunctions, 11 Oct - 17 Nov 2026 UTC, aggregated from Downdetector reporting via news wires (Reuters, CNBC, Guardian, BBC, Telegraph, USA Today, Forbes, Nippon.com), official incident notices, provider incident reports and fact-checks. Every event carries its source citations. No events are invented; date-level precision is flagged where time of day was never published.",
  inspiredBy: "https://github.com/bilawalsidhu/gods-eye-view",
  window: { start: WINDOW_START, end: WINDOW_END },
  dataCutoff: DATA_CUTOFF,
  taxonomy: {
    categories: Object.fromEntries(
      Object.entries(CATEGORY_META).map(([k, v]) => [k, { label: v.label, color: v.color }])
    ),
    severities: Object.fromEntries(
      Object.entries(SEVERITY_META).map(([k, v]) => [k, { label: v.label, rank: v.rank }])
    ),
    attackStatus: {
      attack: "Cyberattack attributed/confirmed by authorities or verified reporting",
      none: "Provider/authority explicitly found no evidence of cyberattack",
      unclear: "Cause under investigation or not disclosed",
      rumor: "Viral claim with no supporting evidence — segregated from real incidents",
    },
    tsPrecision: { exact: "Time verified in sources", approx: "Approximate time from reporting", day: "Only the date was published; placed at 12:00 UTC for scrubber positioning" },
  },
  eventCount: EVENTS.length,
  events: EVENTS,
};

mkdirSync("data", { recursive: true });
const out = "data/gods-eye-blackout-watch.json";
writeFileSync(out, JSON.stringify(payload, null, 2));
console.log(`Wrote ${out} — ${EVENTS.length} events`);
