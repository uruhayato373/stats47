import "server-only";

import fs from "node:fs";

import {
  cached,
  hasError,
  readJson,
  statePath,
  TTL,
  wrap,
  type Wrapped,
} from "./state-io";
import { buildAffiliatePortfolioViewModel, type AffiliatePortfolioViewModel } from "./affiliate-portfolio-view";

/**
 * アフィリエイト運用の state (`.claude/state/ads/`) を読む。読み取り専用。
 *
 * ★巨大 JSON はここで畳んで件数と内訳だけ返す。a8-catalog は 342KB、
 *   affiliate-catalog は 125KB、placement-map は 38KB あり、raw のまま
 *   client component へ渡すと RSC ペイロードがその分ふくらむ。画面で必要なのは
 *   「今どういう状態か」であって全件ではない。
 */

const DIR = ".claude/state/ads";

type Gate = { status: string; reasons: string[] };

export interface ExperimentVariant {
  variantId: string;
  impressions: number;
  clicks: number;
  ctr: number | null;
}

export interface ExperimentRow {
  experimentId: string;
  kind: string;
  bucket: "active" | "readyToDecide" | "invalid" | "inconclusive" | "closed";
  startedAt: string | null;
  daysElapsed: number | null;
  sampleReached: boolean | null;
  status: string | null;
  variants: ExperimentVariant[];
}

export interface AdsOperations {
  generatedAt: string;
  freshness: { inventoryDays: number | null; ga4Days: number | null };
  measurementGate: Gate;
  publishGate: Gate;
  portfolioGate: Gate;
  coverage: { gapVerticals: string[]; thinVerticals: string[] };
  directPlacements: { total: number; orphaned: string[]; missingDisclosure: string[] };
  recommendedActions: Array<{ id: string; reason: string; command: string }>;
  ga4Totals: { impressions: number; clicks: number; ctr: number } | null;
  experiments: ExperimentRow[];
}

export interface AdsInventory {
  generatedAt: string;
  totals: { entries: number; active: number; uniqueAdvertisers: number };
  byVertical: Array<{ vertical: string; count: number }>;
  byAdType: Array<{ adType: string; count: number }>;
  coverage: {
    verticalsCovered: number;
    verticalsTotal: number;
    gapVerticals: string[];
    thinVerticals: string[];
  };
  sizeViolations: Array<{ id?: string; size?: string; [k: string]: unknown }>;
}

export interface AdsCompliance {
  generatedAt: string;
  structureIssues: unknown[];
  unregisteredTags: unknown[];
  directPlacements: { total: number; orphaned: unknown[]; missingDisclosure: unknown[] };
}

export interface AdsGa4 {
  date: string;
  days: number;
  totals: { impressions: number; clicks: number; ctr: number };
  unsetVerticalRatio: number | null;
  hasVariantBreakdown: boolean | null;
  byVertical: Array<{ vertical: string; impressions: number; clicks: number; ctr: number }>;
  byPosition: Array<{ position: string; impressions: number; clicks: number; ctr: number }>;
}

export interface AdsPilot {
  generatedAt: string;
  readiness: Gate;
  verdict: { status: string; reasons: string[]; winnerVariantId: null };
  feasibility: { status: string; requiredImpressions?: number | null; requiredClicks?: number | null; projectedDays?: number | null } | null;
  recommendedAction: { id: string; reasons: string[] };
}

/** 状態機械カタログ (a8 / 3ASP) は件数だけ返す */
export interface CatalogSummary {
  file: string;
  total: number;
  byStatus: Array<{ status: string; count: number }>;
}

export interface AdsSummary {
  operations: Wrapped<AdsOperations>;
  portfolio: Wrapped<AffiliatePortfolioViewModel>;
  pilot: Wrapped<AdsPilot>;
  inventory: Wrapped<AdsInventory>;
  compliance: Wrapped<AdsCompliance>;
  ga4: Wrapped<AdsGa4>;
  catalogs: Wrapped<CatalogSummary[]>;
}

function countBy(rows: Array<Record<string, unknown>>, key: string) {
  const m = new Map<string, number>();
  for (const r of rows) {
    const v = String(r?.[key] ?? "(未設定)");
    m.set(v, (m.get(v) ?? 0) + 1);
  }
  return [...m.entries()]
    .map(([k, count]) => ({ k, count }))
    .sort((a, b) => b.count - a.count);
}

function toPairs(obj: unknown): Array<[string, number]> {
  if (!obj || typeof obj !== "object") return [];
  return Object.entries(obj as Record<string, number>).sort((a, b) => b[1] - a[1]);
}

function readOperations(): Wrapped<AdsOperations> {
  return wrap(() => {
    const d = readJson<Record<string, any>>(`${DIR}/affiliate-operations-latest.json`);
    const exp = d.experiments ?? {};
    const buckets: ExperimentRow["bucket"][] = [
      "active",
      "readyToDecide",
      "invalid",
      "inconclusive",
      "closed",
    ];
    const experiments: ExperimentRow[] = buckets.flatMap((bucket) =>
      (exp[bucket] ?? []).map((e: any) => ({
        experimentId: e.experimentId,
        kind: e.kind ?? "-",
        bucket,
        startedAt: e.startedAt ?? null,
        daysElapsed: e.daysElapsed ?? null,
        sampleReached: e.sampleReached ?? null,
        status: e.status ?? null,
        variants: e.variants ?? [],
      })),
    );
    return {
      generatedAt: d.generatedAt,
      freshness: {
        inventoryDays: d.freshness?.inventoryDays ?? null,
        ga4Days: d.freshness?.ga4Days ?? null,
      },
      measurementGate: d.measurementGate ?? { status: "unknown", reasons: [] },
      publishGate: d.publishGate ?? { status: "unknown", reasons: [] },
      portfolioGate: d.portfolioGate ?? { status: "unknown", reasons: [] },
      coverage: {
        gapVerticals: d.coverage?.gapVerticals ?? [],
        thinVerticals: d.coverage?.thinVerticals ?? [],
      },
      directPlacements: d.directPlacements ?? { total: 0, orphaned: [], missingDisclosure: [] },
      recommendedActions: d.recommendedActions ?? [],
      ga4Totals: d.ga4Totals ?? null,
      experiments,
    };
  });
}

function readPortfolio(): Wrapped<AffiliatePortfolioViewModel> {
  return wrap(() =>
    buildAffiliatePortfolioViewModel(
      readJson<Record<string, any>>(`${DIR}/affiliate-portfolio-latest.json`),
    ),
  );
}

function readPilot(): Wrapped<AdsPilot> {
  return wrap(() => {
    const d = readJson<Record<string, any>>(`${DIR}/affiliate-pilot-readiness-latest.json`);
    return {
      generatedAt: d.generatedAt,
      readiness: d.readiness,
      verdict: d.verdict,
      feasibility: d.feasibility ?? null,
      recommendedAction: d.recommendedAction,
    };
  });
}

function readInventory(): Wrapped<AdsInventory> {
  return wrap(() => {
    const d = readJson<Record<string, any>>(`${DIR}/inventory-latest.json`);
    return {
      generatedAt: d.generatedAt,
      totals: d.totals ?? { entries: 0, active: 0, uniqueAdvertisers: 0 },
      byVertical: toPairs(d.byVertical).map(([vertical, count]) => ({ vertical, count })),
      byAdType: toPairs(d.byAdType).map(([adType, count]) => ({ adType, count })),
      coverage: {
        verticalsCovered: d.coverage?.verticalsCovered ?? 0,
        verticalsTotal: d.coverage?.verticalsTotal ?? 0,
        gapVerticals: d.coverage?.gapVerticals ?? [],
        thinVerticals: d.coverage?.thinVerticals ?? [],
      },
      sizeViolations: d.sizeViolations ?? [],
    };
  });
}

function readCompliance(): Wrapped<AdsCompliance> {
  return wrap(() => {
    const d = readJson<Record<string, any>>(`${DIR}/compliance-latest.json`);
    return {
      generatedAt: d.generatedAt,
      structureIssues: d.structureIssues ?? [],
      unregisteredTags: d.unregisteredTags ?? [],
      directPlacements: d.directPlacements ?? { total: 0, orphaned: [], missingDisclosure: [] },
    };
  });
}

/** ga4-affiliate-YYYY-MM-DD.json は複数あるので最新 1 本だけ読む */
function readGa4(): Wrapped<AdsGa4> {
  return wrap(() => {
    const files = fs
      .readdirSync(statePath(DIR))
      .filter((f) => /^ga4-affiliate-\d{4}-\d{2}-\d{2}\.json$/.test(f))
      .sort();
    if (files.length === 0) throw new Error("ga4-affiliate-*.json が無い");
    const d = readJson<Record<string, any>>(`${DIR}/${files[files.length - 1]}`);
    const rows: Array<Record<string, any>> = d.overview ?? d.rows ?? [];

    const agg = (key: string) => {
      const m = new Map<string, { impressions: number; clicks: number }>();
      for (const r of rows) {
        const k = String(r?.[key] ?? "(未設定)");
        const cur = m.get(k) ?? { impressions: 0, clicks: 0 };
        cur.impressions += Number(r.impressions ?? 0);
        cur.clicks += Number(r.clicks ?? 0);
        m.set(k, cur);
      }
      return [...m.entries()]
        .map(([k, v]) => ({
          k,
          ...v,
          ctr: v.impressions > 0 ? v.clicks / v.impressions : 0,
        }))
        .sort((a, b) => b.impressions - a.impressions);
    };

    return {
      date: d.date ?? files[files.length - 1],
      days: d.days ?? 0,
      totals: d.totals ?? { impressions: 0, clicks: 0, ctr: 0 },
      unsetVerticalRatio: d.quality?.unsetVerticalRatio ?? null,
      hasVariantBreakdown: d.hasVariantBreakdown ?? null,
      byVertical: agg("affiliate_vertical").map(({ k, ...v }) => ({ vertical: k, ...v })),
      byPosition: agg("link_position").map(({ k, ...v }) => ({ position: k, ...v })),
    };
  });
}

/**
 * 状態機械カタログ。**件数と status 内訳だけ返す** (a8-catalog は 342KB あり、
 * 全件を画面へ渡す意味が無い。どの状態に何件いるかが分かれば運用判断はできる)。
 */
function readCatalogs(): Wrapped<CatalogSummary[]> {
  return wrap(() => {
    const out: CatalogSummary[] = [];
    for (const file of ["a8-catalog.json", "affiliate-catalog.json"]) {
      if (!fs.existsSync(statePath(DIR, file))) continue;
      const d = readJson<Record<string, any>>(`${DIR}/${file}`);
      // a8 は { entries: { <id>: {...} } }、3ASP 側は配列やオブジェクトの揺れがある
      const raw = d.entries ?? d.programs ?? d;
      const rows: Array<Record<string, unknown>> = Array.isArray(raw)
        ? raw
        : Object.values(raw ?? {}).filter((v) => v && typeof v === "object");
      out.push({
        file,
        total: rows.length,
        byStatus: countBy(rows, "status").map(({ k, count }) => ({ status: k, count })),
      });
    }
    return out;
  });
}

export function adsSummary(): AdsSummary {
  return cached("ads", TTL.daily, () => ({
    operations: readOperations(),
    portfolio: readPortfolio(),
    pilot: readPilot(),
    inventory: readInventory(),
    compliance: readCompliance(),
    ga4: readGa4(),
    catalogs: readCatalogs(),
  }));
}

export { hasError };
