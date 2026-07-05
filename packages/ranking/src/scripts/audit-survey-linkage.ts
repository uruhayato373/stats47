/**
 * audit-survey-linkage — ranking ↔ 統計調査 (survey) 紐付けの決定的監査。
 *
 * 正典: `.claude/rules/survey-linkage-standards.md` / skill: `/audit-survey-linkage`
 *
 * 本番生成 (generate-ranking-items.ts) と**同じ導出コード** (`resolveSurveyLinkage`) を使い、
 * 全 prefecture metric の紐付けを集計する。監査と本番生成の乖離をゼロにするのが設計意図。
 *
 * レポート内容:
 *   - 解決済 / 未分類 (内訳: SSDS合成idのみ / 辞書未カバー statsDataId / external / calculated)
 *   - orphan survey (マスタにあるが item が 1 件も付かない) → 削除候補
 *   - config.surveyId (手動オーバーライド) の不正 (マスタ非実在)
 *   - survey 別 item 件数分布
 *
 * 使い方:
 *   npx tsx packages/ranking/src/scripts/audit-survey-linkage.ts            # 人間向けテーブル
 *   npx tsx packages/ranking/src/scripts/audit-survey-linkage.ts --json    # 機械向け JSON
 *   npx tsx packages/ranking/src/scripts/audit-survey-linkage.ts --unresolved  # 未分類の全キー列挙
 */
import {
  isSsdsStatsDataId,
  listAllMetrics,
  resolveMetricProvenance,
  type MetricConfig,
  type MetricRegistry,
} from "@stats47/data-configs";

import surveysMaster from "../data/surveys.json";
import { resolveSurveyLinkage } from "../builders/build-ranking-item-from-metric";

type UnresolvedReason =
  | "ssds-synthetic-only" // SSDS だが原典が合成 id (ssds-src:) のみ = 辞書の originalSurveys がマスタ未登録
  | "estat-uncovered" // 非SSDS estat だが statsDataIdToSurvey 辞書に無い
  | "external" // mlit/external (displayName ベース、マスタ調査ではない)
  | "calculated-unresolved" // calculated で分子/分母からも辿れない
  | "no-source"; // source なし

function unresolvedReason(config: MetricConfig, registry: MetricRegistry): UnresolvedReason {
  const s = config.source;
  if (!s) return "no-source";
  if (s.kind === "mlit" || s.kind === "external") return "external";
  if (s.kind === "calculated") return "calculated-unresolved";
  if (s.kind === "estat") {
    if (isSsdsStatsDataId(s.statsDataId)) return "ssds-synthetic-only";
    return "estat-uncovered";
  }
  return "no-source";
}

function main() {
  const args = process.argv.slice(2);
  const asJson = args.includes("--json");
  const listUnresolved = args.includes("--unresolved");

  const all = listAllMetrics();
  const registry: MetricRegistry = Object.fromEntries(all.map((m) => [m.key, m]));
  const metrics = all.filter((c) => c.entities?.includes("prefecture"));
  const masterIds = new Set((surveysMaster as Array<{ id: string }>).map((s) => s.id));

  const perSurvey = new Map<string, number>();
  const unresolved: Array<{ key: string; kind: string; reason: UnresolvedReason; statsDataId?: string }> = [];
  const badOverrides: Array<{ key: string; surveyId: string }> = [];
  let resolvedCount = 0;

  for (const m of metrics) {
    if (m.surveyId && !masterIds.has(m.surveyId)) {
      badOverrides.push({ key: m.key, surveyId: m.surveyId });
    }
    const { surveyIds } = resolveSurveyLinkage(m, registry);
    if (surveyIds.length > 0) {
      resolvedCount++;
      for (const id of surveyIds) perSurvey.set(id, (perSurvey.get(id) ?? 0) + 1);
    } else {
      const statsDataId = m.source?.kind === "estat" ? m.source.statsDataId : undefined;
      unresolved.push({
        key: m.key,
        kind: m.source?.kind ?? "?",
        reason: unresolvedReason(m, registry),
        ...(statsDataId ? { statsDataId } : {}),
      });
    }
  }

  const orphanSurveys = [...masterIds].filter((id) => !perSurvey.has(id)).sort();
  const reasonCounts = unresolved.reduce<Record<string, number>>((acc, u) => {
    acc[u.reason] = (acc[u.reason] ?? 0) + 1;
    return acc;
  }, {});
  // 辞書未カバーの statsDataId (追記すれば回収できる対象)
  const uncoveredStatsDataIds = [
    ...new Set(unresolved.filter((u) => u.reason === "estat-uncovered").map((u) => u.statsDataId!)),
  ].sort();

  const report = {
    generatedAt: new Date().toISOString(),
    totals: {
      metrics: metrics.length,
      resolved: resolvedCount,
      unresolved: unresolved.length,
      coverage: Math.round((resolvedCount / metrics.length) * 1000) / 10,
    },
    unresolvedByReason: reasonCounts,
    uncoveredStatsDataIds,
    orphanSurveys,
    badOverrides,
    surveysWithItems: perSurvey.size,
    surveyMasterCount: masterIds.size,
    perSurvey: Object.fromEntries([...perSurvey.entries()].sort((a, b) => b[1] - a[1])),
  };

  if (asJson) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log(`# survey 紐付け監査 (${report.generatedAt})`);
  console.log(
    `\n解決済 ${report.totals.resolved} / 未分類 ${report.totals.unresolved} (全 ${report.totals.metrics}、カバレッジ ${report.totals.coverage}%)`,
  );
  console.log(`\n## 未分類の内訳`);
  for (const [reason, n] of Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${reason}: ${n}`);
  }
  if (uncoveredStatsDataIds.length > 0) {
    console.log(
      `\n## 辞書未カバー statsDataId (${uncoveredStatsDataIds.length} 件 — estat-provenance に追記すれば回収可)`,
    );
    console.log(`  ${uncoveredStatsDataIds.join(", ")}`);
  }
  console.log(
    `\n## survey マスタ: ${report.surveyMasterCount} 件中 ${report.surveysWithItems} 件に item あり / orphan ${orphanSurveys.length} 件`,
  );
  if (orphanSurveys.length > 0) console.log(`  orphan (削除候補): ${orphanSurveys.join(", ")}`);
  if (badOverrides.length > 0) {
    console.log(`\n## ⚠️ config.surveyId 不正 (${badOverrides.length} 件 — マスタ非実在)`);
    for (const b of badOverrides) console.log(`  ${b.key}: "${b.surveyId}"`);
  }
  console.log(`\n## survey 別 item 件数 (上位 15)`);
  for (const [id, n] of Object.entries(report.perSurvey).slice(0, 15)) {
    console.log(`  ${String(n).padStart(5)}  ${id}`);
  }
  if (listUnresolved) {
    console.log(`\n## 未分類キー全列挙`);
    for (const u of unresolved) console.log(`  [${u.reason}] ${u.key}${u.statsDataId ? ` (${u.statsDataId})` : ""}`);
  }
}

main();
