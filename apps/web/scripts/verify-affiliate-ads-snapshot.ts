/**
 * affiliate_ads の git TS SSOT が現行 cloud R2 配信を semantic 再現できるか検証する。
 *
 * 完全DBレス移行 (doc12) の Phase E verify。git TS (affiliate-ads-data.ts) から生成した
 * ads が、現行配信 app/affiliate-ads/all.json (公開URL) と deep-equal か確認する。
 * generatedAt は実行毎に変わるため比較対象外。
 *
 * 使用方法:
 *   npx tsx apps/web/scripts/verify-affiliate-ads-snapshot.ts
 */

import { AFFILIATE_ADS } from "./affiliate-ads-data";

const PUBLIC_URL =
  process.env.R2_PUBLIC_FETCH_URL ?? "https://storage.stats47.jp";
const KEY = "app/affiliate-ads/all.json";

async function main() {
  const res = await fetch(`${PUBLIC_URL}/${KEY}`);
  if (!res.ok) {
    console.error(`❌ cloud fetch 失敗: HTTP ${res.status} ${KEY}`);
    process.exit(1);
  }
  const cloud = (await res.json()) as { ads: unknown[] };

  const generated = JSON.parse(JSON.stringify(AFFILIATE_ADS));
  const cloudAds = cloud.ads;

  const a = JSON.stringify(generated);
  const b = JSON.stringify(cloudAds);

  if (a === b) {
    console.log(`✅ affiliate-ads: git TS ${AFFILIATE_ADS.length} 件 = cloud 配信と完全一致`);
    process.exit(0);
  }

  console.error(
    `❌ affiliate-ads: 不一致 (git TS ${generated.length} 件 / cloud ${cloudAds.length} 件)`,
  );
  // 最初の差分 index を報告
  const max = Math.max(generated.length, cloudAds.length);
  for (let i = 0; i < max; i++) {
    if (JSON.stringify(generated[i]) !== JSON.stringify(cloudAds[i])) {
      console.error(`  first diff at index ${i}:`);
      console.error(`    git TS: ${JSON.stringify(generated[i])}`);
      console.error(`    cloud : ${JSON.stringify(cloudAds[i])}`);
      break;
    }
  }
  process.exit(1);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
