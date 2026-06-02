/**
 * 現行 survey バケット (app/survey/{id}/items.json) のドリフトを SSDS / 非SSDS に分けて実測する。
 *
 * 真のドリフトは SSDS 由来 (displayName=社会・人口統計体系) に集中する。SSDS は二次統計のため
 * baked surveyId が原典を表せず誤分類されやすい。非SSDS estat / kakei は baked surveyId が
 * 一次統計から正しく付与されている前提なので、ここでは「resolver と一致するか」を健全性確認として測る。
 *
 * R2 公開 URL から読むだけ (書き込みなし)。
 * 実行: cd packages/data-configs && npx tsx scripts/ssds/report-survey-bucket-drift.ts
 */

import { METRICS_REGISTRY } from "../../src/registry";
import { resolveMetricProvenance } from "../../src/provenance/resolve-metric-provenance";

const BASE = process.env.R2_PUBLIC_FETCH_URL ?? "https://storage.stats47.jp";
const SSDS = "社会・人口統計体系";

async function getJson<T>(path: string): Promise<T | null> {
  const res = await fetch(`${BASE}/${path}`);
  if (!res.ok) return null;
  return (await res.json()) as T;
}

function isSsds(metric: (typeof METRICS_REGISTRY)[string]): boolean {
  const s = metric.source;
  return s.kind === "estat" && (s.displayName?.startsWith(SSDS) ?? false);
}

async function main(): Promise<void> {
  const all = await getJson<{ surveys: { id: string; name: string }[] }>(
    "app/survey/all.json",
  );
  if (!all) throw new Error("all.json 取得失敗");

  const stat = {
    ssds: { total: 0, correct: 0, mis: 0, unresolved: 0 },
    other: { total: 0, agree: 0, disagree: 0, unresolved: 0 },
    noMetric: 0,
  };
  const ssdsWorst: { id: string; mis: number; total: number }[] = [];

  for (const survey of all.surveys) {
    const bucket = await getJson<{ items: { rankingKey: string }[] }>(
      `app/survey/${survey.id}/items.json`,
    );
    if (!bucket) continue;
    let bMis = 0;
    for (const it of bucket.items) {
      const metric = METRICS_REGISTRY[it.rankingKey];
      if (!metric) {
        stat.noMetric++;
        continue;
      }
      const ids = new Set(
        resolveMetricProvenance(metric, METRICS_REGISTRY).map((s) => s.id),
      );
      const grp = isSsds(metric) ? "ssds" : "other";
      stat[grp].total++;
      if (ids.size === 0) {
        stat[grp].unresolved++;
      } else if (grp === "ssds") {
        if (ids.has(survey.id)) stat.ssds.correct++;
        else {
          stat.ssds.mis++;
          bMis++;
        }
      } else {
        if (ids.has(survey.id)) stat.other.agree++;
        else stat.other.disagree++;
      }
    }
    if (bMis > 0) ssdsWorst.push({ id: survey.id, mis: bMis, total: bucket.items.length });
  }

  const p = (n: number, d: number) => (d ? ((n / d) * 100).toFixed(1) : "0.0");
  console.log("=== SSDS 由来アイテム (真のドリフト対象) ===");
  console.log(`  総数: ${stat.ssds.total}`);
  console.log(`  正バケット:   ${stat.ssds.correct} (${p(stat.ssds.correct, stat.ssds.total)}%)`);
  console.log(`  ★ミスバケット: ${stat.ssds.mis} (${p(stat.ssds.mis, stat.ssds.total)}%)`);
  console.log(`  解決不能:     ${stat.ssds.unresolved}`);
  console.log("\n=== 非SSDS (baked surveyId が正; resolver 一致率は健全性確認) ===");
  console.log(`  総数: ${stat.other.total}`);
  console.log(`  resolver 一致:   ${stat.other.agree} (${p(stat.other.agree, stat.other.total)}%)`);
  console.log(`  resolver 不一致: ${stat.other.disagree} (${p(stat.other.disagree, stat.other.total)}%)`);
  console.log(`  解決不能:       ${stat.other.unresolved}`);
  console.log(`\nregistry に無い rankingKey: ${stat.noMetric}`);
  console.log("\n--- SSDS ミスバケットの多い survey (top12) ---");
  ssdsWorst.sort((a, b) => b.mis - a.mis);
  for (const w of ssdsWorst.slice(0, 12)) {
    console.log(`  ${w.id.padEnd(30)} ${w.mis}/${w.total} が SSDS 誤分類`);
  }
}

main();
