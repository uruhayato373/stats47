/**
 * affiliate_ads を git TS SSOT から R2 snapshot 化する (完全DBレス → docs/01_技術設計/12_完全DBレス設計.md)。
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
  AFFILIATE_VERTICALS,
  adVertical,
} from "../src/features/ads/constants/affiliate-category";
import {
  AFFILIATE_ADS_SNAPSHOT_KEY,
  type AffiliateAdsSnapshot,
} from "../src/features/ads/repositories/affiliate-ad-snapshot";
import { AFFILIATE_ADS } from "./affiliate-ads-data";

dotenv.config({ path: ".env.local" });

/**
 * vertical 整合性をビルド時に検証する (意図ハブの SSOT を担保)。
 * - ad.vertical が設定済なら 10 軸のいずれかであること
 * - vertical も categoryKey→写像も無い広告は配信されない → error (孤立在庫の検出)
 */
function validateVerticals(): void {
  const valid = new Set<string>(AFFILIATE_VERTICALS);
  const errors: string[] = [];
  for (const ad of AFFILIATE_ADS) {
    // Step B 以降: vertical は必須 (categoryKey フォールバックは移行期のみ)
    if (!ad.vertical) {
      errors.push(`${ad.id}: vertical 未設定 (Step B 以降は必須)`);
    } else if (!valid.has(ad.vertical)) {
      errors.push(`${ad.id}: 不正な vertical "${ad.vertical}" (10 軸外)`);
    }
    if (!adVertical(ad)) {
      errors.push(
        `${ad.id}: vertical / categoryKey いずれからも vertical を解決できない (配信されない孤立在庫)`,
      );
    }
  }
  if (errors.length > 0) {
    throw new Error(`affiliate vertical 検証エラー:\n - ${errors.join("\n - ")}`);
  }
}

/**
 * A/B テスト (AFF-05) の整合性をビルド時に検証する (手編集 JSON を SSOT にしない原則)。
 * - experimentId と variantId は両方セットで使う
 * - 同一 experimentId 内で variantId は一意
 * - weight は非負
 */
function validateExperiments(): void {
  const seen = new Map<string, Set<string>>();
  const errors: string[] = [];
  for (const ad of AFFILIATE_ADS) {
    if (!ad.experimentId && !ad.variantId) continue;
    if (ad.experimentId && !ad.variantId) {
      errors.push(`${ad.id}: experimentId があるが variantId が無い`);
      continue;
    }
    if (ad.variantId && !ad.experimentId) {
      errors.push(`${ad.id}: variantId があるが experimentId が無い`);
      continue;
    }
    if (typeof ad.weight === "number" && ad.weight < 0) {
      errors.push(`${ad.id}: weight が負 (${ad.weight})`);
    }
    const set = seen.get(ad.experimentId as string) ?? new Set<string>();
    if (set.has(ad.variantId as string)) {
      errors.push(`experiment "${ad.experimentId}": variantId "${ad.variantId}" が重複`);
    }
    set.add(ad.variantId as string);
    seen.set(ad.experimentId as string, set);
  }
  if (errors.length > 0) {
    throw new Error(`affiliate experiment 検証エラー:\n - ${errors.join("\n - ")}`);
  }
}

async function main() {
  validateExperiments();
  validateVerticals();

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
