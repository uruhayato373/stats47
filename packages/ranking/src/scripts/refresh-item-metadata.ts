#!/usr/bin/env tsx
/**
 * config → item.json の表示メタ (title/subtitle/note→annotation/category) refresh を実行する CLI。
 *
 * git TS config の編集を R2 `app/ranking/<key>/item.json` に反映する。
 * ★ sync-snapshots では **master の前**に実行する (category 再グループ化に反映するため)。
 * 既定は dry-run (差分集計のみ)。`--apply` で R2 へ書き込む (CI 専用ガードあり)。
 *
 * Usage:
 *   R2_PUBLIC_FETCH_URL=https://storage.stats47.jp NODE_OPTIONS='--conditions react-server' \
 *     npx tsx packages/ranking/src/scripts/refresh-item-metadata.ts --only port-entry-vessel-count
 *   npx tsx packages/ranking/src/scripts/refresh-item-metadata.ts --apply   # CI で全件適用
 */
import { refreshRankingItemMetadata } from "../exporters/ranking-item-metadata-refresh";

function parseArgs(argv: string[]): { apply: boolean; only?: string[] } {
  const apply = argv.includes("--apply");
  const onlyIdx = argv.indexOf("--only");
  const only =
    onlyIdx >= 0 && argv[onlyIdx + 1]
      ? argv[onlyIdx + 1].split(",").map((s) => s.trim()).filter(Boolean)
      : undefined;
  return { apply, only };
}

async function main() {
  const { apply, only } = parseArgs(process.argv.slice(2));
  console.log(
    `item.json metadata refresh: mode=${apply ? "APPLY" : "dry-run"}${only ? ` only=${only.join(",")}` : ""}`,
  );

  const result = await refreshRankingItemMetadata({ dryRun: !apply, only });

  console.log(
    `scanned=${result.scanned} patched=${result.patched} unchanged=${result.unchanged} missing=${result.missing} (${result.durationMs}ms)`,
  );
  if (result.changedKeys.length > 0) {
    console.log(
      `changed (${result.changedKeys.length}): ${result.changedKeys.slice(0, 20).join(", ")}${result.changedKeys.length > 20 ? " …" : ""}`,
    );
  }
  if (!apply && result.patched > 0) {
    console.log("dry-run のため未書き込み。反映するには --apply (CI) で実行。");
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
