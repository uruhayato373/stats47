#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { summarizeSalesLedger, validateSalesLedger } from "./ledger";
import { mergeSalesCoverage, mergeSalesObservations, salesObservationId } from "./ledger-core.mjs";
import { KDP_LISTINGS } from "../../../../config/paths.mjs";

import type { SalesChannel, SalesCoverage, SalesLedger, SalesObservation } from "./types";
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
  // 販売台帳の販路は KDP だけ (2026-11-08 にココナラを撤去。note の売上は認証付き計測が別に記録する)
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
  throw new Error(`unknown sales channel: ${channel}`);
}

function writeLedger(ledger: SalesLedger): void {
  fs.mkdirSync(path.dirname(LEDGER_PATH), { recursive: true });
  fs.writeFileSync(LEDGER_PATH, `${JSON.stringify(ledger, null, 2)}\n`);
}

function record(): void {
  const channel = required("--channel") as SalesChannel;
  if (channel !== "kdp") throw new Error("--channel must be kdp");
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

/**
 * 保管庫から復元した KDP 月次レポート (`restore.mjs kdp --month <YYYY-MM>` の出力を
 * .local/product-sales-evidence/ へ置いたもの) から、その月の計測の範囲を台帳へ足す。
 * 自動記録 (summarize.mjs) が範囲を書くようになる前の月を埋める経路。
 * 古いレポートは数えた書籍の一覧を持たないので、出品台帳の ASIN から作り、ASIN の数が
 * レポートの mappedAsins と一致するときだけ認める (出品台帳が当時と変わっていたら書かない)。
 */
function recordKdpCoverage(): void {
  const evidence = resolveEvidence(required("--report"));
  const report = JSON.parse(fs.readFileSync(path.join(ROOT, evidence.path), "utf8")) as {
    scope?: string;
    finality?: string;
    period?: { start: string; end: string };
    coverage?: { complete?: boolean; mappedAsins?: number; mappedBookIds?: string[] };
  };
  if (
    report.scope !== "stats47-exact-asin" ||
    report.finality !== "finalized-monthly-royalty" ||
    report.coverage?.complete !== true ||
    !report.period
  ) {
    throw new Error("--report must be a complete finalized KDP monthly report");
  }
  let productIds = report.coverage.mappedBookIds;
  if (!productIds) {
    const file = JSON.parse(fs.readFileSync(path.join(ROOT, KDP_LISTINGS), "utf8")) as {
      listings: Record<string, { asin?: string | null; previousEditions?: { asin?: string | null }[] }>;
    };
    const asins = new Map<string, string>();
    for (const [id, listing] of Object.entries(file.listings)) {
      for (const edition of [listing, ...(listing.previousEditions ?? [])]) {
        if (edition.asin) asins.set(edition.asin, id);
      }
    }
    if (asins.size !== report.coverage.mappedAsins) {
      throw new Error(
        `kdp listings have ${asins.size} ASINs but the report mapped ${report.coverage.mappedAsins}; refusing to guess which books were counted`,
      );
    }
    productIds = [...new Set(asins.values())];
  }
  const entry: SalesCoverage = {
    channel: "kdp",
    periodStart: report.period.start,
    periodEnd: report.period.end,
    productIds: [...productIds].sort(),
    evidencePath: evidence.path,
    evidenceSha256: evidence.sha256,
    recordedAt: new Date().toISOString(),
  };
  const merged = mergeSalesCoverage(readLedger(), entry);
  if (merged.conflict) throw new Error(`coverage for ${entry.periodStart}..${entry.periodEnd} already recorded with other products`);
  if (merged.added) writeLedger(merged.ledger);
  console.log(
    `sales ledger: coverage ${entry.periodStart}..${entry.periodEnd} ${merged.added ? "recorded" : "already recorded"} (${entry.productIds.length} products)`,
  );
}

const command = process.argv[2] ?? "summary";

if (command === "init") {
  if (!fs.existsSync(LEDGER_PATH)) writeLedger(EMPTY_LEDGER);
  console.log(`sales ledger: ${LEDGER_PATH}`);
} else if (command === "validate") {
  const ledger = readLedger();
  console.log(`sales ledger: PASS (${ledger.observations.length} observations, ${ledger.coverage?.length ?? 0} coverage)`);
} else if (command === "summary") {
  console.log(JSON.stringify(summarizeSalesLedger(readLedger()), null, 2));
} else if (command === "record") {
  record();
} else if (command === "record-kdp-coverage") {
  recordKdpCoverage();
} else {
  throw new Error(`unknown command: ${command}`);
}
