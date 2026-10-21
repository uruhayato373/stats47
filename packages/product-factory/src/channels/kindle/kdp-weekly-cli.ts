import { isoWeekOf, jstDateOf } from "../../../../../.claude/scripts/metrics/lib/periods.mjs";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validateSalesLedger } from "../../sales/ledger";
import { buildKdpWeeklyDecision, type KdpWeeklyListing } from "./kdp-weekly-publication";
import { KDP_LISTINGS } from "../../../../../config/paths.mjs";
import { datasetPath } from "../../../../../config/datasets.mjs";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../../..");
const LISTINGS_PATH = resolve(REPO_ROOT, KDP_LISTINGS);
const LEDGER_PATH = resolve(REPO_ROOT, datasetPath("sales.ledger"));
const OUT_PATH = resolve(REPO_ROOT, datasetPath("kdp.weekly-publication"));

function arg(name: string): string | null {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] ?? null : null;
}

function currentIsoWeek(now: Date): string {
  return isoWeekOf(jstDateOf(now)); // 正本は .claude/scripts/metrics/lib/periods.mjs (JST の暦日で数える。SCRIPT-ISO-WEEK-UNIFY-01)
}

const now = new Date();
const week = arg("--week") ?? currentIsoWeek(now);
const listingsDocument = JSON.parse(readFileSync(LISTINGS_PATH, "utf8")) as { listings?: Record<string, KdpWeeklyListing> };
const ledger = validateSalesLedger(JSON.parse(readFileSync(LEDGER_PATH, "utf8")));
const decision = buildKdpWeeklyDecision({
  week,
  generatedAt: now.toISOString(),
  listings: listingsDocument.listings ?? {},
  observations: ledger.observations,
});

if (process.argv.includes("--write")) {
  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, `${JSON.stringify(decision, null, 2)}\n`);
  console.error(`KDP weekly gate: wrote ${OUT_PATH}`);
}

console.log(JSON.stringify(decision, null, 2));
