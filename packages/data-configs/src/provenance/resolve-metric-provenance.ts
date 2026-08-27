/**
 * metric → 原典調査 (originalSurveys[]) 解決ユーティリティ。【ビルド時 / exporter 用】
 *
 * 出典解決は **e-Stat param の単一ルール** (Phase 8):
 *   resolveProvenanceByParams(statsDataId, cdCat01):
 *     - statsDataId ∈ SSDS テーブル → cdCat01 で ssds-provenance を引く (二次統計、複数原典あり)
 *     - それ以外               → statsDataId で survey を引く (一次統計)
 * これで SSDS / 非SSDS / 時系列 / 円グラフ / ranking がすべて同じ param ルールで解決できる
 * (旧 displayName ヒューリスティックを廃止。displayName は statsDataId→survey 表の建設時入力のみ)。
 * kakei-chousa kind は単一調査 (kakei-chousa)、mlit/external は displayName ベース。
 *
 * 注: ssds-provenance.generated.json (~450KB) を import するため、これはアプリ runtime ではなく
 * ビルド/exporter で使う。最終的に snapshot に originalSurveys を焼き込み、アプリは snapshot を読む。
 */

import type { MetricConfig, MetricRegistry, SourceConfig } from "../types";
import { DISPLAYNAME_TO_SURVEY } from "../ssds/displayname-to-survey";
import estatProvenanceJson from "../ssds/estat-provenance.generated.json";
import ssdsProvenanceJson from "../ssds/ssds-provenance.generated.json";

export type ProvenanceSurvey = { id: string; name: string };

/**
 * 出典表記の統一型 (2 階層プロビナンス)。ranking / テーマの全コンポーネントが同じ型で保持・表示する。
 *   - compilation: 編成統計 (二次統計の取得元)。SSDS のときのみ非 null。実際に API で引いた値の出所。
 *   - originalSurveys: 原典調査。SSDS は複数 (集計元)、非SSDS は取得した調査そのもの 1 件。
 * 表示は「出典: {compilation}（原典: {originalSurveys}）」/ compilation=null なら「出典: {originalSurveys}」。
 */
export type SourceAttribution = {
  compilation: { name: string; url?: string } | null;
  originalSurveys: ProvenanceSurvey[];
};

/** SSDS の編成統計メタ (社会・人口統計体系)。 */
const SSDS_COMPILATION = {
  name: "社会・人口統計体系",
  url: "https://www.stat.go.jp/data/ssds/index.htm",
} as const;

type SsdsEntry = { kind: string; originalSurveys: ProvenanceSurvey[] };
const SSDS_PROVENANCE = ssdsProvenanceJson as Record<string, SsdsEntry>;

const ESTAT_PROVENANCE = estatProvenanceJson as {
  ssdsTableIds: string[];
  statsDataIdToSurvey: Record<string, ProvenanceSurvey>;
};
const SSDS_TABLE_IDS = new Set(ESTAT_PROVENANCE.ssdsTableIds);

// kind:"kakei-chousa" は家計調査（品目別）= survey マスタの "kakei-chousa" バケット
const KAKEI_SURVEY: ProvenanceSurvey = { id: "kakei-chousa", name: "家計調査（品目別）" };

function dedupe(surveys: ProvenanceSurvey[]): ProvenanceSurvey[] {
  const seen = new Map<string, ProvenanceSurvey>();
  for (const s of surveys) if (s && !seen.has(s.id)) seen.set(s.id, s);
  return [...seen.values()];
}

/** statsDataId が SSDS (社会・人口統計体系) のテーブルか。SSDS は cdCat01 で原典を引く。 */
export function isSsdsStatsDataId(statsDataId: string | undefined): boolean {
  return !!statsDataId && SSDS_TABLE_IDS.has(statsDataId);
}

/**
 * e-Stat param から原典調査を解決する単一ルール。ranking / 時系列 / 円グラフが共有する。
 *   - statsDataId が SSDS テーブル → cdCat01 で原典 (複数可)
 *   - それ以外                    → statsDataId で survey (1 件)
 */
export function resolveProvenanceByParams(
  statsDataId: string | undefined,
  cdCat01: string | undefined,
): ProvenanceSurvey[] {
  if (!statsDataId) return [];
  if (SSDS_TABLE_IDS.has(statsDataId)) {
    return cdCat01 ? (SSDS_PROVENANCE[cdCat01]?.originalSurveys ?? []) : [];
  }
  const survey = ESTAT_PROVENANCE.statsDataIdToSurvey[statsDataId];
  return survey ? [survey] : [];
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
      return dedupe(resolveProvenanceByParams(source.statsDataId, source.cdCat01));
    case "calculated":
      return dedupe(resolveCalculated(source, registry, depth));
    case "mlit":
    case "external":
      if (!source.displayName) return [];
      return DISPLAYNAME_TO_SURVEY[source.displayName]
        ? [{ id: DISPLAYNAME_TO_SURVEY[source.displayName], name: source.displayName }]
        : [{ id: `src:${source.displayName}`, name: source.displayName }];
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

/**
 * e-Stat param から出典表記 (2 階層) を解決する。ranking / テーマが共有する統一入口。
 *   - SSDS テーブル → compilation=社会・人口統計体系 + originalSurveys(cdCat01 から、複数可)
 *   - 一次統計       → compilation=null + originalSurveys=[その調査]
 */
export function resolveAttribution(
  statsDataId: string | undefined,
  cdCat01: string | undefined,
): SourceAttribution {
  return {
    compilation: isSsdsStatsDataId(statsDataId) ? { ...SSDS_COMPILATION } : null,
    originalSurveys: resolveProvenanceByParams(statsDataId, cdCat01),
  };
}
