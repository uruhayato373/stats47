/**
 * ranking page cards を git TS SSOT から R2 snapshot 化する (完全DBレス → docs/01_技術設計/12_完全DBレス設計.md)。
 *
 * SSOT は `apps/web/scripts/data/page-components/ranking-page-cards/<rankingKey>.json`
 * (git tracked、cloud R2 から reverse-extract)。永続 D1 は読まない。verbatim 書き戻しで配信 byte 一致。
 * 配信先は app/ranking/<rankingKey>/page-cards.json (rankingPageCardsKeyPath)。
 *
 * Usage:
 *   npx tsx -r ./packages/ranking/src/scripts/setup-cli.js \
 *     apps/web/scripts/export-ranking-page-cards-snapshot.ts
 */

import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import dotenv from "dotenv";

import { saveToR2 } from "@stats47/r2-storage/server";

import { rankingPageCardsKeyPath } from "../src/features/ranking/components/RankingPageCards/snapshot-reader";

dotenv.config({ path: ".env.local" });

const DATA_DIR = resolve(__dirname, "data/page-components/ranking-page-cards");
const CONCURRENCY = 16;

async function main() {
  let files_list: string[];
  try {
    files_list = readdirSync(DATA_DIR).filter((f) => f.endsWith(".json"));
  } catch {
    files_list = [];
  }

  const entries = files_list.map((file) => ({
    rankingKey: file.replace(/\.json$/, ""),
    body: readFileSync(resolve(DATA_DIR, file), "utf8"),
  }));

  let files = 0;
  for (let i = 0; i < entries.length; i += CONCURRENCY) {
    const batch = entries.slice(i, i + CONCURRENCY);
    await Promise.all(
      batch.map(async ({ rankingKey, body }) => {
        await saveToR2(rankingPageCardsKeyPath(rankingKey), body, {
          contentType: "application/json; charset=utf-8",
        });
        files++;
      }),
    );
  }

  console.log(`✅ ranking-page-cards: files=${files} (git TS SSOT, DBレス)`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
