"""Convert research JSON (ms-ex1550543) into a TS module of GEEvent entries for the watch app.

Usage: python3 -I gen_ms_incident.py <in.json> <out.ts>
"""
import json
import sys

CENTROIDS = {
    "US": (39.8, -98.6, "United States"), "CA": (56.1, -106.3, "Canada"), "MX": (23.6, -102.5, "Mexico"),
    "BR": (-14.2, -51.9, "Brazil"), "AR": (-38.4, -63.6, "Argentina"), "CL": (-35.7, -71.5, "Chile"),
    "CO": (4.6, -74.3, "Colombia"), "PE": (-9.2, -75.0, "Peru"),
    "GB": (54.0, -2.0, "United Kingdom"), "IE": (53.4, -8.2, "Ireland"), "FR": (46.6, 2.4, "France"),
    "DE": (51.2, 10.4, "Germany"), "NL": (52.1, 5.3, "Netherlands"), "BE": (50.5, 4.5, "Belgium"),
    "ES": (40.5, -3.7, "Spain"), "PT": (39.4, -8.2, "Portugal"), "IT": (41.9, 12.6, "Italy"),
    "SE": (60.1, 18.6, "Sweden"), "NO": (60.5, 8.5, "Norway"), "DK": (56.3, 9.5, "Denmark"),
    "FI": (61.9, 25.7, "Finland"), "PL": (51.9, 19.1, "Poland"), "CH": (46.8, 8.2, "Switzerland"),
    "AT": (47.5, 14.6, "Austria"), "TR": (39.0, 35.2, "Turkey"),
    "AE": (23.4, 53.8, "United Arab Emirates"), "SA": (23.9, 45.1, "Saudi Arabia"), "IL": (31.0, 34.9, "Israel"),
    "QA": (25.4, 51.2, "Qatar"), "EG": (26.8, 30.8, "Egypt"),
    "ZA": (-30.6, 22.9, "South Africa"), "NG": (9.1, 8.7, "Nigeria"), "KE": (-0.02, 37.9, "Kenya"),
    "IN": (20.6, 79.0, "India"), "PK": (30.4, 69.3, "Pakistan"), "BD": (23.7, 90.4, "Bangladesh"),
    "SG": (1.35, 103.8, "Singapore"), "MY": (4.2, 101.98, "Malaysia"), "PH": (12.9, 121.8, "Philippines"),
    "ID": (-0.8, 113.9, "Indonesia"), "TH": (15.9, 100.99, "Thailand"), "VN": (14.1, 108.3, "Vietnam"),
    "JP": (36.2, 138.3, "Japan"), "KR": (35.9, 127.8, "South Korea"), "CN": (35.9, 104.2, "China"),
    "HK": (22.3, 114.2, "Hong Kong"), "TW": (23.7, 121.0, "Taiwan"),
    "AU": (-25.3, 133.8, "Australia"), "NZ": (-40.9, 174.9, "New Zealand"),
}

GROUP = "ms-ex1550543"
CATEGORY = "mstrail"
REDMOND = (47.642, -122.139, "Microsoft (Redmond, US) — status post")
REGIONS = {
    "asia pacific": (5.0, 120.0, "Asia-Pacific"),
    "asia (many parts)": (34.0, 100.0, "Asia"),
    "europe": (50.0, 10.0, "Europe"),
    "north america": (45.0, -100.0, "North America"),
}
START = "2026-11-12T17:54:26Z"


def clamp(ts, prec):
    # Date-only items are placed no earlier than the first Microsoft post, so they
    # never light up before the outage on the scrubber.
    if prec == "day" and ts < START:
        return START
    return ts


def locate(o):
    iso = (o.get("country_iso2") or "").upper()
    if iso in CENTROIDS:
        lat, lng, name = CENTROIDS[iso]
        return lat, lng, f"{o.get('place_label') or name} (country-level)"
    reg = REGIONS.get((o.get("place_label") or "").strip().lower())
    if reg:
        return reg[0], reg[1], f"{reg[2]} (region-level)"
    return None


def severity(o):
    m, v = o.get("metric"), o.get("value")
    if m == "downdetector_reports" and isinstance(v, (int, float)):
        if v >= 50000:
            return "critical"
        if v >= 10000:
            return "major"
        if v >= 1000:
            return "moderate"
        return "minor"
    if m == "customer_impact":
        return "moderate"
    return "info"


def title(o):
    place = o.get("place_label") or o.get("country_iso2") or "Global"
    svc = o.get("service") or "Microsoft 365"
    m, v = o.get("metric"), o.get("value")
    if m == "downdetector_reports" and v is not None:
        return f"MS outage · {place}: {int(v):,} Downdetector reports ({svc})"
    label = {
        "official_statement": "Microsoft status update",
        "recovery": "recovery reported",
        "customer_impact": "knock-on impact",
        "news_report": "reported",
    }.get(m, m or "report")
    return f"MS outage · {place}: {label}"


def to_event(i, o, kind="obs", loc=None):
    lat, lng, label = loc
    prec = o.get("ts_precision") or "approx"
    if prec not in ("exact", "approx", "day"):
        prec = "approx"
    src = []
    if o.get("url"):
        src.append({"outlet": o.get("outlet") or "", "title": o.get("title") or o.get("outlet") or "", "url": o["url"]})
    return {
        "id": f"{GROUP}-{kind}-{i:03d}",
        "title": {"obs": title(o), "cascade": f"MS outage · knock-on: {o.get('affected', '')}",
                  "status": "MS status · " + (o.get("summary") or "")[:70]}[kind],
        "category": CATEGORY,
        "severity": {"obs": severity(o), "cascade": "moderate", "status": "info"}[kind],
        "attackStatus": "none",
        "ts": clamp(o["ts_utc"], prec),
        "tsPrecision": prec,
        "location": {"lat": lat, "lng": lng, "label": label},
        "summary": o.get("note") or o.get("summary") or "",
        "group": GROUP,
        "sources": src,
    }


def main(inp, out):
    d = json.load(open(inp))
    events, skipped = [], 0
    for i, o in enumerate(d.get("observations", [])):
        loc = locate(o)
        if not o.get("ts_utc") or not loc:
            skipped += 1
            continue
        events.append(to_event(i, o, "obs", loc))
    for i, c in enumerate(d.get("cascade", [])):
        loc = locate(c)
        if not c.get("ts_utc") or not loc:
            skipped += 1
            continue
        c2 = dict(c)
        c2.setdefault("ts_precision", "day" if c["ts_utc"].endswith("T00:00:00Z") else "approx")
        events.append(to_event(i, c2, "cascade", loc))
    for i, t in enumerate(d.get("status_timeline", [])):
        if t.get("ts_utc"):
            t2 = dict(t)
            t2["note"] = t.get("summary", "")
            events.append(to_event(i, t2, "status", REDMOND))
    print(f"skipped {skipped} unlocated items (kept in the JSON, not mapped)")
    events.sort(key=lambda e: e["ts"])
    body = json.dumps(events, indent=2, ensure_ascii=False)
    ts = (
        "// GENERATED from data/incidents/ms-ex1550543.json by gen_ms_incident.py — do not hand-edit.\n"
        "// Per-country, per-time observations of Microsoft incident EX1550543 (12 Nov 2026),\n"
        "// rebuilt from Microsoft status posts and news reports quoting Downdetector.\n"
        "// Markers sit at country centroids: location is country-level, not a specific site.\n"
        "import type { GEEvent } from \"../events\";\n\n"
        f"export const MS_EX1550543_EVENTS: GEEvent[] = {body};\n"
    )
    open(out, "w").write(ts)
    print(f"wrote {len(events)} events to {out}")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
