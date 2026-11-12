import { isAffiliateDeliveryHeld } from "../src/features/ads/constants/affiliate-delivery-policy";

import {
  AFFILIATE_OFFER_PROFILES,
  AFFILIATE_PROGRAM_REF_BY_AD_ID,
} from "./affiliate-offer-profiles-data";

import type { AffiliateAd } from "../src/features/ads/types";
import data from "../../../data/affiliate/ledger/ads.json";

/**
 * 広告 (クリエイティブ) の読み込み口。記録の正本は台帳 `affiliate.ads` (data/affiliate/ledger/ads.json + Schema) で、
 * ここは型を付け、案件の参照と配信の保留を結んで export するだけで、記録を持たない。
 * 反映: export-affiliate-ads-snapshot.ts が AFFILIATE_ADS → R2 app/affiliate-ads/all.json を生成する。
 * 追記は append-affiliate-ads.ts (A8 の機械追記) か、台帳の JSON を直接編集する。
 */
const AFFILIATE_ADS_BASE = data.ads as unknown as AffiliateAd[];

const OFFER_PROFILE_BY_PROGRAM_REF = new Map(
  AFFILIATE_OFFER_PROFILES.map((profile) => [profile.programRef, profile]),
);

/**
 * creative SSOTへ案件参照と安定profileをjoinする。既存のpriority・解決順・表示内容は変更しない。
 * 参照欠損はexport validatorが fail-closed にするため、ここでは推測フォールバックを持たない。
 */
export const AFFILIATE_ADS: AffiliateAd[] = AFFILIATE_ADS_BASE.map((ad) => {
  const programRef = ad.programRef ?? AFFILIATE_PROGRAM_REF_BY_AD_ID[ad.id];
  const profile = programRef ? OFFER_PROFILE_BY_PROGRAM_REF.get(programRef) : undefined;
  return {
    ...ad,
    isActive: ad.isActive && !isAffiliateDeliveryHeld({ ...ad, programRef, offerProfile: profile }),
    ...(programRef ? { programRef } : {}),
    ...(profile
      ? {
          offerProfile: {
            lane: profile.lane,
            actionType: profile.actionType,
            frictionTier: profile.frictionTier,
            portfolioStatus: profile.portfolioStatus,
            allowedPageTypes: profile.allowedPageTypes,
          },
        }
      : {}),
  };
});
