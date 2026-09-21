import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validateSalesLedger } from "../../sales/ledger";
import { buildKdpWeeklyDecision, type KdpWeeklyListing } from "./kdp-weekly-publication";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../../..");
const LISTINGS_PATH = resolve(REPO_ROOT, ".claude/config/kdp-listings.json");
const LEDGER_PATH = resolve(REPO_ROOT, ".claude/state/products/sales-ledger.json");
const OUT_PATH = resolve(REPO_ROOT, ".claude/state/products/kdp-weekly-publication.json");

function arg(name: string): string | null {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] ?? null : null;
}

function currentIsoWeek(now: Date): string {
  const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
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
