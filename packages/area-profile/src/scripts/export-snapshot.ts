#!/usr/bin/env tsx
/**
 * 県データブック (databook.json) の R2 snapshot を書き出す。
 * 県の profile.json は読み手 0 のため生成を廃止した (AREA-PROFILE-JSON-RETIRE-01)。
 *
 * Usage:
 *   npx tsx -r ./packages/ranking/src/scripts/setup-cli.js \
 *     packages/area-profile/src/scripts/export-snapshot.ts
 */

import { exportAreaDatabookSnapshot } from "../exporters/area-databook-snapshot";

async function main() {
  console.log("area-databook snapshot を R2 に書き出します…");
  const databook = await exportAreaDatabookSnapshot();
  console.log(
    `✅ area-databook: files=${databook.files} metricsResolved=${databook.metricsResolved} missing=${databook.metricsMissing.length} bytes=${databook.totalSizeBytes} duration=${databook.durationMs}ms`,
  );
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
