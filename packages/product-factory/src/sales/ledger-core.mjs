// 販売台帳の検証・KDP 月次レポートからの観測生成・重複なしの追記。
// 依存ゼロの素の JS にしているのは、認証付き計測の record job (npm ci をしない) が
// `node` だけでこれを読み、TS 側 (ledger.ts / cli.ts) と同じ検証で台帳を書くため。
import { createHash } from "node:crypto";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const CHANNELS = ["kdp", "coconala"];
const LOCAL_EVIDENCE_PREFIX = ".local/product-sales-evidence/";
// 暗号化保管庫 (private R2 `operations/authenticated-measurement/<key>.enc`) の KDP 月次レポート。
// 24 か月の ring (`kdpMonthlyVaultKey`) なので month-0〜23 だけを認める。
const VAULT_EVIDENCE_PATTERN = /^vault:kdp\/monthly\/month-(?:[0-9]|1[0-9]|2[0-3])$/;
const COMPARED_FIELDS = ["orders", "units", "netRevenueYen", "refunds"];

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertNonNegativeInteger(value, field) {
  if (!Number.isInteger(value) || Number(value) < 0) {
    throw new Error(`${field} must be a non-negative integer`);
  }
}

function assertEvidence(row, index) {
  if (typeof row.evidencePath !== "string" || !row.evidencePath) {
    throw new Error(`observations[${index}].evidencePath is required`);
  }
  const isLocal = row.evidencePath.startsWith(LOCAL_EVIDENCE_PREFIX);
  const isVault = VAULT_EVIDENCE_PATTERN.test(row.evidencePath);
  if (isVault && row.channel !== "kdp") {
    throw new Error(`observations[${index}].evidencePath vault:kdp/monthly is only for channel kdp`);
  }
  if (!isLocal && !isVault) {
    throw new Error(
      `observations[${index}].evidencePath must be inside .local/product-sales-evidence or vault:kdp/monthly/month-<0-23>`,
    );
  }
}

export function validateSalesLedger(value) {
  if (!isRecord(value) || value.schemaVersion !== 1 || !Array.isArray(value.observations)) {
    throw new Error("sales ledger must have schemaVersion=1 and observations[]");
  }

  const seenIds = new Set();
  const observations = value.observations.map((row, index) => {
    if (!isRecord(row)) throw new Error(`observations[${index}] must be an object`);
    if (typeof row.id !== "string" || !row.id) throw new Error(`observations[${index}].id is required`);
    if (seenIds.has(row.id)) throw new Error(`duplicate observation id: ${row.id}`);
    seenIds.add(row.id);
    if (!CHANNELS.includes(row.channel)) {
      throw new Error(`observations[${index}].channel is invalid`);
    }
    if (typeof row.productId !== "string" || !row.productId) {
      throw new Error(`observations[${index}].productId is required`);
    }
    if (typeof row.periodStart !== "string" || !DATE_PATTERN.test(row.periodStart)) {
      throw new Error(`observations[${index}].periodStart must be YYYY-MM-DD`);
    }
    if (typeof row.periodEnd !== "string" || !DATE_PATTERN.test(row.periodEnd)) {
      throw new Error(`observations[${index}].periodEnd must be YYYY-MM-DD`);
    }
    if (row.periodStart > row.periodEnd) {
      throw new Error(`observations[${index}] periodStart is after periodEnd`);
    }
    assertNonNegativeInteger(row.orders, `observations[${index}].orders`);
    assertNonNegativeInteger(row.units, `observations[${index}].units`);
    assertNonNegativeInteger(row.netRevenueYen, `observations[${index}].netRevenueYen`);
    assertNonNegativeInteger(row.refunds, `observations[${index}].refunds`);
    if (row.kenpRead !== undefined) {
      assertNonNegativeInteger(row.kenpRead, `observations[${index}].kenpRead`);
    }
    assertEvidence(row, index);
    if (typeof row.evidenceSha256 !== "string" || !SHA256_PATTERN.test(row.evidenceSha256)) {
      throw new Error(`observations[${index}].evidenceSha256 must be lowercase sha256`);
    }
    if (typeof row.recordedAt !== "string" || Number.isNaN(Date.parse(row.recordedAt))) {
      throw new Error(`observations[${index}].recordedAt must be ISO datetime`);
    }
    return row;
  });

  return { schemaVersion: 1, observations };
}

/** 手入力 (cli.ts record) と自動記録で同じ id の作り方を使う */
export function salesObservationId(channel, productId, periodStart, periodEnd, evidenceSha256) {
  return createHash("sha256")
    .update([channel, productId, periodStart, periodEnd, evidenceSha256].join(":"))
    .digest("hex")
    .slice(0, 20);
}

/**
 * 月次レポートの stats47 行の内容ハッシュ。xlsx はダウンロードのたびにバイト列が変わりうるため、
 * 復号した report の records (行の順序に依らないよう並べ替える) と月・範囲から求める。
 * `restore.mjs kdp --month <YYYY-MM>` で復元した report から同じ値を再計算して照合できる。
 */
export function kdpMonthlyRecordsSha256(report) {
  const records = report.records.map((record) => JSON.stringify(record)).sort();
  return createHash("sha256")
    .update(JSON.stringify({ month: report.period.month, scope: report.scope, records }))
    .digest("hex");
}

/**
 * パース済みの KDP 月次レポート (kdp-monthly-reports.mjs の parseKdpMonthlyReport) を、
 * 書籍 ID × 月ごとに 1 件の販売観測へ変換する。台帳へは触らない純関数。
 *
 * - 円 (JPY) 以外の行は換算も合算もしない。除外理由を excluded に残す
 * - 円のロイヤリティは書籍ごとに合計してから円単位へ四捨五入する (KU は小数を持つ)
 * - 実質注文数や円の合計が負になる書籍は台帳の型 (非負整数) で表せないので除外理由を残す
 * - レポートに行の無い書籍を 0 件で補完しない
 */
export function kdpMonthlyObservations(report, { vaultKey, recordedAt }) {
  if (
    report?.scope !== "stats47-exact-asin" ||
    report?.finality !== "finalized-monthly-royalty" ||
    report?.coverage?.complete !== true ||
    !Array.isArray(report?.records)
  ) {
    throw new Error("report_incomplete: monthly_report_not_ledger_ready");
  }
  const evidencePath = `vault:${vaultKey}`;
  if (!VAULT_EVIDENCE_PATTERN.test(evidencePath)) throw new Error("vault_invalid_key: kdp_monthly");
  const { start: periodStart, end: periodEnd } = report.period;
  const evidenceSha256 = kdpMonthlyRecordsSha256(report);
  const excluded = [];
  const books = new Map();
  for (const record of report.records) {
    if (record.kind !== "monthly-ebook-royalty" && record.kind !== "monthly-kenp-royalty") {
      throw new Error(`report_schema_changed: monthly_kind_${record.kind}`);
    }
    if (record.currency !== "JPY") {
      excluded.push({ productId: record.id, kind: record.kind, marketplace: record.marketplace,
        currency: record.currency, reason: "non-jpy-currency" });
      continue;
    }
    const book = books.get(record.id) ?? { orders: 0, refunds: 0, netUnits: 0, royalty: 0, kenp: null };
    book.royalty += record.amount;
    if (record.kind === "monthly-ebook-royalty") {
      book.orders += record.orders;
      book.refunds += record.refunds;
      book.netUnits += record.netUnits;
    } else {
      book.kenp = (book.kenp ?? 0) + record.pages;
    }
    books.set(record.id, book);
  }

  const observations = [];
  for (const [productId, book] of [...books].sort(([a], [b]) => a.localeCompare(b))) {
    const netRevenueYen = Math.round(book.royalty);
    if (book.netUnits < 0 || netRevenueYen < 0) {
      excluded.push({ productId, reason: book.netUnits < 0 ? "negative-net-units" : "negative-net-revenue" });
      continue;
    }
    observations.push({
      id: salesObservationId("kdp", productId, periodStart, periodEnd, evidenceSha256),
      channel: "kdp",
      productId,
      periodStart,
      periodEnd,
      orders: book.orders,
      units: book.netUnits,
      netRevenueYen,
      refunds: book.refunds,
      ...(book.kenp === null ? {} : { kenpRead: book.kenp }),
      evidencePath,
      evidenceSha256,
      recordedAt,
    });
  }
  return { observations, excluded };
}

/**
 * 観測を台帳へ足す。同じチャネル・書籍・期間の行が既にあれば足さない (再実行・手入力済みの月を二重に数えない)。
 * 既存行と数値が食い違う場合も上書きせず conflicts に返し、呼び元が要対応として扱う。
 */
export function mergeSalesObservations(ledger, candidates) {
  const current = validateSalesLedger(ledger);
  const next = [...current.observations];
  const added = [];
  const skipped = [];
  const conflicts = [];
  for (const candidate of candidates) {
    const existing = next.find(
      (row) =>
        row.channel === candidate.channel &&
        row.productId === candidate.productId &&
        row.periodStart === candidate.periodStart &&
        row.periodEnd === candidate.periodEnd,
    );
    if (!existing) {
      next.push(candidate);
      added.push(candidate.id);
      continue;
    }
    const differs =
      COMPARED_FIELDS.some((field) => existing[field] !== candidate[field]) ||
      (existing.kenpRead ?? 0) !== (candidate.kenpRead ?? 0);
    if (differs) {
      conflicts.push({ productId: candidate.productId, periodStart: candidate.periodStart, existingId: existing.id,
        candidateId: candidate.id });
    } else {
      skipped.push({ productId: candidate.productId, periodStart: candidate.periodStart, existingId: existing.id });
    }
  }
  return { ledger: validateSalesLedger({ schemaVersion: 1, observations: next }), added, skipped, conflicts };
}
