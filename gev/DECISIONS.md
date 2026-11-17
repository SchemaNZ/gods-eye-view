# God's Eye Live Layers — decision log

Newest first. Each entry: decision, why, what it supersedes. Confidence tags: [Certain] / [Likely] / [Guessing].

Companion spec: *God's Eye — Live Event Ingestion Agent, Spec v0.1* (Claude project "Gods Eye Live Layers", `specs/gev-event-ingestion-spec.md`). Where this log and the spec disagree, **this log wins** until the spec is updated.

---

## 2026-11-17

### D1 — One repo: everything lives in the `SchemaNZ/gods-eye-view` fork

- **Decision (Nathan):** all God's Eye live-layer work goes in this fork, not a separate repo.
- **Rule:** additions go in **new top-level folders** only:
  - `watch/` — overlay viewer app (Next.js, Vercel)
  - `gev/` — ingestion Worker, prompts, eval set, this log
- Upstream files are never edited, except the layer module in `src/data/` and its one-line registration in `layerState.js`.
- **Why:** new top-level folders don't conflict with upstream merges. Upstream is very active (PR #1778 merged 17 Nov), so the fork must stay syncable. One repo also means one access grant for agents.
- **Supersedes:** spec §0 "Proposed repo: `SchemaNZ/gev-events`" and §14 step 1.
- **Note:** the fork is public and can't be made private. Secrets live in Cloudflare/Vercel/Railway, never in the repo.

### D2 — ACLED is out, including as a test set

- **Decision (Nathan):** don't use ACLED.
- **Why** (ACLED EULA, read 17 Nov 2026):
  - §3.1: public material must be transformative and must not let anyone rebuild the dataset. A clickable marker map, clustered or not, fails that.
  - §3.1 / §1.2: the grant is non-commercial only. Schema Consulting Ltd would need a corporate licence.
  - §7.1: ACLED can't be used as training, test, embedding or knowledge-base input for AI systems without written consent. Our Haiku pipeline and Claude QA are AI systems.
  - §11 / §7.1: no competing product or functional substitute. A live global unrest map risks that.
- **"Semi-private" doesn't exist under the licence.** It's either internal-only, or public and transformed.
- **Supersedes:** spec §4 "ACLED … at most use it later as an offline validation set". That validation use is also barred by §7.1.
- **Only route back in:** ACLED's written consent, e.g. framed as Wise Response non-commercial research.

### D3 — Open alternatives to ACLED for unrest (PROPOSED — awaiting Nathan)

There is no open dataset that combines ACLED's four strengths: global, human-coded, weekly, and including peaceful protest. [Likely] So the plan stacks several sources, and many of them are not in English. Haiku reads the original language, so that's fine.

| Source | Coverage | Language | Cadence | Coding | Role |
|---|---|---|---|---|---|
| GDELT DOC 2.0 + Haiku (spec §3) | Global | 65 languages translated to English for search; Haiku reads originals | 15 min | Machine | **Primary live feed** (already in spec) |
| POLECAT (ICEWS successor, PLOVER ontology) | Global | 7 languages, 1,000+ sources | Weekly releases on Harvard Dataverse [Likely] | Machine (ML) | Second machine feed; cross-check GDELT. Check the licence before ingesting. |
| UCDP Candidate Events | Global, monthly | Many (Factiva + local sources) | Monthly | Human | Lethal violence only (≥1 death). Cross-check for severity-3 unrest. Free; licence believed CC BY [Guessing], so verify. |
| China Dissent Monitor (Freedom House) | China | Chinese social media + news | Quarterly | Human + AI | Fills GDELT's China blind spot (censorship). Check the reuse terms. |
| Crowd Counting Consortium | USA | English | Monthly (GitHub + Dataverse) | Human | Peaceful and violent protests, crowd sizes. Citation required. |
| GLOCON (Koç University) | India, South Africa, Argentina, Brazil, Turkey | Local-language news | Periodic | Automated | Global South protest coverage from local sources. Check access. |
| Defensoría del Pueblo, Peru — monthly conflict report | Peru | Spanish | Monthly (PDF) | Official | Official counts of protest actions and conflicts. PDF parse. |
| Historical only: Mass Mobilization, World Protests 2006–2020, ARC 2.0 | Global / regional | — | Static | Human | Seed for the §13 labelled eval set, not live. |

- **Open question:** which of the "cross-check" rows to add in v1. Recommendation: GDELT+Haiku live; UCDP Candidate monthly; China Dissent Monitor quarterly. Add others once v1 precision is measured.

### D4 — Categories (Nathan, in the spec chat, 17 Nov)

- `unrest` **includes peaceful protest**, as an early indicator of escalation. This overrides spec §2.1's exclusion.
- `outages` covers **computing and internet infrastructure**, not just power, including Cloudflare Radar's structured outage feed. This overrides spec §1 and §2.2's narrowing to power only.
- `fuel_supply` stays as specced. Show cross-category links over time on the God's Eye timeline.

### D5 — Collection runtime follows the spec, not a Claude hourly task

- **Decision (Nathan):** follow the spec chat's architecture: Cloudflare Worker cron, Haiku 5.5 over the API, D1 store, plus one daily Claude QA scheduled task.
- No hourly Claude scheduled task, and no "GitHub repo as database". Both proposed earlier in the watch chat; dropped.
- **Downdetector is not a source.** It blocks automated access, its terms forbid scraping, and its API is paid. Its numbers enter only as figures quoted in news reports.
- Claude sandboxes can't reach GDELT, IODA or the Azure status RSS (tested 17 Nov). Collection has to run on Cloudflare or another host with open egress.

### D6 — Which chat owns what

- **Spec chat** ("Global news event tracking spec"): syncing the fork with upstream; Railway vs Vercel for the main God's Eye app; the Worker, prompts and eval.
- **Watch chat** ("God's Eye blackout watch"): the `watch/` overlay, the Microsoft EX1550543 rebuild, this log.
- **Reason:** two chats shouldn't both write to `main`.

### D7 — `watch/` overlay app is a stopgap viewer

- **Live at:** gods-eye-watch.vercel.app. Vercel project `gods-eye-watch`, root directory `watch/`.
- **Status:** PR #1. Vercel promoted the first build to production; after merge, only `main` deploys production.
- **Security review:** `watch/SECURITY-REVIEW.md`. Clean.
- **Long term:** the live layers become a native Cesium layer module (spec §9). Upstream now has a world clock that layers register their time coverage with, which fits the temporal display. At that point `watch/` can be retired.

### D8 — Upstream (`bilawalsidhu/gods-eye-view`) contribution

- **Don't offer** the `watch/` app (Next.js against upstream's vanilla JS + Cesium) or any curated dataset. Their CONTRIBUTING bans data we lack redistribution rights to, and bans presenting inference as authoritative.
- **Do offer, later:** a generic event-feed layer module that fetches open sources at runtime. Offer it once it works in the fork. [Likely] acceptable, but Bilawal decides.

---

## Open

- D3 source selection (above).
- Licence checks: POLECAT, UCDP, China Dissent Monitor, GLOCON.
- Spec §15 questions 1–6 (tracked in Todoist).
