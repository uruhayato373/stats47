/**
 * metric → 原典調査 (originalSurveys[]) 解決ユーティリティ。【ビルド時 / exporter 用】
 *
 * すべての可視化 (ranking / 時系列 / 円グラフ) は metric を源とするため、出典は metric から
 * 解決するのが正。`metric.source.kind` で分岐:
 *
 *   - kakei-chousa : 家計調査 (household-survey)
 *   - estat (SSDS) : cdCat01 → ssds-provenance.generated.json[code].originalSurveys
 *   - estat (一次)  : displayName → DISPLAYNAME_TO_SURVEY
 *   - calculated   : 分子/分母 metric を再帰解決して union
 *   - mlit/external: displayName ベース (個別)
 *
 * 注: ssds-provenance.generated.json (~450KB) を import するため、これはアプリ runtime ではなく
 * ビルド/exporter で使う。最終的に snapshot に originalSurveys を焼き込み、アプリは snapshot を読む。
 */

import type { MetricConfig, MetricRegistry, SourceConfig } from "../types";
import { DISPLAYNAME_TO_SURVEY } from "../ssds/displayname-to-survey";
import ssdsProvenanceJson from "../ssds/ssds-provenance.generated.json";

export type ProvenanceSurvey = { id: string; name: string };

type SsdsEntry = { kind: string; originalSurveys: ProvenanceSurvey[] };
const SSDS_PROVENANCE = ssdsProvenanceJson as Record<string, SsdsEntry>;

const SSDS_DISPLAY_NAME = "社会・人口統計体系";
// kind:"kakei-chousa" は家計調査（品目別）= survey マスタの "kakei-chousa" バケット
const KAKEI_SURVEY: ProvenanceSurvey = { id: "kakei-chousa", name: "家計調査（品目別）" };

function dedupe(surveys: ProvenanceSurvey[]): ProvenanceSurvey[] {
  const seen = new Map<string, ProvenanceSurvey>();
  for (const s of surveys) if (s && !seen.has(s.id)) seen.set(s.id, s);
  return [...seen.values()];
}

function resolveEstat(source: Extract<SourceConfig, { kind: "estat" }>): ProvenanceSurvey[] {
  // SSDS (二次統計): cdCat01 で原典を引く。
  // 市区町村版など displayName に接尾語が付く変種 (例「社会・人口統計体系（市区町村データ…）」) も拾う。
  if (source.displayName?.startsWith(SSDS_DISPLAY_NAME) && source.cdCat01) {
    return SSDS_PROVENANCE[source.cdCat01]?.originalSurveys ?? [];
  }
  // 一次統計: displayName を survey id へ
  const name = source.displayName;
  if (!name) return [];
  const id = DISPLAYNAME_TO_SURVEY[name];
  return id ? [{ id, name }] : [];
}

function resolveCalculated(
  source: Extract<SourceConfig, { kind: "calculated" }>,
  registry: MetricRegistry | undefined,
  depth: number,
): ProvenanceSurvey[] {
  if (!registry || depth > 4) return [];
  const f = source.formula;
  const operandKeys: string[] = [];
  if (f.op === "divide") operandKeys.push(f.numerator, f.denominator);
  else if (f.op === "multiply") operandKeys.push(f.left, f.right);
  else if (f.op === "per_population") operandKeys.push(f.numerator);
  const out: ProvenanceSurvey[] = [];
  for (const key of operandKeys) {
    const m = registry[key];
    if (m) out.push(...resolveMetricProvenance(m, registry, depth + 1));
  }
  return out;
}

/**
 * SourceConfig 単体から原典調査を解決する。metric 全体を持たない呼び出し元
 * (exporter が RankingItem.sourceConfig から解決する等) はこちらを使う。
 *
 * @param registry calculated source の分子/分母を辿るために必要 (任意)
 */
export function resolveSourceProvenance(
  source: SourceConfig,
  registry?: MetricRegistry,
  depth = 0,
): ProvenanceSurvey[] {
  switch (source.kind) {
    case "kakei-chousa":
      return [KAKEI_SURVEY];
    case "estat":
      return dedupe(resolveEstat(source));
    case "calculated":
      return dedupe(resolveCalculated(source, registry, depth));
    case "mlit":
    case "external":
      return source.displayName
        ? [{ id: `src:${source.displayName}`, name: source.displayName }]
        : [];
    default:
      return [];
  }
}

/**
 * metric の原典調査を解決する。解決できない場合は空配列を返す
 * (auto-slug で偽の survey を作らず、未解決を可視化する方針)。
 *
 * @param registry calculated metric の分子/分母を辿るために必要 (任意)
 */
export function resolveMetricProvenance(
  metric: MetricConfig,
  registry?: MetricRegistry,
  depth = 0,
): ProvenanceSurvey[] {
  return resolveSourceProvenance(metric.source, registry, depth);
}
