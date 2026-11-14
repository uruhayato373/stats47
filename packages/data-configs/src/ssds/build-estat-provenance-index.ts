/**
 * e-Stat param → survey の統一テーブル (estat-provenance.generated.json) の中身を、指標の定義から計算する。
 * 書き出しは scripts/ssds/build-estat-provenance.ts、古さの検査は __tests__/estat-provenance-fresh.test.ts が、
 * どちらもこの関数を使う (生成と検査で計算が食い違わないようにする。METRIC-GATE-FOLLOWUP-01)。
 */
import { METRICS_REGISTRY } from "../registry";
import { getReferenceDataSource } from "../provenance/data-source-entry";
import { DISPLAYNAME_TO_SURVEY, STATS_DATA_ID_TO_SURVEY_OVERRIDE } from "./displayname-to-survey";

const SSDS = getReferenceDataSource("ssds").label;

export interface EstatProvenanceIndex {
  ssdsTableIds: string[];
  statsDataIdToSurvey: Record<string, { id: string; name: string }>;
}

export function buildEstatProvenance(): { index: EstatProvenanceIndex; conflicts: string[] } {
  const ssdsTableIds = new Set<string>();
  // statsDataId → (survey id → {count, name}) (consensus 用)
  const tally = new Map<string, Map<string, { count: number; name: string }>>();

  const sources = Object.values(METRICS_REGISTRY).flatMap((metric) => [
    metric.source,
    ...(metric.supplementalSources ?? []).map(({ source }) => source),
  ]);
  for (const s of sources) {
    if (s.kind !== "estat" || !s.statsDataId) continue;
    if (s.displayName?.startsWith(SSDS)) {
      ssdsTableIds.add(s.statsDataId);
      continue;
    }
    // 非SSDS: displayName → survey を集計
    const surveyId = s.displayName ? DISPLAYNAME_TO_SURVEY[s.displayName] : undefined;
    if (!surveyId || !s.displayName) continue;
    const m = tally.get(s.statsDataId) ?? new Map();
    const cur = m.get(surveyId) ?? { count: 0, name: s.displayName };
    cur.count += 1;
    m.set(surveyId, cur);
    tally.set(s.statsDataId, m);
  }

  // consensus: statsDataId ごとに最多 survey を採用。競合は警告。
  // SSDS テーブルと重複する statsDataId は runtime で SSDS 優先になるため除外 (dead entry 防止)。
  const statsDataIdToSurvey: Record<string, { id: string; name: string }> = {};
  const conflicts: string[] = [];
  for (const [sdi, m] of tally) {
    if (ssdsTableIds.has(sdi)) continue;
    const sorted = [...m.entries()].sort((a, b) => b[1].count - a[1].count);
    statsDataIdToSurvey[sdi] = { id: sorted[0][0], name: sorted[0][1].name };
    if (sorted.length > 1) {
      conflicts.push(`${sdi}: ${sorted.map(([id, v]) => `${id}(${v.count})`).join(", ")}`);
    }
  }

  // ThemeCatalog など registry 外から直接参照する一次統計を明示的に補完する。
  // SSDS テーブルへの誤上書きは provenance 層の混在になるため fail-fast。
  for (const [sdi, survey] of Object.entries(STATS_DATA_ID_TO_SURVEY_OVERRIDE)) {
    if (ssdsTableIds.has(sdi)) {
      throw new Error(`statsDataId override が SSDS テーブルと競合しています: ${sdi}`);
    }
    statsDataIdToSurvey[sdi] = survey;
  }

  return { index: { ssdsTableIds: [...ssdsTableIds].sort(), statsDataIdToSurvey }, conflicts };
}
