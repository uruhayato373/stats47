/**
 * 全 metric の原典解決カバレッジ報告。resolveMetricProvenance を registry 全件に当てる。
 *
 * 実行: cd packages/data-configs && npx tsx scripts/ssds/report-metric-provenance-coverage.ts
 */

import { METRICS_REGISTRY } from "../../src/registry";
import { resolveMetricProvenance } from "../../src/provenance/resolve-metric-provenance";

function main(): void {
  const metrics = Object.values(METRICS_REGISTRY);
  const byKind: Record<string, { total: number; resolved: number }> = {};
  const unresolvedSamples: string[] = [];

  for (const m of metrics) {
    const kind = m.source?.kind ?? "unknown";
    byKind[kind] ??= { total: 0, resolved: 0 };
    byKind[kind].total++;
    const surveys = resolveMetricProvenance(m, METRICS_REGISTRY);
    if (surveys.length > 0) byKind[kind].resolved++;
    else if (unresolvedSamples.length < 25)
      unresolvedSamples.push(`${m.key} (${kind}/${m.source && "displayName" in m.source ? m.source.displayName ?? "—" : "—"})`);
  }

  const total = metrics.length;
  const resolved = Object.values(byKind).reduce((a, b) => a + b.resolved, 0);
  console.log(`全 metric: ${total}`);
  console.log(`原典解決: ${resolved} (${((resolved / total) * 100).toFixed(1)}%)`);
  console.log("\n--- kind 別 ---");
  for (const [kind, v] of Object.entries(byKind)) {
    console.log(`  ${kind.padEnd(14)} ${v.resolved}/${v.total} (${((v.resolved / v.total) * 100).toFixed(1)}%)`);
  }
  if (unresolvedSamples.length) {
    console.log(`\n--- 未解決サンプル (${unresolvedSamples.length}) ---`);
    for (const s of unresolvedSamples) console.log(`  ${s}`);
  }
}

main();
