/**
 * affiliate_ads を git TS SSOT から R2 snapshot 化する (完全DBレス → docs/01_技術設計/02_データアーキテクチャ.md)。
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
import { AFFILIATE_OFFER_PROFILES } from "./affiliate-offer-profiles-data";

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

/** authored offer profile と creative 参照を R2 write 前に fail-closed で検査する。 */
function validateOfferProfiles(): void {
  const errors: string[] = [];
  const byRef = new Map<string, (typeof AFFILIATE_OFFER_PROFILES)[number]>();
  for (const profile of AFFILIATE_OFFER_PROFILES) {
    if (byRef.has(profile.programRef)) errors.push(`profile ${profile.programRef}: programRef 重複`);
    byRef.set(profile.programRef, profile);
    if (profile.allowedVerticals[0] !== profile.vertical) {
      errors.push(`profile ${profile.programRef}: canonical vertical が allowedVerticals 先頭でない`);
    }
    const isUnknown =
      profile.lane === "unknown" ||
      profile.actionType === "unknown" ||
      profile.frictionTier === "unknown" ||
      profile.personalDataLevel === "unknown" ||
      profile.humanContact === "unknown" ||
      !profile.conversionCondition ||
      !profile.conditionSource ||
      !profile.verifiedAt;
    if (isUnknown && profile.portfolioStatus !== "pending-classification" && profile.portfolioStatus !== "blocked") {
      errors.push(`profile ${profile.programRef}: unknown は pending-classification|blocked 必須`);
    }
    if (profile.lane === "discovery" && !["F0", "F1", "F2"].includes(profile.frictionTier)) {
      errors.push(`profile ${profile.programRef}: discovery は F0-F2 必須`);
    }
  }
  for (const ad of AFFILIATE_ADS) {
    if (!ad.programRef) {
      errors.push(`${ad.id}: programRef 未設定`);
      continue;
    }
    const profile = byRef.get(ad.programRef);
    if (!profile) {
      errors.push(`${ad.id}: offer profile 不在 (${ad.programRef})`);
      continue;
    }
    if (ad.vertical && !profile.allowedVerticals.includes(ad.vertical)) {
      errors.push(`${ad.id}: vertical ${ad.vertical} は profile allowlist 外`);
    }
    if (!ad.offerProfile) errors.push(`${ad.id}: offerProfile 未導出`);
  }
  if (errors.length > 0) throw new Error(`affiliate offer profile 検証エラー:\n - ${errors.join("\n - ")}`);
}

async function main() {
  validateExperiments();
  validateVerticals();
  validateOfferProfiles();

  // --validate-only: R2 書き込みをせず検証のみ (append-affiliate-ads.ts の register ゲート用)。
  // 実行には NODE_OPTIONS='--conditions react-server' が要る (repository が server-only を読むため)。
  if (process.argv.includes("--validate-only")) {
    console.log(`✅ affiliate-ads validate-only: ads=${AFFILIATE_ADS.length} (R2 書き込みなし)`);
    return;
  }

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
