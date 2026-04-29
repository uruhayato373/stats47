#!/usr/bin/env tsx
/**
 * area_profile_rankings の R2 snapshot を書き出す。
 *
 * Usage:
 *   npx tsx -r ./packages/ranking/src/scripts/setup-cli.js \
 *     packages/area-profile/src/scripts/export-snapshot.ts
 */

import { exportAreaProfileSnapshot } from "../exporters/area-profile-snapshot";

async function main() {
  console.log("area-profile snapshot を R2 に書き出します…");
  const result = await exportAreaProfileSnapshot();
  console.log(
    `✅ area-profile: areas=${result.areaCount} rows=${result.rowCount} bytes=${result.sizeBytes} duration=${result.durationMs}ms key=${result.key}`,
  );
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
