/**
 * affiliate_ads を git TS SSOT から R2 snapshot 化する (完全DBレス → docs/01_技術設計/19_完全DBレス設計.md)。
 *
 * SSOT は `apps/web/scripts/affiliate-ads-data.ts` の AFFILIATE_ADS (git TS)。永続 D1 は読まない。
 * 手動 A8.net バナー登録は affiliate-ads-data.ts を直接編集する。
 *
 * 使用方法:
 *   npx tsx -r ./packages/ranking/src/scripts/setup-cli.js \
 *     apps/web/scripts/export-affiliate-ads-snapshot.ts
 */

import dotenv from "dotenv";

import { saveToR2 } from "@stats47/r2-storage/server";

import {
  AFFILIATE_ADS_SNAPSHOT_KEY,
  type AffiliateAdsSnapshot,
} from "../src/features/ads/repositories/affiliate-ad-snapshot";
import { AFFILIATE_ADS } from "./affiliate-ads-data";

dotenv.config({ path: ".env.local" });

async function main() {
  const snapshot: AffiliateAdsSnapshot = {
    generatedAt: new Date().toISOString(),
    ads: AFFILIATE_ADS,
  };

  const body = JSON.stringify(snapshot);
  const result = await saveToR2(AFFILIATE_ADS_SNAPSHOT_KEY, body, {
    contentType: "application/json; charset=utf-8",
  });

  console.log(`✅ affiliate-ads: ads=${AFFILIATE_ADS.length} bytes=${result.size}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
