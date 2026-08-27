/**
 * Recipe 導入前の公開 stats payload に、行を変えず config recipe を追加する一回限りの移行。
 *
 * 既定は検査だけ。`--apply` でも `.local/r2` に staging するだけで remote R2 へは書かない。
 * remote 反映は対象 key ごとの diff-push と公開整合監査を別承認で実行する。
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { getMetricConfig } from "@stats47/data-configs";
import { ProxyAgent, setGlobalDispatcher } from "undici";

import {
  LEGACY_RECIPE_ROW_HASHES,
  migrateLegacyRecipe,
} from "./lib/legacy-recipe-migration";

const REPO_ROOT = resolve(__dirname, "..", "..", "..", "..");
const R2_BASE = (process.env.R2_PUBLIC_FETCH_URL ?? "https://storage.stats47.jp").replace(
  /\/+$/,
  "",
);

function configureProxy(): void {
  const proxy = process.env.HTTPS_PROXY ?? process.env.HTTP_PROXY;
  if (proxy) setGlobalDispatcher(new ProxyAgent(proxy));
}

async function fetchPayload(key: string): Promise<unknown> {
  const url = `${R2_BASE}/app/stats/${key}/values.json`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${key}: fetch failed (HTTP ${response.status})`);
  return await response.json();
}

async function main(): Promise<void> {
  configureProxy();
  const apply = process.argv.includes("--apply");
  const keys = Object.keys(LEGACY_RECIPE_ROW_HASHES).sort();
  const fetched = await Promise.all(keys.map(async (key) => [key, await fetchPayload(key)] as const));

  let migrated = 0;
  let current = 0;
  for (const [key, rawPayload] of fetched) {
    const config = getMetricConfig(key);
    if (!config) throw new Error(`${key}: metric config is missing`);
    const expectedRowsHash = LEGACY_RECIPE_ROW_HASHES[key as keyof typeof LEGACY_RECIPE_ROW_HASHES];
    const result = migrateLegacyRecipe(rawPayload, config, expectedRowsHash);
    if (result.status === "current") {
      current++;
      continue;
    }

    migrated++;
    if (!apply) continue;
    const outputPath = resolve(REPO_ROOT, ".local", "r2", "app", "stats", key, "values.json");
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, `${JSON.stringify(result.payload, null, 2)}\n`, "utf8");
  }

  console.log(
    `[legacy-recipe] checked=${keys.length} migrated=${migrated} current=${current} mode=${apply ? "stage" : "check"}`,
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
