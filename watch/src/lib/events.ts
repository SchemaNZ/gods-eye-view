// GOD'S EYE // BLACKOUT WATCH — verified event dataset
// Research cutoff: 2026-11-17 04:00 UTC.
// Every event below is sourced from the cited articles. Where an exact time of
// day was not published by sources, tsPrecision is "day" and the marker is
// placed at 12:00 UTC of that day purely for scrubber positioning — the UI
// displays these as date-level precision. No events are invented.

import { MS_EX1550543_EVENTS } from "./incidents/ms-ex1550543";

export type Category =
  | "coldchain"
  | "finance"
  | "aviation"
  | "cloud"
  | "healthcare"
  | "satellite"
  | "ai"
  | "advisory"
  | "rumor"
  | "mstrail";

export type Severity = "critical" | "major" | "moderate" | "minor" | "info";

export type AttackStatus = "attack" | "none" | "unclear" | "rumor";

export interface SourceRef {
  outlet: string;
  title: string;
  url: string;
}

export interface GEEvent {
  id: string;
  title: string;
  category: Category;
  severity: Severity;
  attackStatus: AttackStatus;
  ts: string; // ISO 8601 UTC
  tsPrecision: "exact" | "approx" | "day";
  duration?: string;
  location: { lat: number; lng: number; label: string };
  summary: string;
  impact?: string;
  cause?: string;
  response?: string;
  group?: string;
  sources: SourceRef[];
}

export const CATEGORY_META: Record<
  Category,
  { label: string; color: string; short: string }
> = {
  coldchain: { label: "ICS / Cold Chain", color: "#ff4545", short: "ICS" },
  finance: { label: "Banking / Payments", color: "#ffc400", short: "FIN" },
  aviation: { label: "Aviation / ATC", color: "#ff9100", short: "AVN" },
  cloud: { label: "Cloud / Infrastructure", color: "#4dd8c0", short: "CLD" },
  healthcare: { label: "Healthcare", color: "#ff6482", short: "MED" },
  satellite: { label: "Satellite / Space", color: "#c07cff", short: "SAT" },
  ai: { label: "AI Platforms", color: "#58e06b", short: "AI" },
  advisory: { label: "Gov Advisory", color: "#f2f2f2", short: "ADV" },
  rumor: { label: "Rumor / Unverified", color: "#8e8e93", short: "RUM" },
  mstrail: { label: "MS 365 outage trail (12–13 Nov)", color: "#3aa0ff", short: "MS" },
};

export const SEVERITY_META: Record<Severity, { label: string; rank: number }> = {
  critical: { label: "CRITICAL", rank: 4 },
  major: { label: "MAJOR", rank: 3 },
  moderate: { label: "MODERATE", rank: 2 },
  minor: { label: "MINOR", rank: 1 },
  info: { label: "INFO", rank: 0 },
};

export const WINDOW_START = "2026-10-11T00:00:00Z";
export const WINDOW_END = "2026-11-17T06:00:00Z";
export const DATA_CUTOFF = "2026-11-17T04:00:00Z";

const BASE_EVENTS: GEEvent[] = [
  {
    id: "wave1-france",
    title: "France: 500+ supermarket refrigeration systems forced into defrost",
    category: "coldchain",
    severity: "critical",
    attackStatus: "attack",
    ts: "2026-10-11T22:00:00Z",
    tsPrecision: "approx",
    duration: "6+ hours of continuous defrost before detection",
    location: { lat: 46.6, lng: 2.4, label: "France (nationwide)" },
    summary:
      "On the night of 11 October, 300+ Intermarche and Netto stores, 80 Cooperative U, 80 Carrefour, ~30 Monoprix and several E.Leclerc stores were struck in a large-scale cyberattack. Refrigeration controllers were compromised and instructed to run continuous defrost cycles with contents still inside — no alarms triggered.",
    impact:
      "Refrigerators climbed to 50°C after six hours; one Normandy store reported 80°C. Equipment melted or caught fire; sprinkler systems caused water damage. Whole aisles of chilled and frozen produce destroyed. Losses estimated in the tens of millions of euros; two Alsace outlets alone reported €270,000. Ahold Delhaize warned quarterly sales could be reduced by up to €250M ($281M).",
    cause:
      "Attack surface identified as EOL Danfoss AK-SM800 and AK-SC355 regulators (end-of-life 2016/2021, no longer patched), plus Copeland XWEB and Dixell XWEB controllers. Some systems used default passwords; Danfoss's 'code of the day' login bypass (disclosed by Claroty Team 82 in 2025) allowed access by entering the device date. Unpatched AK-SM800A units were also hit.",
    response:
      "PM Sebastien Lecornu instructed ANSSI to investigate and coordinate with other European countries. CERT-FR alert remains active. No attribution; no claim of responsibility.",
    group: "cold-chain-campaign",
    sources: [
      { outlet: "Wikipedia", title: "2026 European cold chain hacks", url: "https://en.wikipedia.org/wiki/2026_European_cold_chain_hacks" },
      { outlet: "The Guardian", title: "Shop fridges and freezers across Europe hit by fresh suspected cyber-attack", url: "https://www.theguardian.com/world/2026/nov/02/supermarket-freezers-across-europe-hit-by-second-suspected-cyber-attack" },
    ],
  },
  {
    id: "efs-blood-banks",
    title: "France: blood bank refrigerators targeted — plasma near-miss at 110°C",
    category: "coldchain",
    severity: "major",
    attackStatus: "attack",
    ts: "2026-10-11T22:30:00Z",
    tsPrecision: "approx",
    duration: "Interrupted before spoilage",
    location: { lat: 48.93, lng: 2.36, label: "Saint-Denis, France (EFS sites)" },
    summary:
      "In the same October wave, blood plasma intended for transfusions at three French Blood Establishment (EFS) sites was targeted in an attempt to heat refrigerators to 110°C — a temperature that would destroy the plasma.",
    impact: "None realized: monitoring systems alerted staff, who intervened before the plasma was destroyed.",
    cause: "EFS refrigeration supplier Coolworld stated the vulnerability concerned 'a component supplied by a third-party'.",
    group: "cold-chain-campaign",
    sources: [
      { outlet: "Wikipedia", title: "2026 European cold chain hacks", url: "https://en.wikipedia.org/wiki/2026_European_cold_chain_hacks" },
    ],
  },
  {
    id: "gcp-london",
    title: "Google Cloud London zone down — power disruption + generator fault",
    category: "cloud",
    severity: "major",
    attackStatus: "none",
    ts: "2026-10-19T12:00:00Z",
    tsPrecision: "day",
    duration: "6h 08m",
    location: { lat: 51.5072, lng: -0.1276, label: "London, UK (europe-west2-b)" },
    summary:
      "An electrical power disruption hit the data centre hosting availability zone europe-west2-b in London, affecting roughly 35 Google Cloud products including Compute Engine, GKE, Cloud Run, Cloud SQL, Spanner and BigQuery.",
    cause:
      "Per Google's incident report: a fault in the programmable logic controller prevented emergency generators from taking over after the UPS batteries ran down.",
    group: "cascade-gcp",
    sources: [
      { outlet: "Presenc AI", title: "Cloud Outage Tracker 2026", url: "https://presenc.ai/research/cloud-outage-tracker-2026" },
      { outlet: "Financial Express", title: "Microsoft, AWS, Google Cloud: Inside 2026's major technology outages", url: "https://www.financialexpress.com/life/technology/microsoft-aws-google-cloud-inside-2026s-major-technology-outages/4384098" },
    ],
  },
  {
    id: "uk-banking-apps",
    title: "UK: banking apps, mail and delivery services crash (GCP cascade)",
    category: "finance",
    severity: "major",
    attackStatus: "none",
    ts: "2026-10-20T12:00:00Z",
    tsPrecision: "day",
    duration: "Several hours",
    location: { lat: 51.5, lng: -0.12, label: "United Kingdom" },
    summary:
      "A major internet outage cascaded across UK consumer services on Tuesday 20 October as the Google Cloud London failure rippled through dependent platforms. Downdetector logged simultaneous spikes at Revolut, Lloyds, HSBC, Barclays, Halifax, Bank of Scotland, NatWest and Nationwide.",
    impact:
      "Royal Mail, DPD, Rightmove and Screwfix also hit; court hearings disrupted. Customers unable to access accounts or payments for hours during the working day.",
    cause: "Downstream dependency on the disrupted Google Cloud europe-west2 zone — a single-zone infrastructure cascade, not an attack.",
    group: "cascade-gcp",
    sources: [
      { outlet: "The Telegraph", title: "Banking apps crash after Google system failure", url: "https://www.telegraph.co.uk/news/2026/10/20/google-cloud-system-disruption-internet-down-banking-apps" },
      { outlet: "The Independent", title: "Major internet outage appears to have taken down Lloyds, HSBC and DPD", url: "https://www.the-independent.com/bulletin/news/lloyds-bank-down-hsbc-outage-google-cloud-b3069731.html" },
    ],
  },
  {
    id: "cloudflare-gateway",
    title: "Cloudflare One Gateway outage",
    category: "cloud",
    severity: "moderate",
    attackStatus: "unclear",
    ts: "2026-10-20T12:00:00Z",
    tsPrecision: "day",
    duration: "3h 12m",
    location: { lat: 37.7697, lng: -122.3933, label: "San Francisco, US (global impact)" },
    summary:
      "Cloudflare's One Gateway service went down for approximately 3 hours 12 minutes on 20 October. Cause not stated in the tracker's listing.",
    impact: "Enterprise customers using Cloudflare One for zero-trust access lost gateway connectivity for the duration.",
    group: "cascade-gcp",
    sources: [
      { outlet: "Presenc AI", title: "Cloud Outage Tracker 2026", url: "https://presenc.ai/research/cloud-outage-tracker-2026" },
    ],
  },
  {
    id: "uh-cleveland",
    title: "University Hospitals (Ohio) cyber incident — MyChart offline 18 days",
    category: "healthcare",
    severity: "major",
    attackStatus: "attack",
    ts: "2026-10-22T12:00:00Z",
    tsPrecision: "day",
    duration: "Oct 22 – Nov 9 (systems restored Nov 9)",
    location: { lat: 41.5053, lng: -81.6954, label: "Cleveland, Ohio, US" },
    summary:
      "University Hospitals detected unusual activity on its servers on Thursday 22 October and took digital services offline, including the MyChart patient portal, e-prescribing and video visits. Proposed class-action lawsuits followed.",
    impact:
      "Procedures rescheduled; most UH websites still down a week later; virtual care disrupted across the health system. Services restored 9 November.",
    response: "UH published a cybersecurity incident page; restoration completed Nov 9 per local reporting.",
    sources: [
      { outlet: "University Hospitals", title: "Cybersecurity Incident notice", url: "https://www.uhhospitals.org/cybersecurity-incident" },
      { outlet: "Ideastream", title: "Most University Hospitals websites still down a week after cybersecurity incident", url: "https://www.ideastream.org/health/2026-10-29/most-university-hospitals-websites-still-down-a-week-after-cybersecurity-incident" },
      { outlet: "Becker's Hospital Review", title: "University Hospitals reschedules procedures as cyber incident disruptions continue", url: "https://www.beckershospitalreview.com/healthcare-information-technology/cybersecurity/university-hospitals-reschedules-procedures-as-cyber-incident-disruptions-continue" },
    ],
  },
  {
    id: "starlink-oct26",
    title: "Starlink outage (~1h, global user reports)",
    category: "satellite",
    severity: "minor",
    attackStatus: "unclear",
    ts: "2026-10-26T00:00:00Z",
    tsPrecision: "approx",
    duration: "~1 hour",
    location: { lat: 47.673, lng: -122.118, label: "Redmond, US (global user base)" },
    summary:
      "Starlink suffered a short outage on 26 October lasting about one hour, with up to 173 user reports per hour on outage trackers. No cause posted.",
    impact: "Temporary loss of satellite internet connectivity for affected users.",
    sources: [
      { outlet: "Instatus", title: "Starlink outage on October 26, 2026", url: "https://instatus.com/now/starlink.com/outages/2026-10-26-00" },
    ],
  },
  {
    id: "wave2-belgium",
    title: "Belgium: Delhaize, Carrefour, Intermarché, Spar, IKEA freezers hit",
    category: "coldchain",
    severity: "critical",
    attackStatus: "attack",
    ts: "2026-11-01T23:00:00Z",
    tsPrecision: "approx",
    duration: "Overnight into Monday Nov 2",
    location: { lat: 50.85, lng: 4.35, label: "Belgium (multiple chains)" },
    summary:
      "Second wave of the refrigeration campaign struck overnight into Monday 2 November: several dozen Delhaize stores, 15 Carrefour, 10–15 Intermarché, 5 Spar and 1 IKEA in Belgium (Luxembourg also affected). Cooling units were switched to defrost mode and temperatures raised.",
    impact:
      "Chilled and frozen products destroyed; one Belgian butcher (De Laet & Van Haver) lost €15,000 of meat. Sabcobel reported ~20 of its hundreds of managed units hit.",
    cause: "EOL Danfoss controllers; some systems still on default passwords and not on secure networks.",
    response: "Belgium's federal prosecutor's office opened a criminal investigation. Centre for Cybersecurity Belgium: 'it may never be determined' who was behind the attacks.",
    group: "cold-chain-campaign",
    sources: [
      { outlet: "Reuters", title: "New cyberattack on supermarket fridges sweeps across Europe", url: "https://www.reuters.com/business/retail-consumer/temperature-soars-swedish-grocery-store-freezers-one-store-blames-hackers-2026-11-02" },
      { outlet: "BBC", title: "Shop freezers in seven European countries hit by cyber-attack", url: "https://www.bbc.com/news/articles/cq1kd1nee80eo" },
      { outlet: "The Hacker News", title: "New Wave of Refrigeration Cyberattacks Hits Supermarket Chains", url: "https://thehackernews.com/2026/11/second-wave-of-cyberattacks-hits.html" },
    ],
  },
  {
    id: "wave2-netherlands",
    title: "Netherlands: 17+ food businesses hit; Ahold Delhaize flags €250M exposure",
    category: "coldchain",
    severity: "major",
    attackStatus: "attack",
    ts: "2026-11-01T23:10:00Z",
    tsPrecision: "approx",
    duration: "Overnight into Monday Nov 2",
    location: { lat: 52.37, lng: 4.9, label: "Netherlands" },
    summary:
      "At least 17 Dutch food businesses — including butchers and small shops — were hit in the same overnight wave. Dutch-German chains affected; a few German Edeka and CAP Markets stores also struck.",
    impact: "Ahold Delhaize said quarterly sales could be reduced by as much as €250M ($281M) across the group.",
    group: "cold-chain-campaign",
    sources: [
      { outlet: "The Guardian", title: "Supermarket freezers across Europe hit by second suspected cyber-attack", url: "https://www.theguardian.com/world/2026/nov/02/supermarket-freezers-across-europe-hit-by-second-suspected-cyber-attack" },
      { outlet: "Wikipedia", title: "2026 European cold chain hacks", url: "https://en.wikipedia.org/wiki/2026_European_cold_chain_hacks" },
    ],
  },
  {
    id: "wave2-sweden",
    title: "Sweden: ICA and Coop freezers heated by hackers",
    category: "coldchain",
    severity: "major",
    attackStatus: "attack",
    ts: "2026-11-01T23:20:00Z",
    tsPrecision: "approx",
    duration: "Overnight into Monday Nov 2",
    location: { lat: 59.33, lng: 18.07, label: "Sweden" },
    summary:
      "A limited number of ICA stores and 6–7 Coop stores in Sweden had their fridges and freezers remotely heated. ICA confirmed its affected sites used Danfoss controllers. Reuters led its coverage from a Swedish grocery store where temperatures soared.",
    response: "Sweden's National Cybersecurity Centre did not specify how attackers got in; advised organizations to inventory internet-connected devices and apply layered security.",
    group: "cold-chain-campaign",
    sources: [
      { outlet: "Reuters", title: "New cyberattack on supermarket fridges sweeps across Europe", url: "https://www.reuters.com/business/retail-consumer/temperature-soars-swedish-grocery-store-freezers-one-store-blames-hackers-2026-11-02" },
    ],
  },
  {
    id: "wave2-estonia",
    title: "Estonia: Selver refrigeration set to 50°C",
    category: "coldchain",
    severity: "moderate",
    attackStatus: "attack",
    ts: "2026-11-01T23:30:00Z",
    tsPrecision: "approx",
    duration: "Overnight into Monday Nov 2",
    location: { lat: 59.44, lng: 24.75, label: "Tallinn, Estonia" },
    summary:
      "At one Estonian Selver supermarket, attackers accessed the computer controlling the refrigeration system and turned the temperature up to 50°C, per The Guardian.",
    group: "cold-chain-campaign",
    sources: [
      { outlet: "The Guardian", title: "Supermarket freezers across Europe hit by second suspected cyber-attack", url: "https://www.theguardian.com/world/2026/nov/02/supermarket-freezers-across-europe-hit-by-second-suspected-cyber-attack" },
    ],
  },
  {
    id: "wave2-ireland",
    title: "Ireland: Musgrave/SuperValu — 13 stores hit",
    category: "coldchain",
    severity: "moderate",
    attackStatus: "attack",
    ts: "2026-11-01T23:40:00Z",
    tsPrecision: "approx",
    duration: "Overnight into Monday Nov 2",
    location: { lat: 51.9, lng: -8.47, label: "Cork, Ireland (Musgrave HQ)" },
    summary: "Musgrave, owner of the SuperValu chain, reported 13 stores affected in the second refrigeration wave.",
    group: "cold-chain-campaign",
    sources: [
      { outlet: "The Hacker News", title: "New Wave of Refrigeration Cyberattacks Hits Supermarket Chains", url: "https://thehackernews.com/2026/11/second-wave-of-cyberattacks-hits.html" },
    ],
  },
  {
    id: "wave2-portugal",
    title: "Portugal: Intermarché / Mosqueteiros — 7 stores hit",
    category: "coldchain",
    severity: "moderate",
    attackStatus: "attack",
    ts: "2026-11-01T23:50:00Z",
    tsPrecision: "approx",
    duration: "Overnight into Monday Nov 2",
    location: { lat: 38.72, lng: -9.14, label: "Lisbon, Portugal" },
    summary: "Seven stores of the Intermarché-affiliated Mosqueteiros group in Portugal were affected by the refrigeration attack.",
    group: "cold-chain-campaign",
    sources: [
      { outlet: "The Hacker News", title: "New Wave of Refrigeration Cyberattacks Hits Supermarket Chains", url: "https://thehackernews.com/2026/11/second-wave-of-cyberattacks-hits.html" },
    ],
  },
  {
    id: "wave2-italy",
    title: "Italy (Sicily): Coop Radenza — 4+ stores hit",
    category: "coldchain",
    severity: "moderate",
    attackStatus: "attack",
    ts: "2026-11-02T00:00:00Z",
    tsPrecision: "approx",
    duration: "Overnight into Monday Nov 2",
    location: { lat: 37.5, lng: 15.09, label: "Sicily, Italy" },
    summary: "At least four Coop supermarkets run by the Radenza group in Sicily were affected in the second wave.",
    group: "cold-chain-campaign",
    sources: [
      { outlet: "The Hacker News", title: "New Wave of Refrigeration Cyberattacks Hits Supermarket Chains", url: "https://thehackernews.com/2026/11/second-wave-of-cyberattacks-hits.html" },
    ],
  },
  {
    id: "wave2-finland",
    title: "Finland: Kesko — smaller stores hit",
    category: "coldchain",
    severity: "minor",
    attackStatus: "attack",
    ts: "2026-11-02T00:10:00Z",
    tsPrecision: "approx",
    duration: "Overnight into Monday Nov 2",
    location: { lat: 60.17, lng: 24.94, label: "Helsinki, Finland (Kesko HQ)" },
    summary: "Kesko reported a few smaller stores affected in the second refrigeration wave.",
    group: "cold-chain-campaign",
    sources: [
      { outlet: "The Hacker News", title: "New Wave of Refrigeration Cyberattacks Hits Supermarket Chains", url: "https://thehackernews.com/2026/11/second-wave-of-cyberattacks-hits.html" },
    ],
  },
  {
    id: "us-advisory-refrigeration",
    title: "US: five federal agencies warn of ongoing cyber threat to industrial refrigeration",
    category: "advisory",
    severity: "major",
    attackStatus: "attack",
    ts: "2026-11-05T17:35:00Z",
    tsPrecision: "approx",
    location: { lat: 38.895, lng: -77.036, label: "Washington, DC, US" },
    summary:
      "Five US federal agencies — including the FBI — published a joint fact sheet on 5 November urging owners to harden industrial refrigeration and cold-chain monitoring systems, citing 'ongoing malicious cyber activity' targeting these systems around the world.",
    cause:
      "Advisory follows the October France and November multi-country supermarket attacks; targets include internet-connected refrigeration controllers on legacy or unpatched firmware.",
    group: "cold-chain-campaign",
    sources: [
      { outlet: "Reuters (Raphael Satter)", title: "US warns of 'ongoing cyber threat' to industrial refrigeration systems", url: "https://www.reuters.com/business/retail-consumer/us-warns-ongoing-cyber-threat-industrial-refrigeration-systems-2026-11-05" },
      { outlet: "Red Tiger Security", title: "US Agencies Urge Hardening of Industrial Refrigeration (CSA)", url: "https://www.redtigersecurity.com/advisory/us-refrigeration-cold-chain-csa" },
    ],
  },
  {
    id: "shinkin-japan",
    title: "Japan: 128 Shinkin banks / 3,430 branches frozen for ~6 hours",
    category: "finance",
    severity: "major",
    attackStatus: "none",
    ts: "2026-11-06T12:00:00Z",
    tsPrecision: "day",
    duration: "Nearly 6 hours",
    location: { lat: 35.68, lng: 139.69, label: "Tokyo, Japan (shared system center)" },
    summary:
      "A shared system center failure froze ATMs, counter service, online banking and transfers at 128 of Japan's 236 Shinkin banks — 3,430 branches spanning Tokai to Kyushu. Customers could not withdraw cash or complete transactions.",
    cause:
      "Japanese banking authorities attributed the disruption to an equipment malfunction in the shared banking system — explicitly NOT a cyberattack.",
    sources: [
      { outlet: "Nippon.com", title: "System Failure Disrupts ATMs at 128 Shinkin Banks in Japan", url: "https://www.nippon.com/en/articles/-/57039" },
      { outlet: "Forbes (Jeff Gapusan)", title: "Over 100 Banks Disrupted: What The Shinkin Outage Teaches Us", url: "https://www.forbes.com/sites/jeffgapusan/2026/11/09/over-100-banks-disrupted-what-the-shinkin-outage-teaches-us-banks" },
    ],
  },
  {
    id: "openai-api",
    title: "OpenAI API outage (52 minutes)",
    category: "ai",
    severity: "minor",
    attackStatus: "unclear",
    ts: "2026-11-09T18:16:00Z",
    tsPrecision: "exact",
    duration: "52 minutes (18:16–19:08 UTC)",
    location: { lat: 37.7749, lng: -122.4194, label: "San Francisco, US (global API)" },
    summary: "OpenAI reported an incident affecting the OpenAI API for 52 minutes on 9 November, from 18:16 to 19:08 UTC.",
    sources: [
      { outlet: "Host-Tracker / OpenAI status", title: "OpenAI API outage on November 9, 2026", url: "https://www.host-tracker.com/en/is-openai-down/incidents/2026-11-09-1816" },
    ],
  },
  {
    id: "ms365-global",
    title: "Microsoft 365 global outage — Outlook peak ~130k Downdetector reports",
    category: "cloud",
    severity: "critical",
    attackStatus: "none",
    ts: "2026-11-12T17:30:00Z",
    tsPrecision: "exact",
    duration: "~20 hours of elevated reports; restoration into Nov 13",
    location: { lat: 47.642, lng: -122.139, label: "Redmond, US (worldwide impact)" },
    summary:
      "Outage reports surged worldwide from about 17:30 UTC on 12 November as Outlook went down and Teams, Copilot and other M365 apps were disrupted. Outlook reports peaked around 130,000 on Downdetector, with a peak rate near 20,000 reports/minute across five services. Reports came from 74 countries and territories within the first hour. (A '7.4M total reports, 90+ countries' figure traces only to an Ookla page we could not access — unverified.) See the MS 365 outage trail layer for the country-by-country spread.",
    impact:
      "UK hospitals rescheduled procedures; courts warned judgments might be delayed; UK police could not receive online crime reports; National Pharmacy Association warned of prescription delays; US House alerted staff; Japan's Digital Agency could not receive email; Immigration NZ paused visa processing; European bond repurchase halted; Workhorse delayed its earnings call. Estimated insured losses $300–500M (Morningstar DBRS, not re-verified). Airline claims removed on review: matching reports were from the July 2024 CrowdStrike outage.",
    cause:
      "Microsoft: a process that sets up secure connections on email servers became overwhelmed; the company began reversing a recent network settings change that coincided with the start of the outage. Microsoft found no evidence of a cyberattack. Incidents EX1550543 / MO1550821.",
    group: "nov-cluster",
    sources: [
      { outlet: "Reuters", title: "Microsoft restores service to Outlook and Teams", url: "https://www.reuters.com/technology/microsoft-365-outlook-down-thousands-us-users-downdetector-shows-2026-11-12" },
      { outlet: "Ookla", title: "Microsoft's Outage Clocked In Around the World (Downdetector analysis)", url: "https://www.ookla.com/articles/microsoft-365-outage-november-2026-downdetector" },
      { outlet: "CNBC", title: "Microsoft works to restore Outlook and other 365 services", url: "https://www.cnbc.com/2026/11/12/microsoft-outage-outlook-aws-google.html" },
      { outlet: "Financial Express", title: "Inside 2026's major technology outages", url: "https://www.financialexpress.com/life/technology/microsoft-aws-google-cloud-inside-2026s-major-technology-outages/4384098" },
    ],
  },
  {
    id: "faa-ground-stop",
    title: "FAA nationwide ground stop — ATC communications failure, ~10,000 flights",
    category: "aviation",
    severity: "critical",
    attackStatus: "unclear",
    ts: "2026-11-13T16:30:00Z",
    tsPrecision: "approx",
    duration: "Ground stop >4 hours; disruptions through the weekend",
    location: { lat: 38.851, lng: -77.04, label: "Washington, DC (US airspace)" },
    summary:
      "The FAA issued a nationwide ground stop on Friday 13 November after a communications failure affected multiple air traffic control centers — ATC routers became overloaded with data and gave inconsistent readings. Roughly 10,000 flights were affected; Eurocontrol's 42 member states suspended US-bound flights at the FAA's request. The stop was lifted after more than four hours, with cancellations stretching into the weekend.",
    cause:
      "Officials pointed to a router installed by L3Harris on ageing telecoms infrastructure; it remained unclear whether equipment or contractor error caused the shutdown. No attack attribution.",
    response: "Transport Secretary Sean Duffy said the cause was unclear; national airspace resumed Friday evening; key test for Monday air travel.",
    group: "nov-cluster",
    sources: [
      { outlet: "Reuters", title: "US to resume flights after air traffic network failure sparks chaos", url: "https://www.reuters.com/world/us/faa-issues-national-ground-stop-due-extraordinary-circumstance-reasons-safety-2026-11-13" },
      { outlet: "Reuters", title: "US aviation shutdown blamed on L3 Harris installed router", url: "https://www.reuters.com/business/aerospace-defense/us-aviation-shutdown-blamed-l3-harris-installed-router-2026-11-14" },
      { outlet: "CNBC", title: "FAA lifts ground stop after more than four hours", url: "https://www.cnbc.com/2026/11/13/faa-ground-stop.html" },
      { outlet: "CNN", title: "Some US flights resume after hours-long ground stop", url: "https://www.cnn.com/2026/11/13/us/live-news/flights-ground-stop-faa" },
      { outlet: "Wikipedia", title: "2026 FAA nationwide ground stop", url: "https://en.wikipedia.org/wiki/2026_US_national_ground_stop" },
    ],
  },
  {
    id: "chatgpt-billing",
    title: "ChatGPT billing & Ads billing elevated errors",
    category: "ai",
    severity: "minor",
    attackStatus: "unclear",
    ts: "2026-11-14T04:11:00Z",
    tsPrecision: "exact",
    duration: "1h 16m (04:11–05:27 UTC)",
    location: { lat: 37.7749, lng: -122.4194, label: "San Francisco, US" },
    summary: "OpenAI reported 'Elevated errors with ChatGPT billing and Ads billing' on 14 November, 04:11–05:27 UTC.",
    sources: [
      { outlet: "Host-Tracker / OpenAI status", title: "ChatGPT outage on November 14, 2026", url: "https://www.host-tracker.com/en/is-chatgpt-down/incidents/2026-11-14-0411" },
    ],
  },
  {
    id: "usbanks-nov16",
    title: "US: Chase, BofA, Wells Fargo, U.S. Bank, PNC + Zelle outage (today)",
    category: "finance",
    severity: "major",
    attackStatus: "unclear",
    ts: "2026-11-16T14:30:00Z",
    tsPrecision: "approx",
    duration: "Reports 9:30 AM ET → peak ~2 PM ET Nov 16; ongoing monitoring",
    location: { lat: 40.706, lng: -74.009, label: "New York, US (nationwide)" },
    summary:
      "Customers of the largest US banks reported trouble accessing online accounts on Monday 16 November: Chase/JPMorgan, Bank of America, Wells Fargo, U.S. Bank and PNC — with transactions taking longer than usual or stalling. Zelle reports began ~9:30 AM ET and peaked ~2 PM ET per Downdetector.",
    impact: "Nationwide transaction delays and access issues across multiple banks simultaneously; funds reported safe.",
    cause:
      "AP reporting attributes the online-banking delays to a technical issue at JPMorgan Chase that rippled into other banks' services. Chase told USA TODAY it is a 'technical issue' and 'not cyber related'. Zelle said its platform was operating normally, with issues at participating banks affecting Zelle payments. This is the banking disruption circulating on social media today (Nov 17).",
    group: "nov-cluster",
    sources: [
      { outlet: "USA TODAY (live blog)", title: "Bank outage updates: Wells Fargo, Chase, BofA hit with nationwide outage", url: "https://www.usatoday.com/story/money/2026/11/16/bank-outage-nationwide-chase-bofa--live/92814152007" },
      { outlet: "CBS News", title: "Several major U.S. banks reporting widespread service outages", url: "https://www.cbsnews.com/news/banks-online-service-outages-jpmorgan-chase-bank-of-america-wells-fargo" },
      { outlet: "AP via KCRA", title: "Online banking delays for major banks triggered by technical issue at JPMorgan Chase", url: "https://www.kcra.com/article/bank-outages-chase-wells-fargo-bank-of-america/74443090" },
    ],
  },
  {
    id: "rumor-nov17",
    title: "UNVERIFIED: viral 'Nov 17 global cyberattack' claim — fact-checkers find no evidence",
    category: "rumor",
    severity: "info",
    attackStatus: "rumor",
    ts: "2026-11-17T03:00:00Z",
    tsPrecision: "day",
    location: { lat: 0, lng: 0, label: "GLOBAL (viral claim)" },
    summary:
      "Viral posts claim a global cyberattack on 17 November will wipe bank balances and trigger a three-month worldwide internet blackout, allegedly sourced from an anonymous darknet post. Fact-checkers and authorities find NO evidence: no bank and no security agency has warned of such an attack.",
    impact:
      "Amplified amid the real Nov 16 US bank outage and the Nov 12–13 Microsoft 365 failure — a case study in how genuine outages seed panic narratives.",
    cause: "Claim rests solely on an anonymous darknet source (fact-checked 6 Nov and again 17 Nov).",
    sources: [
      { outlet: "CryptoTicker (fact check)", title: "Cyber Attack on November 17: The Rumor Fact-Checked", url: "https://cryptoticker.io/en/cyber-attack-november-17-crypto-fact-check" },
      { outlet: "Dim Sum Daily", title: "Viral posts claim 17th November will wipe bank balances — remain unfounded", url: "https://www.dimsumdaily.hk/viral-posts-claim-17th-november-will-wipe-bank-balances-and-trigger-a-three%E2%80%91month-global-internet-blackout" },
    ],
  },
];

export interface PatternFinding {
  title: string;
  body: string;
  tag: string;
}

export const PATTERNS: PatternFinding[] = [
  {
    tag: "CLUSTER",
    title: "Four major failures in five days (Nov 9–13)",
    body: "OpenAI API (Nov 9, 52 min) → ChatGPT user reports (Nov 11) → Microsoft 365 (Nov 12, largest outage of 2026) → FAA national ground stop (Nov 13). The week compression is why 'everything is failing at once' is trending — four unrelated root causes, one news cycle.",
  },
  {
    tag: "CAMPAIGN",
    title: "Cold-chain ICS campaign: France → 9-country sweep → federal warning",
    body: "Oct 11: 500+ French stores + blood banks. Nov 1–2: 100+ stores across Belgium, Netherlands, Sweden, Estonia, Ireland, Portugal, Italy, Finland, Germany, Luxembourg. Nov 5: five US agencies cite 'ongoing malicious cyber activity' against industrial refrigeration. Common thread: EOL Danfoss AK-SM800/AK-SC355 controllers, default passwords, and a 'code of the day' login bypass disclosed by Claroty in 2025.",
  },
  {
    tag: "CASCADE",
    title: "Single-zone failures cascade into sectors",
    body: "One Google Cloud London zone (a faulty PLC prevented generators from starting after UPS drain) took down UK banking apps (Lloyds, HSBC, Barclays, NatWest, Revolut), Royal Mail and DPD two days later. One Microsoft network change knocked out email and Teams for users of a platform with ~450M paid commercial seats, with reports from 74 countries and territories.",
  },
  {
    tag: "LEGACY",
    title: "Ageing physical infrastructure is the recurring root cause",
    body: "The FAA ground stop traces to a L3Harris-installed router on ageing telecoms infrastructure. The Shinkin failure was one shared system center's equipment malfunction. Presenc's 2026 tracker: power/cooling failures cause the longest cloud outages, configuration changes the widest.",
  },
  {
    tag: "SIGNAL vs NOISE",
    title: "Most incidents are NOT attacks — and one viral 'attack' isn't real",
    body: "Microsoft (no evidence of cyberattack), Shinkin (equipment malfunction), GCP London (power), UK banking apps (cascade), Chase ('technical issue, not cyber related'). Meanwhile the viral 'Nov 17 bank-wipe cyberattack' has no evidence at all — flagged here as a rumor so real events aren't confused with it.",
  },
];

// Base curated events plus the per-country observation trail of Microsoft EX1550543.
export const EVENTS: GEEvent[] = [...BASE_EVENTS, ...MS_EX1550543_EVENTS];
