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

import type { RankingHookAreaNoun } from '../prominence/derive-ranking-hook';
import type { MetricConfig, MetricRegistry, SourceConfig } from '../types';
import { DISPLAYNAME_TO_SURVEY } from '../ssds/displayname-to-survey';
import estatProvenanceJson from '../ssds/estat-provenance.generated.json';
import ssdsProvenanceJson from '../ssds/ssds-provenance.generated.json';
import surveysMasterJson from '../../../../data/surveys/master/surveys.json';
import { getReferenceDataSource } from './data-source-entry';

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
const ssdsSource = getReferenceDataSource('ssds');
const SSDS_COMPILATION = { name: ssdsSource.label, url: ssdsSource.url };

/** primarySurveys = 指標計算式の分子の原典 (主出典)。全原典と同じ項目には無い */
type SsdsEntry = { kind: string; originalSurveys: ProvenanceSurvey[]; primarySurveys?: ProvenanceSurvey[] };
const SSDS_PROVENANCE = ssdsProvenanceJson as Record<string, SsdsEntry>;

const ESTAT_PROVENANCE = estatProvenanceJson as {
  ssdsTableIds: string[];
  statsDataIdToSurvey: Record<string, ProvenanceSurvey>;
};
const SSDS_TABLE_IDS = new Set(ESTAT_PROVENANCE.ssdsTableIds);

/**
 * 調査マスタ (カタログの surveys.master) の id → name。調査名の正本。
 * 生成 JSON (estat/ssds-provenance.generated.json) は取り込み時の表記 (「人口動態調査」「国勢調査報告」等) を
 * 焼き込んでいるため、マスタに実在する id は必ずマスタの name で返す (/survey/<id> の見出しと出典表記を揃える)。
 */
const SURVEY_MASTER_NAME: ReadonlyMap<string, string> = new Map(
  (surveysMasterJson as ReadonlyArray<{ id: string; name: string }>).map((s) => [s.id, s.name])
);

/** 合成 id (マスタに実在しない fallback)。`ssds-src:<原典名>` / `src:<displayName>` */
export function isSyntheticSurveyId(id: string): boolean {
  return id.startsWith('ssds-src:') || id.startsWith('src:');
}

function withMasterName(survey: ProvenanceSurvey): ProvenanceSurvey {
  const name = SURVEY_MASTER_NAME.get(survey.id);
  return name && name !== survey.name ? { id: survey.id, name } : survey;
}

// kind:"kakei-chousa" は家計調査の品目別の表 = survey マスタの "kakei-chousa" バケット
// (surveys.json で parentSourceId: "household-survey" = 家計調査の子として明示)
const KAKEI_SURVEY: ProvenanceSurvey = withMasterName({
  id: 'kakei-chousa',
  name: '家計調査',
});

function dedupe(surveys: ProvenanceSurvey[]): ProvenanceSurvey[] {
  const seen = new Map<string, ProvenanceSurvey>();
  for (const s of surveys) if (s && !seen.has(s.id)) seen.set(s.id, withMasterName(s));
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
  cdCat01: string | undefined
): ProvenanceSurvey[] {
  if (!statsDataId) return [];
  if (SSDS_TABLE_IDS.has(statsDataId)) {
    return cdCat01
      ? (SSDS_PROVENANCE[cdCat01]?.originalSurveys ?? []).map(withMasterName)
      : [];
  }
  const survey = ESTAT_PROVENANCE.statsDataIdToSurvey[statsDataId];
  return survey ? [withMasterName(survey)] : [];
}

/**
 * 辿る範囲。'all' = 式に出る全項目の原典 (出典の表記)、'primary' = 分子の原典だけ (調査のページへ並べる主出典)。
 * 人口や面積で割っただけの指標を、分母の調査 (国勢調査・人口推計・面積調) のページへ並べないために分ける (2026-11-14)。
 */
type ProvenanceScope = 'all' | 'primary';

/** SSDS 指標の主出典 (分子の原典)。主出典を持たない項目・一次統計は全原典と同じ。 */
function resolvePrimaryProvenanceByParams(
  statsDataId: string | undefined,
  cdCat01: string | undefined
): ProvenanceSurvey[] {
  const primary =
    statsDataId && cdCat01 && SSDS_TABLE_IDS.has(statsDataId)
      ? SSDS_PROVENANCE[cdCat01]?.primarySurveys
      : undefined;
  return primary
    ? primary.map(withMasterName)
    : resolveProvenanceByParams(statsDataId, cdCat01);
}

function resolveCalculated(
  source: Extract<SourceConfig, { kind: 'calculated' }>,
  registry: MetricRegistry | undefined,
  depth: number,
  scope: ProvenanceScope
): ProvenanceSurvey[] {
  if (!registry || depth > 4) return [];
  const f = source.formula;
  const operandKeys: string[] = [];
  if (f.op === 'divide')
    operandKeys.push(f.numerator, ...(scope === 'all' ? [f.denominator] : []));
  else if (f.op === 'multiply' || f.op === 'subtract')
    operandKeys.push(f.left, f.right);
  else if (f.op === 'per_population') operandKeys.push(f.numerator);
  const out: ProvenanceSurvey[] = [];
  for (const key of operandKeys) {
    const m = registry[key];
    if (m) out.push(...resolveMetricScoped(m, registry, depth + 1, scope));
  }
  return out;
}

function resolveLegacyCalculated(
  metric: MetricConfig,
  registry: MetricRegistry | undefined,
  depth: number,
  scope: ProvenanceScope
): ProvenanceSurvey[] {
  if (!registry || depth > 4) return [];
  const calculation = metric.calculation;
  // 引き算は両方の項目が主出典。割り算 (ratio / per_capita) の分母だけを主出典から外す
  const includesDenominator = scope === 'all' || calculation?.type === 'subtraction';
  const operandKeys = [
    calculation?.numeratorKey,
    includesDenominator ? calculation?.denominatorKey : undefined,
  ].filter((key): key is string => Boolean(key));
  const out: ProvenanceSurvey[] = [];
  for (const key of operandKeys) {
    const operand = registry[key];
    if (operand)
      out.push(...resolveMetricScoped(operand, registry, depth + 1, scope));
  }
  return out;
}

function resolveSourceScoped(
  source: SourceConfig,
  registry: MetricRegistry | undefined,
  depth: number,
  scope: ProvenanceScope
): ProvenanceSurvey[] {
  switch (source.kind) {
    case 'kakei-chousa':
      return [KAKEI_SURVEY];
    case 'estat':
      return dedupe(
        scope === 'primary'
          ? resolvePrimaryProvenanceByParams(source.statsDataId, source.cdCat01)
          : resolveProvenanceByParams(source.statsDataId, source.cdCat01)
      );
    case 'calculated':
      return dedupe(resolveCalculated(source, registry, depth, scope));
    case 'mlit':
    case 'external':
      if (!source.displayName) return [];
      return DISPLAYNAME_TO_SURVEY[source.displayName]
        ? [
            withMasterName({
              id: DISPLAYNAME_TO_SURVEY[source.displayName],
              name: source.displayName,
            }),
          ]
        : [{ id: `src:${source.displayName}`, name: source.displayName }];
    default:
      return [];
  }
}

function resolveMetricScoped(
  metric: MetricConfig,
  registry: MetricRegistry | undefined,
  depth: number,
  scope: ProvenanceScope
): ProvenanceSurvey[] {
  if (
    metric.source.kind === 'external' &&
    metric.source.fetcherKey === 'calculated'
  ) {
    const resolved = dedupe(
      resolveLegacyCalculated(metric, registry, depth, scope)
    );
    if (resolved.length > 0) return resolved;
  }
  return resolveSourceScoped(metric.source, registry, depth, scope);
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
  depth = 0
): ProvenanceSurvey[] {
  return resolveSourceScoped(source, registry, depth, 'all');
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
  depth = 0
): ProvenanceSurvey[] {
  return resolveMetricScoped(metric, registry, depth, 'all');
}

/**
 * metric の主出典 (調査のページへ並べる調査) を解決する。割り算の指標は分子の原典だけを返し、
 * 分母の人口・面積の調査を数えない。出典の表記には全原典 (`resolveMetricProvenance`) を使う。
 *
 * @param registry calculated metric の分子を辿るために必要 (任意)
 */
export function resolveMetricPrimaryProvenance(
  metric: MetricConfig,
  registry?: MetricRegistry
): ProvenanceSurvey[] {
  return resolveMetricScoped(metric, registry, 0, 'primary');
}

/**
 * e-Stat param から出典表記 (2 階層) を解決する。ranking / テーマが共有する統一入口。
 *   - SSDS テーブル → compilation=社会・人口統計体系 + originalSurveys(cdCat01 から、複数可)
 *   - 一次統計       → compilation=null + originalSurveys=[その調査]
 */
export function resolveAttribution(
  statsDataId: string | undefined,
  cdCat01: string | undefined
): SourceAttribution {
  return {
    compilation: isSsdsStatsDataId(statsDataId)
      ? { ...SSDS_COMPILATION }
      : null,
    originalSurveys: resolveProvenanceByParams(statsDataId, cdCat01),
  };
}

/** 値が県庁所在市の値である調査 (家計調査の品目別と、社会・人口統計体系経由の家計調査)。 */
const CAPITAL_CITY_VALUE_SURVEY_IDS: ReadonlySet<string> = new Set(['kakei-chousa', 'household-survey']);

/**
 * metric の値が「県全体」ではなく「県庁所在市」の値か。家計調査は県庁所在市の値を県のコードへ写して配信するので、
 * 地域名を市で書く面 (調査ハブの代表ランキングの 1 位など) はこの判定を使う。
 */
export function isCapitalCityValueMetric(metric: MetricConfig, registry?: MetricRegistry): boolean {
  return resolveMetricProvenance(metric, registry).some((survey) => CAPITAL_CITY_VALUE_SURVEY_IDS.has(survey.id));
}

/** ランキングの問い (hook) の地域の呼び方。県庁所在市の値の指標は「都市」、それ以外は「県」。 */
export function rankingHookAreaNoun(metric: MetricConfig, registry?: MetricRegistry): RankingHookAreaNoun {
  return isCapitalCityValueMetric(metric, registry) ? '都市' : '県';
}
