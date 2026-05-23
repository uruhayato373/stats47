#!/usr/bin/env tsx
/**
 * city area_profiles の R2 snapshot を書き出す。
 *
 * Usage:
 *   npx tsx -r ./packages/ranking/src/scripts/setup-cli.js \
 *     packages/area-profile/src/scripts/export-city-snapshot.ts
 */

import { exportCityProfileSnapshot } from "../exporters/city-profile-snapshot";

async function main() {
  console.log("city profile snapshot を R2 に書き出します…");
  const result = await exportCityProfileSnapshot();
  console.log(
    `✅ city profile: files=${result.files} rows=${result.rowCount} bytes=${result.totalSizeBytes} duration=${result.durationMs}ms`,
  );
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
