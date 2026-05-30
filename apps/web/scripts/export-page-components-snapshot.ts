/**
 * page_components を git TS SSOT から R2 snapshot 化する (完全DBレス → docs/01_技術設計/19_完全DBレス設計.md)。
 *
 * SSOT は `apps/web/scripts/data/page-components/{area,area-category,city-category,theme}/<key>.json`
 * (git tracked、cloud R2 から reverse-extract。以後は git が SSOT)。永続 D1 は読まない。
 * 保存内容を verbatim で書き戻すため、配信 byte と完全一致する。
 * ranking page-cards は別 namespace のため export-ranking-page-cards-snapshot.ts が担当。
 *
 * 使用方法:
 *   npx tsx -r ./packages/ranking/src/scripts/setup-cli.js \
 *     apps/web/scripts/export-page-components-snapshot.ts
 */

import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import dotenv from "dotenv";

import { saveToR2 } from "@stats47/r2-storage/server";

import { pageComponentsKeyPath } from "../src/features/stat-charts/services/page-components-snapshot";

dotenv.config({ path: ".env.local" });

const DATA_ROOT = resolve(__dirname, "data/page-components");
// localDir = pageType (ranking-page-cards は別 exporter)
const PAGE_TYPES = ["area", "area-category", "city-category", "theme"] as const;
const CONCURRENCY = 16;

interface Entry {
  pageType: string;
  pageKey: string;
  body: string;
}

function collectEntries(): Entry[] {
  const entries: Entry[] = [];
  for (const pageType of PAGE_TYPES) {
    const dir = resolve(DATA_ROOT, pageType);
    let files: string[];
    try {
      files = readdirSync(dir).filter((f) => f.endsWith(".json"));
    } catch {
      continue;
    }
    for (const file of files) {
      const pageKey = file.replace(/\.json$/, "");
      const body = readFileSync(resolve(dir, file), "utf8");
      entries.push({ pageType, pageKey, body });
    }
  }
  return entries;
}

async function main() {
  const entries = collectEntries();
  let files = 0;

  for (let i = 0; i < entries.length; i += CONCURRENCY) {
    const batch = entries.slice(i, i + CONCURRENCY);
    await Promise.all(
      batch.map(async ({ pageType, pageKey, body }) => {
        await saveToR2(pageComponentsKeyPath(pageType, pageKey), body, {
          contentType: "application/json; charset=utf-8",
        });
        files++;
      }),
    );
  }

  console.log(`✅ page-components: files=${files} (git TS SSOT, DBレス)`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
