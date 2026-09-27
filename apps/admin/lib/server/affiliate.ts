import "server-only";

import {
  AFFILIATE_ADS,
} from "../../../../apps/web/scripts/affiliate-ads-data";
import { AFFILIATE_DIRECT_PLACEMENTS } from "../../../../apps/web/scripts/affiliate-direct-placements-data";
import { isAffiliateActive } from "../../../../apps/web/src/features/ads/constants/affiliate-delivery-policy";
import { cached, fileExists, readCsv, readJson, TTL, wrap, type Wrapped } from "./state-io";

/**
 * アフィリエイト領域の 3 画面 (成果 / 掲載先 / 提携・案件) のサーバー層。読み取り専用。
 * 画面の分け方は doboku-note の管理画面 (/affiliate・/affiliate/placements・/affiliate/programs) に揃える。
 * ゲート・実験・pilot・在庫・規約検査の既存集計は ads.ts をそのまま使い、ここでは持たない。
 *
 * 入力:
 * - 成果: `.claude/state/metrics/affiliate/{a8-results,a8-report-log,moshimo-results}.json`、
 *   `.claude/state/metrics/authenticated/latest.json` (ASP ごとの取得状態)、`.claude/state/ads/ga4-affiliate-history.csv`
 * - 掲載先: git TS の広告定義 (`apps/web/scripts/affiliate-ads-data.ts` = 自動配置、
 *   `affiliate-direct-placements-data.ts` = 記事への直貼り)。配信と同じ定義を読むので、画面と本番がずれない
 * - 提携・案件: `.claude/state/ads/{a8-catalog,affiliate-catalog}.json`
 * 欠測は 0 にせず、取得できなかった理由を返す (収益化戦略 §1)。
 */

const METRICS = ".claude/state/metrics/affiliate";
const ADS = ".claude/state/ads";
const AUTH = ".claude/state/metrics/authenticated/latest.json";

/** 表示がこれ以上あるのにクリック 0 の掲載位置を強調する (doboku-note と同じ基準) */
export const ZERO_CLICK_IMPRESSION_THRESHOLD = 1000;

export interface AspCollection {
  asp: string;
  status: string;
  code: string | null;
  observedAt: string | null;
}

export interface A8ProgramResult {
  programRef: string;
  name: string;
  clicks: number;
  conversions: number;
  approved: number;
  revenueYen: number;
}

export interface PositionRow {
  position: string;
  impressions: number;
  clicks: number;
  zeroClickWarning: boolean;
}

export interface AffiliateResults {
  a8: {
    month: string | null;
    programs: A8ProgramResult[];
    /** A8 のサイト別集計 (口座共用の中で stats47 に完全分離された実績) */
    site: { clicks: number; conversions: number; approved: number; revenueYen: number; pendingRevenueYen: number } | null;
    siteFetchedAt: string | null;
    unmapped: number;
    notAttributable: number;
  };
  moshimo: { from: string; to: string; conversions: number; grossRevenueYen: number; revenueYen: number; observedPrograms: number } | null;
  collections: AspCollection[];
  positions: { date: string; days: number; rows: PositionRow[] } | null;
}

export interface AutoPlacementRow {
  locationCode: string;
  label: string;
  ads: number;
  programs: number;
  verticals: string[];
}

export interface DirectPlacementRow {
  id: string;
  asp: string;
  title: string;
  channel: string;
  slug: string;
  position: string;
}

export interface AffiliatePlacements {
  auto: AutoPlacementRow[];
  autoTotals: { activeAds: number; inactiveAds: number };
  direct: DirectPlacementRow[];
}

export interface ProgramRow {
  programRef: string;
  name: string;
  vertical: string | null;
  asp: string;
  status: string;
  rewardYen: number | null;
  /** 配信中の広告定義がある (自動配置で isActive かつ保留・期間外でない) */
  live: boolean;
  /** 配信中広告の最も早い掲載終了日 (endDate)。無期限なら null */
  endDate: string | null;
}

export interface AffiliatePrograms {
  rows: ProgramRow[];
  byStatus: Array<{ asp: string; status: string; count: number }>;
}

const LOCATION_LABELS: Record<string, string> = {
  "blog-bottom": "ブログ記事末",
  "sidebar-bottom": "サイドバー下段",
  "sidebar-sticky": "サイドバー追従",
  "sidebar-inline": "サイドバー中段",
  "area-sidebar": "県ページ サイドバー",
};

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : Number(v ?? 0) || 0);

/** A8 の案件名は a8-results の note「A8 レポート自動取込（名前）」に入っている。無ければ a8-catalog から引く */
function a8Name(record: Record<string, any>, catalog: Record<string, any>): string {
  const fromNote = /（(.+)）\s*$/.exec(String(record.note ?? ""))?.[1];
  return fromNote ?? catalog[record.programId]?.name ?? record.program ?? record.programRef;
}

function readResults(): AffiliateResults {
  const a8Catalog = fileExists(`${ADS}/a8-catalog.json`)
    ? readJson<{ entries: Record<string, any> }>(`${ADS}/a8-catalog.json`).entries ?? {}
    : {};
  const a8Records = fileExists(`${METRICS}/a8-results.json`)
    ? readJson<{ records: Array<Record<string, any>> }>(`${METRICS}/a8-results.json`).records ?? []
    : [];
  const month = a8Records.map((r) => String(r.month)).sort().at(-1) ?? null;
  const programs = a8Records
    .filter((r) => r.month === month)
    .map((r) => ({
      programRef: String(r.programRef ?? r.programId),
      name: a8Name(r, a8Catalog),
      clicks: num(r.clicks),
      conversions: num(r.conversions),
      approved: num(r.approved),
      revenueYen: num(r.revenueYen),
    }))
    .sort((a, b) => b.revenueYen - a.revenueYen || b.conversions - a.conversions || b.clicks - a.clicks);

  const log = fileExists(`${METRICS}/a8-report-log.json`)
    ? readJson<Record<string, any>>(`${METRICS}/a8-report-log.json`)
    : null;
  const site = log?.siteSummary?.[0] ?? null;

  const moshimoRaw = fileExists(`${METRICS}/moshimo-results.json`)
    ? readJson<Record<string, any>>(`${METRICS}/moshimo-results.json`)
    : null;
  const moshimoRecords: Array<Record<string, any>> = moshimoRaw?.records ?? [];
  const sumM = (k: string) => moshimoRecords.reduce((s, r) => s + num(r[k]), 0);

  const auth = fileExists(AUTH) ? readJson<{ sources?: Array<Record<string, any>> }>(AUTH).sources ?? [] : [];
  const collections = ["a8", "moshimo", "afb"].map((asp) => {
    const s = auth.find((x) => x.source === asp);
    return { asp, status: s?.status ?? "未記録", code: s?.code ?? null, observedAt: s?.observedAt ?? null };
  });

  return {
    a8: {
      month,
      programs,
      site: site
        ? {
            clicks: num(site.clicks),
            conversions: num(site.conversions),
            approved: num(site.approved),
            revenueYen: num(site.revenueYen),
            pendingRevenueYen: num(site.pendingRevenueYen),
          }
        : null,
      siteFetchedAt: site?.fetchedAt ?? null,
      unmapped: Array.isArray(log?.unmapped) ? log.unmapped.length : 0,
      notAttributable: Array.isArray(log?.notAttributable) ? log.notAttributable.length : 0,
    },
    moshimo: moshimoRaw
      ? {
          from: moshimoRaw.period?.from ?? "",
          to: moshimoRaw.period?.to ?? "",
          conversions: sumM("conversions"),
          grossRevenueYen: sumM("grossRevenueYen"),
          revenueYen: sumM("revenueYen"),
          observedPrograms: moshimoRaw.coverage?.observedPrograms ?? moshimoRecords.filter((r) => r.observedInReport).length,
        }
      : null,
    collections,
    positions: readPositions(),
  };
}

/** GA4 履歴の最新日の行 (vertical × 掲載位置) を掲載位置ごとに足す。全体行 (_all,_all) と合計が一致する */
function readPositions(): AffiliateResults["positions"] {
  const rel = `${ADS}/ga4-affiliate-history.csv`;
  if (!fileExists(rel)) return null;
  const rows = readCsv(rel);
  const date = rows.map((r) => String(r.date)).sort().at(-1);
  if (!date) return null;
  const latest = rows.filter((r) => r.date === date && r.link_position !== "_all" && r.affiliate_vertical !== "_all");
  const byPosition = new Map<string, { impressions: number; clicks: number }>();
  for (const r of latest) {
    const cur = byPosition.get(String(r.link_position)) ?? { impressions: 0, clicks: 0 };
    cur.impressions += num(r.impressions);
    cur.clicks += num(r.clicks);
    byPosition.set(String(r.link_position), cur);
  }
  return {
    date,
    days: num(latest[0]?.days ?? rows.find((r) => r.date === date)?.days),
    rows: [...byPosition.entries()]
      .map(([position, v]) => ({
        position,
        ...v,
        zeroClickWarning: v.clicks === 0 && v.impressions >= ZERO_CLICK_IMPRESSION_THRESHOLD,
      }))
      .sort((a, b) => b.impressions - a.impressions),
  };
}

function readPlacements(today: string): AffiliatePlacements {
  const active = AFFILIATE_ADS.filter((ad) => isAffiliateActive(ad, today));
  const byLocation = new Map<string, typeof active>();
  for (const ad of active) {
    const key = ad.locationCode ?? "(未設定)";
    byLocation.set(key, [...(byLocation.get(key) ?? []), ad]);
  }
  return {
    auto: [...byLocation.entries()]
      .map(([locationCode, ads]) => ({
        locationCode,
        label: LOCATION_LABELS[locationCode] ?? locationCode,
        ads: ads.length,
        programs: new Set(ads.map((ad) => ad.programRef ?? ad.id)).size,
        verticals: [...new Set(ads.map((ad) => String(ad.vertical)))].sort(),
      }))
      .sort((a, b) => b.ads - a.ads),
    autoTotals: { activeAds: active.length, inactiveAds: AFFILIATE_ADS.length - active.length },
    direct: AFFILIATE_DIRECT_PLACEMENTS.flatMap((p) =>
      p.placements.map((pl) => ({
        id: p.id,
        asp: p.asp,
        title: p.title,
        channel: pl.channel,
        slug: pl.slug,
        position: pl.position,
      })),
    ),
  };
}

function readPrograms(today: string): AffiliatePrograms {
  const liveByRef = new Map<string, string | null>();
  for (const ad of AFFILIATE_ADS) {
    if (!ad.programRef || !isAffiliateActive(ad, today)) continue;
    const prev = liveByRef.get(ad.programRef);
    const end = ad.endDate ?? null;
    // 無期限 (null) を最も遅い扱いにし、期限のある広告があればその最早日を出す
    liveByRef.set(ad.programRef, prev === undefined ? end : prev === null ? end : end === null ? prev : prev < end ? prev : end);
  }
  const rows: ProgramRow[] = [];
  if (fileExists(`${ADS}/a8-catalog.json`)) {
    const entries = readJson<{ entries: Record<string, any> }>(`${ADS}/a8-catalog.json`).entries ?? {};
    for (const e of Object.values(entries)) {
      const programRef = `a8:${e.programId}`;
      rows.push({
        programRef,
        name: e.name ?? e.programId,
        vertical: e.vertical ?? null,
        asp: "a8",
        status: e.status ?? "unknown",
        rewardYen: typeof e.rewardYen === "number" ? e.rewardYen : null,
        live: liveByRef.has(programRef),
        endDate: liveByRef.get(programRef) ?? null,
      });
    }
  }
  if (fileExists(`${ADS}/affiliate-catalog.json`)) {
    const programs = readJson<{ programs: Record<string, any> }>(`${ADS}/affiliate-catalog.json`).programs ?? {};
    for (const p of Object.values(programs)) {
      for (const [asp, a] of Object.entries<Record<string, any>>(p.asps ?? {})) {
        const programRef = `${asp}:${a.promotionId}`;
        rows.push({
          programRef,
          name: p.name ?? programRef,
          vertical: p.vertical ?? null,
          asp,
          status: a.status ?? "unknown",
          rewardYen: typeof a.rewardYen === "number" ? a.rewardYen : null,
          live: liveByRef.has(programRef),
          endDate: liveByRef.get(programRef) ?? null,
        });
      }
    }
  }
  const counts = new Map<string, number>();
  for (const r of rows) counts.set(`${r.asp}\t${r.status}`, (counts.get(`${r.asp}\t${r.status}`) ?? 0) + 1);
  return {
    rows: rows.sort((a, b) => Number(b.live) - Number(a.live) || a.asp.localeCompare(b.asp) || a.name.localeCompare(b.name, "ja")),
    byStatus: [...counts.entries()]
      .map(([k, count]) => {
        const [asp, status] = k.split("\t");
        return { asp, status, count };
      })
      .sort((a, b) => a.asp.localeCompare(b.asp) || b.count - a.count),
  };
}

const todayIso = () => new Date().toISOString().slice(0, 10);

export function affiliateResults(): Wrapped<AffiliateResults> {
  return cached("affiliate-results", TTL.daily, () => wrap(readResults));
}

export function affiliatePlacements(): Wrapped<AffiliatePlacements> {
  return cached("affiliate-placements", TTL.daily, () => wrap(() => readPlacements(todayIso())));
}

export function affiliatePrograms(): Wrapped<AffiliatePrograms> {
  return cached("affiliate-programs", TTL.daily, () => wrap(() => readPrograms(todayIso())));
}
