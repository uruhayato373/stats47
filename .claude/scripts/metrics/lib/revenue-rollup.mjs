/**
 * 収益の明細 (data/revenue/daily/<channel>-<YYYY-MM>.json) の書き込みと集計 (純関数)。
 *
 * 明細は 1 行 = 日付 × 商品 × 種類で、販売元のレポートの粒度のまま持つ (2026-11-14 オーナー決定)。
 * 週・月・年はここで集計する生成物で、手では編集しない。
 *
 * 読み方の約束:
 * - coverage に入っている日で行が無いものは 0 (計測して 0 件)
 * - coverage の外の日は未計測。期間のうち 1 日でも外にあれば、その期間の合計は出さない (欠測を 0 にしない)
 * - 取得のたびに直近の期間を取り直す。取り直した範囲の行は捨てて入れ替える (レポートから消えた行を残さない)
 */

import { addDays, isoWeekOf, isoWeekRange } from "./periods.mjs";

/** @typedef {{date:string, channel:string, productId:string|null, kind:string, quantity?:number, amountYen?:number, finality:"provisional"|"final", marketplace?:string, observedAt:string}} DailyRow */
/** @typedef {{start:string, end:string, observedAt:string, evidenceSha256?:string}} Coverage */
/** @typedef {{schemaVersion:1, channel:string, month:string, coverage:Coverage[], rows:DailyRow[]}} DailyDoc */

export const REVENUE_CHANNELS = ["adsense", "note", "kdp", "a8", "rakuten"];

/** チャネルごとの「収益として数える種類」。NSM の定義 (AdSense 確定額 + アフィリエイト発生額 + 商品の実売額) に合わせる */
export const REVENUE_KIND = { adsense: ["earnings"], note: ["sales", "sales-total"], kdp: ["royalty-estimate"], a8: ["occurred"], rakuten: ["occurred"] };
/** チャネルごとの「購入の件数として数える種類」 */
export const ORDER_KIND = { note: ["sales"], kdp: ["paid-orders"] };

export const dailyFileName = (channel, month) => `${channel}-${month}`;

const rowKey = (r) => JSON.stringify([r.date, r.productId, r.kind, r.marketplace ?? null]);
const monthOf = (date) => date.slice(0, 7);
const lastDayOf = (month) => {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
};

/** 重なる・隣り合う範囲を 1 つにまとめる。observedAt と証跡は新しいほうを残す */
function mergeCoverage(list) {
  const sorted = [...list].sort((a, b) => a.start.localeCompare(b.start));
  /** @type {Coverage[]} */
  const out = [];
  for (const c of sorted) {
    const last = out.at(-1);
    if (last && c.start <= addDays(last.end, 1)) {
      const newer = c.observedAt > last.observedAt ? c : last;
      out[out.length - 1] = { ...newer, start: last.start, end: c.end > last.end ? c.end : last.end };
    } else out.push({ ...c });
  }
  return out;
}

/**
 * 取得した 1 回分 (start〜end の全行) を月ごとの差分に分ける。
 * @param {{channel:string, start:string, end:string, rows:DailyRow[], observedAt:string, evidenceSha256?:string}} batch
 * @returns {Array<{channel:string, month:string, coverage:Coverage, rows:DailyRow[]}>}
 */
export function partitionByMonth({ channel, start, end, rows, observedAt, evidenceSha256 }) {
  if (start > end) throw new Error(`invalid range: ${start} > ${end}`);
  const outside = rows.find((r) => r.date < start || r.date > end || r.channel !== channel);
  if (outside) throw new Error(`row outside the batch: ${JSON.stringify(outside)}`);
  const parts = [];
  for (let month = monthOf(start); month <= monthOf(end); month = monthOf(addDays(lastDayOf(month), 1))) {
    const from = month === monthOf(start) ? start : `${month}-01`;
    const to = month === monthOf(end) ? end : lastDayOf(month);
    parts.push({
      channel,
      month,
      coverage: { start: from, end: to, observedAt, ...(evidenceSha256 ? { evidenceSha256 } : {}) },
      rows: rows.filter((r) => monthOf(r.date) === month),
    });
  }
  return parts;
}

/**
 * 月のファイルへ 1 回分を入れる。取り直した範囲の既存の行は捨てて入れ替える。
 * @param {DailyDoc|null} doc
 * @param {{channel:string, month:string, coverage:Coverage, rows:DailyRow[]}} part
 * @returns {DailyDoc}
 */
export function mergeDaily(doc, part) {
  if (doc && (doc.channel !== part.channel || doc.month !== part.month)) throw new Error("channel / month mismatch");
  const keys = new Set();
  for (const r of part.rows) {
    const key = rowKey(r);
    if (keys.has(key)) throw new Error(`duplicate row in the batch: ${key}`);
    keys.add(key);
  }
  const kept = (doc?.rows ?? []).filter((r) => r.date < part.coverage.start || r.date > part.coverage.end);
  const rows = [...kept, ...part.rows].sort((a, b) => rowKey(a).localeCompare(rowKey(b)));
  return { schemaVersion: 1, channel: part.channel, month: part.month, coverage: mergeCoverage([...(doc?.coverage ?? []), part.coverage]), rows };
}

function coveredDates(docs, channel, start, end) {
  const ranges = docs.filter((d) => d.channel === channel).flatMap((d) => d.coverage);
  const covered = [];
  for (let d = start; d <= end; d = addDays(d, 1)) if (ranges.some((c) => c.start <= d && d <= c.end)) covered.push(d);
  return covered;
}

const daysBetween = (start, end) => Math.round((Date.parse(end) - Date.parse(start)) / 86_400_000) + 1;

/**
 * 1 チャネルの 1 期間を集計する。
 * @param {DailyDoc[]} docs
 * @param {{channel:string, start:string, end:string}} q
 * @returns {{channel:string, start:string, end:string, status:"ok"|"partial"|"unmeasurable", expectedDays:number, coveredDays:number,
 *   revenueYen:number|null, orders:number|null, provisional:boolean,
 *   kinds:Record<string,{quantity:number, amountYen:number}>, products:Record<string,{revenueYen:number, orders:number}>}}
 */
export function summarizePeriod(docs, { channel, start, end }) {
  const expectedDays = daysBetween(start, end);
  const coveredDays = coveredDates(docs, channel, start, end).length;
  const status = coveredDays === expectedDays ? "ok" : coveredDays === 0 ? "unmeasurable" : "partial";
  const rows = docs.filter((d) => d.channel === channel).flatMap((d) => d.rows).filter((r) => r.date >= start && r.date <= end);
  /** @type {Record<string,{quantity:number, amountYen:number}>} */
  const kinds = {};
  /** @type {Record<string,{revenueYen:number, orders:number}>} */
  const products = {};
  const revenueKinds = REVENUE_KIND[channel] ?? [];
  const orderKinds = ORDER_KIND[channel] ?? [];
  let revenue = 0;
  let orders = 0;
  let provisional = false;
  for (const r of rows) {
    const k = (kinds[r.kind] ??= { quantity: 0, amountYen: 0 });
    k.quantity += r.quantity ?? 0;
    k.amountYen += r.amountYen ?? 0;
    const isRevenue = revenueKinds.includes(r.kind);
    const isOrder = orderKinds.includes(r.kind);
    if (isRevenue) {
      revenue += r.amountYen ?? 0;
      if (r.finality === "provisional") provisional = true;
    }
    if (isOrder) orders += r.quantity ?? 0;
    if (r.productId && (isRevenue || isOrder)) {
      const p = (products[r.productId] ??= { revenueYen: 0, orders: 0 });
      if (isRevenue) p.revenueYen += r.amountYen ?? 0;
      if (isOrder) p.orders += r.quantity ?? 0;
    }
  }
  const complete = status === "ok";
  return {
    channel, start, end, status, expectedDays, coveredDays,
    revenueYen: complete ? revenue : null,
    orders: complete && orderKinds.length ? orders : null,
    provisional, kinds, products,
  };
}

/** 明細のある最初の日〜最後の日 (coverage の端) */
function coverageSpan(docs) {
  const all = docs.flatMap((d) => d.coverage);
  if (all.length === 0) return null;
  return { start: all.map((c) => c.start).sort()[0], end: all.map((c) => c.end).sort().at(-1) };
}

function periodsOf(grain, span) {
  const out = [];
  if (grain === "week") {
    let { monday, sunday } = isoWeekRange(isoWeekOf(span.start));
    while (monday <= span.end) {
      out.push({ period: isoWeekOf(monday), start: monday, end: sunday });
      monday = addDays(monday, 7);
      sunday = addDays(sunday, 7);
    }
  } else if (grain === "month") {
    for (let month = monthOf(span.start); month <= monthOf(span.end); month = monthOf(addDays(lastDayOf(month), 1))) {
      out.push({ period: month, start: `${month}-01`, end: lastDayOf(month) });
    }
  } else {
    for (let y = Number(span.start.slice(0, 4)); y <= Number(span.end.slice(0, 4)); y++) out.push({ period: `${y}`, start: `${y}-01-01`, end: `${y}-12-31` });
  }
  return out;
}

/**
 * 週・月・年の集計 (チャネル別)。coverage がある期間だけを出す。
 * @param {DailyDoc[]} docs
 * @param {"week"|"month"|"year"} grain
 */
export function rollup(docs, grain) {
  const span = coverageSpan(docs);
  if (!span) return [];
  const channels = REVENUE_CHANNELS.filter((c) => docs.some((d) => d.channel === c));
  return periodsOf(grain, span).flatMap(({ period, start, end }) =>
    channels
      .map((channel) => ({ period, ...summarizePeriod(docs, { channel, start, end }) }))
      .filter((r) => r.coveredDays > 0),
  );
}
