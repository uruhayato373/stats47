#!/usr/bin/env tsx
/** 使い捨て: databook snapshot のデータ生成を検証する (R2 push しない・公開URL read のみ)。 */
import { buildAreaDatabookSnapshots } from "../exporters/area-databook-snapshot";

async function main() {
  const { snapshots, metricsResolved, metricsMissing } =
    await buildAreaDatabookSnapshots();
  console.log("県数:", snapshots.length);
  console.log("metricsResolved:", metricsResolved);
  console.log("metricsMissing:", metricsMissing.length, metricsMissing.slice(0, 30));
  const withMetrics = snapshots.filter((s) => Object.keys(s.metrics).length > 0).length;
  console.log("metrics>0 の県数:", withMetrics);
  const sample = snapshots.find((s) => s.areaCode === "25000");
  console.log("滋賀(25000) metrics数:", sample ? Object.keys(sample.metrics).length : "なし");
  console.log(
    "滋賀 sample(3件):",
    JSON.stringify(Object.entries(sample?.metrics ?? {}).slice(0, 3), null, 2),
  );
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
