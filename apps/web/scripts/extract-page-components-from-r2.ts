/**
 * 【一回限り】現行 cloud R2 の page_components / ranking page-cards を reverse-extract し、
 * git TS SSOT (apps/web/scripts/data/page-components/) に verbatim 保存する。
 *
 * 完全DBレス (doc19) Phase E: 永続 D1 が消えて cloud R2 が唯一コピーになった page_components を
 * git に取り込み、以後 git を SSOT にする。R2 list 不可のため key は git TS から列挙し公開URLで probe。
 * 配信 JSON を文字列のまま保存するため、generator が書き戻せば byte 完全一致する。
 *
 * 使用方法:
 *   R2_PUBLIC_FETCH_URL=https://storage.stats47.jp npx tsx apps/web/scripts/extract-page-components-from-r2.ts
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { CATEGORIES } from "../../../packages/data-configs/src/categories";
import { THEME_INDICATOR_SETS } from "../../../packages/types/src/indicator-sets/registry";
import { KNOWN_RANKING_KEYS } from "../../../packages/ranking/src/config/known-ranking-keys";

const PUBLIC_URL = process.env.R2_PUBLIC_FETCH_URL ?? "https://storage.stats47.jp";
const DATA_ROOT = resolve(__dirname, "data/page-components");
const CONCURRENCY = 32;

interface Candidate {
  localDir: string; // git 保存先サブディレクトリ
  key: string; // pageKey / rankingKey
  url: string; // cloud R2 公開URL
}

function pageComponentsUrl(pageType: string, pageKey: string): string {
  return `${PUBLIC_URL}/app/page-components/${pageType}/${encodeURIComponent(pageKey)}.json`;
}
function rankingPageCardsUrl(rankingKey: string): string {
  return `${PUBLIC_URL}/app/ranking/${encodeURIComponent(rankingKey)}/page-cards.json`;
}

function buildCandidates(): Candidate[] {
  const out: Candidate[] = [];

  // area: 01000..47000
  for (let n = 1; n <= 47; n++) {
    const code = `${String(n).padStart(2, "0")}000`;
    out.push({ localDir: "area", key: code, url: pageComponentsUrl("area", code) });
  }

  const categoryKeys = CATEGORIES.map((c) => c.categoryKey);
  for (const key of categoryKeys) {
    out.push({ localDir: "area-category", key, url: pageComponentsUrl("area-category", key) });
    out.push({ localDir: "city-category", key, url: pageComponentsUrl("city-category", key) });
  }

  const themeKeys = THEME_INDICATOR_SETS.map((s) => s.key);
  for (const key of themeKeys) {
    out.push({ localDir: "theme", key, url: pageComponentsUrl("theme", key) });
  }

  for (const key of KNOWN_RANKING_KEYS) {
    out.push({ localDir: "ranking-page-cards", key, url: rankingPageCardsUrl(key) });
  }

  return out;
}

async function main() {
  const candidates = buildCandidates();
  console.log(`probe 対象: ${candidates.length} 件 (公開URL: ${PUBLIC_URL})`);

  const found: Record<string, number> = {};
  const missing: Record<string, number> = {};

  for (let i = 0; i < candidates.length; i += CONCURRENCY) {
    const batch = candidates.slice(i, i + CONCURRENCY);
    await Promise.all(
      batch.map(async (c) => {
        let res: Response;
        try {
          res = await fetch(c.url);
        } catch {
          missing[c.localDir] = (missing[c.localDir] ?? 0) + 1;
          return;
        }
        if (res.status === 404) {
          missing[c.localDir] = (missing[c.localDir] ?? 0) + 1;
          return;
        }
        if (!res.ok) {
          console.error(`  ⚠️ HTTP ${res.status} ${c.url}`);
          missing[c.localDir] = (missing[c.localDir] ?? 0) + 1;
          return;
        }
        const body = await res.text(); // verbatim 保存 (byte 一致保証)
        const dir = resolve(DATA_ROOT, c.localDir);
        mkdirSync(dir, { recursive: true });
        writeFileSync(resolve(dir, `${c.key}.json`), body);
        found[c.localDir] = (found[c.localDir] ?? 0) + 1;
      }),
    );
  }

  console.log("\n=== 抽出結果 (pageType: found / probed) ===");
  const dirs = ["area", "area-category", "city-category", "theme", "ranking-page-cards"];
  let total = 0;
  for (const d of dirs) {
    const f = found[d] ?? 0;
    total += f;
    console.log(`  ${d}: ${f} 件保存 (404 ${missing[d] ?? 0})`);
  }
  console.log(`合計: ${total} ファイル → ${DATA_ROOT}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
