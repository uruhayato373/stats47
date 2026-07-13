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
 *   npx tsx packages/ranking/src/scripts/audit-survey-linkage.ts --compare-r2 [--sample N]
 *     # R2 焼き込み突合 (2026-07-14 追加): active metric の live item.json surveyIds を
 *     # git 導出と item 単位で比較し、焼き込み drift (stale/欠落/不一致) を実測する。
 *     # あわせて R2 app/survey/all.json の調査集合を git 導出 (active) と突合する。
 *     # ネットワーク必須 (公開 URL GET のみ)。--sample N は等間隔サンプリング (既定は全件)。
 *
 * 集計は active (isActive !== false) / total を区別する (2026-07-14):
 *   - perSurvey       = git 導出の総数 (inactive 含む — 「登録済み在庫」)
 *   - perSurveyActive = git 導出 × active (= 配信されるべき数。R2 all.json の itemCount と対応)
 *   区別が無いと「未公開 (inactive-only)」を「R2 snapshot の stale」と誤診する
 *   (実例: population-projection 2026-07-14)。
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

const R2_BASE = process.env.R2_PUBLIC_FETCH_URL || "https://storage.stats47.jp";

function isActiveConfig(m: MetricConfig): boolean {
  return m.isActive !== false;
}

async function mapPool<T, R>(items: T[], limit: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (i < items.length) {
        const idx = i++;
        out[idx] = await fn(items[idx]);
      }
    }),
  );
  return out;
}

/** R2 焼き込み突合: live item.json の surveyIds を git 導出と item 単位で比較する。 */
async function compareR2(
  activeMetrics: MetricConfig[],
  registry: MetricRegistry,
  perSurveyActive: Map<string, number>,
  sample?: number,
) {
  let targets = [...activeMetrics].sort((a, b) => a.key.localeCompare(b.key));
  if (sample && sample < targets.length) {
    const step = targets.length / sample;
    targets = Array.from({ length: sample }, (_, i) => targets[Math.floor(i * step)]);
  }
  const missingItemJson: string[] = [];
  const mismatches: Array<{ key: string; git: string[]; live: string[] }> = [];
  let matched = 0;
  await mapPool(targets, 16, async (m) => {
    try {
      const res = await fetch(`${R2_BASE}/app/ranking/${m.key}/item.json`);
      if (res.status === 404) {
        missingItemJson.push(m.key);
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = (await res.json()) as { item?: { surveyIds?: string[] } };
      const live = [...(body.item?.surveyIds ?? [])].sort();
      const git = [...resolveSurveyLinkage(m, registry).surveyIds].sort();
      if (JSON.stringify(live) === JSON.stringify(git)) matched++;
      else mismatches.push({ key: m.key, git, live });
    } catch {
      missingItemJson.push(`${m.key} (fetch失敗)`);
    }
  });

  // 調査集合レベル: R2 all.json vs git 導出 (active)
  let liveSurveyIds: Set<string> | null = null;
  try {
    const res = await fetch(`${R2_BASE}/app/survey/all.json`);
    if (res.ok) {
      const body = (await res.json()) as { surveys: Array<{ id: string }> };
      liveSurveyIds = new Set(body.surveys.map((s) => s.id));
    }
  } catch {
    /* all.json 取得不可は下で null 報告 */
  }
  const expectedActive = [...perSurveyActive.entries()].filter(([, n]) => n > 0).map(([id]) => id);
  const surveysMissingInR2 = liveSurveyIds
    ? expectedActive.filter((id) => !liveSurveyIds!.has(id)).sort()
    : null;
  const surveysExtraInR2 = liveSurveyIds
    ? [...liveSurveyIds].filter((id) => !expectedActive.includes(id)).sort()
    : null;

  return {
    checked: targets.length,
    matched,
    mismatches: mismatches.sort((a, b) => a.key.localeCompare(b.key)),
    missingItemJson: missingItemJson.sort(),
    surveysMissingInR2, // active item があるのに R2 all.json に無い = 真の drift (要 sync)
    surveysExtraInR2, //   R2 にあるが git 導出 (active) に無い = stale (要 sync)
  };
}

async function main() {
  const args = process.argv.slice(2);
  const asJson = args.includes("--json");
  const listUnresolved = args.includes("--unresolved");
  const doCompareR2 = args.includes("--compare-r2");
  const sampleIdx = args.indexOf("--sample");
  const sample = sampleIdx >= 0 ? Number(args[sampleIdx + 1]) : undefined;

  const all = listAllMetrics();
  const registry: MetricRegistry = Object.fromEntries(all.map((m) => [m.key, m]));
  const metrics = all.filter((c) => c.entities?.includes("prefecture"));
  const masterIds = new Set((surveysMaster as Array<{ id: string }>).map((s) => s.id));

  const perSurvey = new Map<string, number>();
  const perSurveyActive = new Map<string, number>();
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
      for (const id of surveyIds) {
        perSurvey.set(id, (perSurvey.get(id) ?? 0) + 1);
        if (isActiveConfig(m)) perSurveyActive.set(id, (perSurveyActive.get(id) ?? 0) + 1);
      }
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

  const activeMetrics = metrics.filter(isActiveConfig);
  const report = {
    generatedAt: new Date().toISOString(),
    totals: {
      metrics: metrics.length,
      activeMetrics: activeMetrics.length,
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
    // active のみの件数 (= 配信されるべき数。R2 all.json itemCount と対応)
    perSurveyActive: Object.fromEntries([...perSurveyActive.entries()].sort((a, b) => b[1] - a[1])),
    compareR2: undefined as Awaited<ReturnType<typeof compareR2>> | undefined,
  };

  if (doCompareR2) {
    report.compareR2 = await compareR2(activeMetrics, registry, perSurveyActive, sample);
  }

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
  if (report.compareR2) {
    const c = report.compareR2;
    console.log(`\n## R2 焼き込み突合 (--compare-r2: active ${c.checked} 件)`);
    console.log(`  一致 ${c.matched} / 不一致 ${c.mismatches.length} / item.json 欠落 ${c.missingItemJson.length}`);
    for (const mm of c.mismatches.slice(0, 20)) {
      console.log(`  ✗ ${mm.key}: git=[${mm.git.join(",")}] live=[${mm.live.join(",")}]`);
    }
    if (c.mismatches.length > 20) console.log(`  … 他 ${c.mismatches.length - 20} 件 (--json で全件)`);
    if (c.missingItemJson.length > 0)
      console.log(`  item.json 欠落: ${c.missingItemJson.slice(0, 10).join(", ")}${c.missingItemJson.length > 10 ? " …" : ""}`);
    if (c.surveysMissingInR2 === null) {
      console.log(`  ⚠ all.json 取得不可 (調査集合の突合 skip)`);
    } else {
      if (c.surveysMissingInR2.length > 0)
        console.log(`  ⚠ active item があるのに R2 all.json に無い調査 (要 sync): ${c.surveysMissingInR2.join(", ")}`);
      if ((c.surveysExtraInR2 ?? []).length > 0)
        console.log(`  ⚠ R2 にあるが git 導出 (active) に無い調査 (stale): ${c.surveysExtraInR2!.join(", ")}`);
      if (c.surveysMissingInR2.length === 0 && (c.surveysExtraInR2 ?? []).length === 0)
        console.log(`  ✓ 調査集合は git 導出 (active) と一致`);
    }
  }
}

main();
