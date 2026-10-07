#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { summarizeSalesLedger, validateSalesLedger } from "./ledger";
import { mergeSalesObservations, salesObservationId } from "./ledger-core.mjs";
import { COCONALA_LISTINGS, KDP_LISTINGS } from "../../../../config/paths.mjs";

import type { SalesChannel, SalesLedger, SalesObservation } from "./types";
import { datasetPath } from "../../../../config/datasets.mjs";

const ROOT = path.resolve(__dirname, "../../../..");
const LEDGER_PATH = path.join(ROOT, datasetPath("sales.ledger"));
const EVIDENCE_ROOT = path.join(ROOT, ".local/product-sales-evidence");
const EMPTY_LEDGER: SalesLedger = { schemaVersion: 1, observations: [] };

function arg(name: string): string | null {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] ?? null : null;
}

function required(name: string): string {
  const value = arg(name);
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function nonNegativeInteger(name: string, optional = false): number | undefined {
  const raw = arg(name);
  if (raw === null && optional) return undefined;
  if (raw === null || !/^\d+$/.test(raw)) throw new Error(`${name} must be a non-negative integer`);
  return Number(raw);
}

function readLedger(): SalesLedger {
  if (!fs.existsSync(LEDGER_PATH)) return EMPTY_LEDGER;
  return validateSalesLedger(JSON.parse(fs.readFileSync(LEDGER_PATH, "utf8")));
}

function resolveEvidence(relativePath: string): { path: string; sha256: string } {
  const absolute = path.resolve(ROOT, relativePath);
  const relativeToEvidenceRoot = path.relative(EVIDENCE_ROOT, absolute);
  if (relativeToEvidenceRoot.startsWith("..") || path.isAbsolute(relativeToEvidenceRoot)) {
    throw new Error("--evidence must be inside .local/product-sales-evidence");
  }
  if (!fs.existsSync(absolute)) throw new Error("--evidence file does not exist");
  if (!fs.statSync(absolute).isFile()) throw new Error("--evidence must point to a file");
  const sha256 = crypto.createHash("sha256").update(fs.readFileSync(absolute)).digest("hex");
  return { path: path.relative(ROOT, absolute), sha256 };
}

function assertPublishedProduct(channel: SalesChannel, productId: string): void {
  if (channel === "kdp") {
    const file = JSON.parse(fs.readFileSync(path.join(ROOT, KDP_LISTINGS), "utf8")) as {
      listings: Record<string, { kdpStatus?: string; asin?: string | null }>;
    };
    const listing = file.listings[productId];
    if (!listing || listing.kdpStatus !== "live" || !listing.asin) {
      throw new Error(`${productId} is not a live KDP product with an ASIN`);
    }
    return;
  }

  const file = JSON.parse(fs.readFileSync(path.join(ROOT, COCONALA_LISTINGS), "utf8")) as {
    listings: Record<string, { status?: string; serviceUrl?: string | null }>;
  };
  const listing = file.listings[productId];
  if (!listing || listing.status !== "listed" || !listing.serviceUrl) {
    throw new Error(`${productId} is not a listed Coconala product with a service URL`);
  }
}

function writeLedger(ledger: SalesLedger): void {
  fs.mkdirSync(path.dirname(LEDGER_PATH), { recursive: true });
  fs.writeFileSync(LEDGER_PATH, `${JSON.stringify(ledger, null, 2)}\n`);
}

function record(): void {
  const channel = required("--channel") as SalesChannel;
  if (channel !== "kdp" && channel !== "coconala") throw new Error("--channel must be kdp|coconala");
  const evidence = resolveEvidence(required("--evidence"));
  const productId = required("--product-id");
  assertPublishedProduct(channel, productId);
  const periodStart = required("--period-start");
  const periodEnd = required("--period-end");
  const kenpRead = nonNegativeInteger("--kenp", true);
  const observation: SalesObservation = {
    id: salesObservationId(channel, productId, periodStart, periodEnd, evidence.sha256),
    channel,
    productId,
    periodStart,
    periodEnd,
    orders: nonNegativeInteger("--orders") as number,
    units: nonNegativeInteger("--units") as number,
    netRevenueYen: nonNegativeInteger("--net-yen") as number,
    refunds: nonNegativeInteger("--refunds") as number,
    ...(kenpRead === undefined ? {} : { kenpRead }),
    evidencePath: evidence.path,
    evidenceSha256: evidence.sha256,
    recordedAt: new Date().toISOString(),
  };

  // CI の KDP 月次自動記録と同じ判定。同じ商品・期間の行があれば二重に数えない
  const { ledger: next, added, skipped, conflicts } = mergeSalesObservations(readLedger(), [observation]);
  const existing = [...skipped, ...conflicts][0];
  if (added.length === 0 && existing) {
    throw new Error(`already recorded for ${productId} ${periodStart}..${periodEnd}: ${existing.existingId}`);
  }
  writeLedger(next);
  console.log(`sales ledger: recorded ${observation.id}`);
}

const command = process.argv[2] ?? "summary";

if (command === "init") {
  if (!fs.existsSync(LEDGER_PATH)) writeLedger(EMPTY_LEDGER);
  console.log(`sales ledger: ${LEDGER_PATH}`);
} else if (command === "validate") {
  const ledger = readLedger();
  console.log(`sales ledger: PASS (${ledger.observations.length} observations)`);
} else if (command === "summary") {
  console.log(JSON.stringify(summarizeSalesLedger(readLedger()), null, 2));
} else if (command === "record") {
  record();
} else {
  throw new Error(`unknown command: ${command}`);
}
