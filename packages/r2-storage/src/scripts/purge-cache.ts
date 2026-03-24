/**
 * Cloudflare CDN キャッシュパージ
 *
 * R2 カスタムドメイン (storage.stats47.jp) のキャッシュを削除する。
 *
 * Usage:
 *   npx tsx packages/r2-storage/src/scripts/purge-cache.ts                     # 全キャッシュパージ
 *   npx tsx packages/r2-storage/src/scripts/purge-cache.ts --prefix ranking    # ranking/* のみパージ
 *   npx tsx packages/r2-storage/src/scripts/purge-cache.ts --files key1 key2   # 特定ファイルのみパージ
 */

import { config } from "dotenv";
import path from "path";

config({ path: path.resolve(__dirname, "..", "..", "..", "..", ".env.local") });

const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;
// キャッシュパージは Cloudflare CDN 経由のカスタムドメインに対して行う
// r2.dev URL は CDN を経由しないためパージ不要
const R2_PUBLIC_URL = "https://storage.stats47.jp";

if (!CLOUDFLARE_API_TOKEN || !CLOUDFLARE_ZONE_ID) {
  console.error(
    "❌ CLOUDFLARE_API_TOKEN and CLOUDFLARE_ZONE_ID must be set in .env.local"
  );
  process.exit(1);
}

/**
 * Cloudflare Cache Purge API を呼び出す
 */
async function purgeByUrls(urls: string[]): Promise<void> {
  // Cloudflare API は 1 リクエストあたり最大 30 URL
  const BATCH_SIZE = 30;

  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    const batch = urls.slice(i, i + BATCH_SIZE);
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/purge_cache`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ files: batch }),
      }
    );

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Purge failed (${res.status}): ${body}`);
    }

    const data = (await res.json()) as { success: boolean };
    if (!data.success) {
      throw new Error(`Purge API returned success=false`);
    }

    console.log(
      `  ✅ Purged ${batch.length} URLs (${i + 1}-${i + batch.length})`
    );
  }
}

async function purgeEverything(): Promise<void> {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/purge_cache`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ purge_everything: true }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Purge failed (${res.status}): ${body}`);
  }

  const data = (await res.json()) as { success: boolean };
  if (!data.success) {
    throw new Error(`Purge API returned success=false`);
  }
}

/**
 * プレフィックスに一致する R2 ファイルを列挙し、URL リストを返す
 */
async function collectUrlsByPrefix(prefix: string): Promise<string[]> {
  const { listFromR2WithSize } = await import("../lib");
  const files = await listFromR2WithSize(prefix);
  return files.map((f) => `${R2_PUBLIC_URL}/${f.key}`);
}

/**
 * キャッシュパージのメインエクスポート（他スクリプトから呼べる）
 */
export async function purgeCacheForKeys(r2Keys: string[]): Promise<void> {
  if (r2Keys.length === 0) return;
  const urls = r2Keys.map((key) => `${R2_PUBLIC_URL}/${key}`);
  console.log(`🔄 Purging CDN cache for ${urls.length} files...`);
  await purgeByUrls(urls);
  console.log(`✅ Cache purge complete`);
}

export async function purgeCacheAll(): Promise<void> {
  console.log(`🔄 Purging ALL CDN cache for ${R2_PUBLIC_URL}...`);
  await purgeEverything();
  console.log(`✅ Full cache purge complete`);
}

async function main() {
  const args = process.argv.slice(2);
  const prefixIdx = args.indexOf("--prefix");
  const filesIdx = args.indexOf("--files");

  if (filesIdx !== -1) {
    // 特定ファイルのパージ
    const keys = args.slice(filesIdx + 1);
    if (keys.length === 0) {
      console.error("--files requires at least one R2 key");
      process.exit(1);
    }
    await purgeCacheForKeys(keys);
  } else if (prefixIdx !== -1) {
    // プレフィックス指定パージ
    const prefix = args[prefixIdx + 1];
    if (!prefix) {
      console.error("--prefix requires a value");
      process.exit(1);
    }
    console.log(`🔍 Listing R2 files with prefix: ${prefix}`);
    const urls = await collectUrlsByPrefix(prefix);
    console.log(`   Found ${urls.length} files`);

    if (urls.length > 500) {
      // 大量の場合は全キャッシュパージの方が効率的
      console.log(`   ${urls.length} files > 500, using purge_everything instead`);
      await purgeCacheAll();
    } else {
      await purgeByUrls(urls);
      console.log(`✅ Cache purge complete`);
    }
  } else {
    // 全キャッシュパージ
    await purgeCacheAll();
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
