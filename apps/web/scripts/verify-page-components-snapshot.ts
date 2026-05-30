/**
 * page_components / ranking page-cards の git TS SSOT が現行 cloud R2 配信と byte 一致するか検証する。
 *
 * 完全DBレス (doc19) Phase E verify。data/page-components/ 配下の各 git JSON を、対応する
 * 配信 R2 key (公開URL) と文字列比較する。1 件でも不一致なら exit 1。
 *
 * 使用方法:
 *   npx tsx apps/web/scripts/verify-page-components-snapshot.ts
 */

import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const PUBLIC_URL = process.env.R2_PUBLIC_FETCH_URL ?? "https://storage.stats47.jp";
const DATA_ROOT = resolve(__dirname, "data/page-components");
const CONCURRENCY = 24;

const PAGE_TYPES = ["area", "area-category", "city-category", "theme"] as const;

interface Check {
  label: string;
  url: string;
  local: string; // git 保存内容
}

function buildChecks(): Check[] {
  const checks: Check[] = [];
  for (const pageType of PAGE_TYPES) {
    const dir = resolve(DATA_ROOT, pageType);
    let files: string[];
    try {
      files = readdirSync(dir).filter((f) => f.endsWith(".json"));
    } catch {
      continue;
    }
    for (const file of files) {
      const key = file.replace(/\.json$/, "");
      checks.push({
        label: `page-components/${pageType}/${key}`,
        url: `${PUBLIC_URL}/app/page-components/${pageType}/${encodeURIComponent(key)}.json`,
        local: readFileSync(resolve(dir, file), "utf8"),
      });
    }
  }
  const rpcDir = resolve(DATA_ROOT, "ranking-page-cards");
  let rpcFiles: string[];
  try {
    rpcFiles = readdirSync(rpcDir).filter((f) => f.endsWith(".json"));
  } catch {
    rpcFiles = [];
  }
  for (const file of rpcFiles) {
    const key = file.replace(/\.json$/, "");
    checks.push({
      label: `ranking-page-cards/${key}`,
      url: `${PUBLIC_URL}/app/ranking/${encodeURIComponent(key)}/page-cards.json`,
      local: readFileSync(resolve(rpcDir, file), "utf8"),
    });
  }
  return checks;
}

async function main() {
  const checks = buildChecks();
  console.log(`検証対象: ${checks.length} 件 (公開URL: ${PUBLIC_URL})`);

  const mismatches: string[] = [];
  let ok = 0;

  for (let i = 0; i < checks.length; i += CONCURRENCY) {
    const batch = checks.slice(i, i + CONCURRENCY);
    await Promise.all(
      batch.map(async (c) => {
        let res: Response;
        try {
          res = await fetch(c.url);
        } catch (e) {
          mismatches.push(`${c.label}: fetch error ${String(e)}`);
          return;
        }
        if (!res.ok) {
          mismatches.push(`${c.label}: cloud HTTP ${res.status}`);
          return;
        }
        const cloud = await res.text();
        // JSON として正規化比較 (空白差を吸収しつつ semantic 一致を確認)
        const normLocal = JSON.stringify(JSON.parse(c.local));
        const normCloud = JSON.stringify(JSON.parse(cloud));
        if (normLocal === normCloud) {
          ok++;
        } else {
          mismatches.push(`${c.label}: 内容不一致 (local ${normLocal.length}b / cloud ${normCloud.length}b)`);
        }
      }),
    );
  }

  console.log(`✅ 一致: ${ok} / ${checks.length}`);
  if (mismatches.length > 0) {
    console.error(`❌ 不一致 ${mismatches.length} 件:`);
    for (const m of mismatches.slice(0, 20)) console.error(`  ${m}`);
    process.exit(1);
  }
  console.log(`✅ page-components 全 ${ok} 件が cloud 配信と一致。git TS SSOT 化 OK`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
