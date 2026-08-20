/**
 * GEO-SCOPE-SEPARATION-01 WP6 — 全 ThemeCatalog 依存を official/derived/unsupported/unknown へ分類する。
 *
 * WP0 (education-culture pilot) と同じ手法をカタログ横断へ拡張する:
 *   1. THEME_CATALOGS の全テーマ・全 metric (rankingKey) を列挙する。
 *   2. 各 metric の MetricConfig から e-Stat request key を組み立て、
 *      既存の週次 live audit (`.claude/state/theme-charts/live-audit.json`、192 distinct request
 *      を coverageOk:true で網羅済み・2026-08-15 実測) と突合する。
 *   3. hasNational===true → official 候補 (値レベルの一次資料照合は別途要)。
 *      hasNational===false → unsupported (00000 行自体が無い)。
 *      live audit に無い / 非 estat kind → unknown。
 *
 * ★このスクリプトは「行の存在」しか見ない (live audit と同じ穴)。value='-' プレースホルダの
 *   誤判定は WP0 で 1 件実際に発生した (in-pref-university-entrance-ratio-by-highschool-origin)。
 *   official 候補は集合を絞り込むためのものであり、Japan catalog へ採用する前に
 *   値レベルの一次資料照合 (fetch-and-verify) を別途行う。
 *
 * 使い方: npx tsx packages/data-configs/scripts/classify-japan-candidates.ts
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { requestKey } from "../src/theme-catalog/chart-dependencies";
import { THEME_CATALOGS } from "../src/theme-catalog/index";
import { getMetricConfig } from "../src/registry";

import type { CatalogMetric } from "../src/theme-catalog/types";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const LIVE_AUDIT_PATH = path.join(
  REPO_ROOT,
  ".claude/state/theme-charts/live-audit.json",
);

interface LiveAuditResult {
  theme: string;
  componentKey: string;
  componentType: string;
  params: Record<string, string>;
  status: string;
  rows: number;
  hasNational: boolean;
  tableTitle?: string;
}

interface LiveAudit {
  auditedAt: string;
  distinctExpected: number;
  audited: number;
  coverageOk: boolean;
  results: LiveAuditResult[];
}

type Classification =
  | "official-candidate"
  | "unsupported"
  | "unknown-non-estat"
  | "unknown-no-audit-entry";

interface MetricClassification {
  themeKey: string;
  metricKey: string;
  role: CatalogMetric["role"];
  requestKey: string | null;
  classification: Classification;
  hasNational: boolean | null;
  auditedAt: string | null;
  reason: string;
}

function loadLiveAudit(): LiveAudit {
  return JSON.parse(readFileSync(LIVE_AUDIT_PATH, "utf8")) as LiveAudit;
}

/**
 * e-Stat に渡してよいクエリキーだけを filters として扱う (`source-config.ts` の
 * `ESTAT_QUERY_KEYS` と同一の allowlist)。source には `displayName`/`url` のような
 * 非クエリ文字列フィールドも同居するため、それらを filters に混ぜると request key が
 * 一致しなくなる (実際に最初の実行でこれを踏んだ: 全 education-culture metric が
 * unknown-no-audit-entry になった)。
 */
const ESTAT_QUERY_FILTER_KEYS = [
  "cdCat01",
  "cdCat02",
  "cdCat03",
  "cdCat04",
  "cdCat05",
  "cdTab",
] as const;

/** MetricConfig の estat source から live-audit と同一形式の request key を組み立てる。 */
function deriveEstatRequestKey(
  source: unknown,
): { key: string; filters: Record<string, string> } | null {
  if (typeof source !== "object" || source === null) return null;
  const s = source as Record<string, unknown>;
  if (s.kind !== "estat") return null;
  const statsDataId = s.statsDataId;
  if (typeof statsDataId !== "string" || statsDataId.length === 0) return null;
  const filters: Record<string, string> = {};
  for (const k of ESTAT_QUERY_FILTER_KEYS) {
    const v = s[k];
    if (typeof v === "string" && v.length > 0) filters[k] = v;
  }
  return { key: requestKey({ statsDataId, filters }), filters };
}

function classifyAll(): MetricClassification[] {
  const audit = loadLiveAudit();
  // live-audit.json の results は params (statsDataId + filters) を直接持つので、
  // requestKey() と同じロジックでキーを再構築して突合する。
  const auditByKey = new Map<string, LiveAuditResult>();
  for (const r of audit.results) {
    const { statsDataId, ...rest } = r.params;
    const filters: Record<string, string> = {};
    for (const [k, v] of Object.entries(rest)) {
      if (typeof v === "string") filters[k] = v;
    }
    const key = requestKey({ statsDataId, filters });
    if (!auditByKey.has(key)) auditByKey.set(key, r);
  }

  const out: MetricClassification[] = [];
  for (const [themeKey, catalog] of Object.entries(THEME_CATALOGS)) {
    for (const metric of catalog.metrics) {
      const config = getMetricConfig(metric.rankingKey);
      if (!config) {
        out.push({
          themeKey,
          metricKey: metric.rankingKey,
          role: metric.role,
          requestKey: null,
          classification: "unknown-non-estat",
          hasNational: null,
          auditedAt: null,
          reason: "MetricConfig not found in registry (should not happen; validator should catch)",
        });
        continue;
      }
      const derived = deriveEstatRequestKey(config.source);
      if (!derived) {
        out.push({
          themeKey,
          metricKey: metric.rankingKey,
          role: metric.role,
          requestKey: null,
          classification: "unknown-non-estat",
          hasNational: null,
          auditedAt: null,
          reason: `source.kind = ${config.source.kind} (not estat; needs manual review for derived-additive/derived-ratio)`,
        });
        continue;
      }
      const found = auditByKey.get(derived.key);
      if (!found) {
        out.push({
          themeKey,
          metricKey: metric.rankingKey,
          role: metric.role,
          requestKey: derived.key,
          classification: "unknown-no-audit-entry",
          hasNational: null,
          auditedAt: null,
          reason: "not present in live-audit.json (never audited, or chart doesn't reference this exact request)",
        });
        continue;
      }
      out.push({
        themeKey,
        metricKey: metric.rankingKey,
        role: metric.role,
        requestKey: derived.key,
        classification: found.hasNational ? "official-candidate" : "unsupported",
        hasNational: found.hasNational,
        auditedAt: audit.auditedAt,
        reason: found.hasNational
          ? "00000 row exists (live-audit); VALUE-LEVEL verification still required before Japan catalog adoption"
          : "00000 row does not exist in this table (structurally unsupported)",
      });
    }
  }
  return out;
}

function main() {
  const results = classifyAll();
  const summary = {
    total: results.length,
    "official-candidate": results.filter((r) => r.classification === "official-candidate").length,
    unsupported: results.filter((r) => r.classification === "unsupported").length,
    "unknown-non-estat": results.filter((r) => r.classification === "unknown-non-estat").length,
    "unknown-no-audit-entry": results.filter((r) => r.classification === "unknown-no-audit-entry").length,
  };
  console.log(JSON.stringify({ summary, results }, null, 2));
}

main();
