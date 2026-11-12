import type { AffiliateOfferProfile } from "../src/features/ads/types";
import data from "../../../data/affiliate/ledger/offer-profiles.json";

/**
 * 案件の読み込み口。記録の正本は台帳 `affiliate.offer-profiles` (data/affiliate/ledger/offer-profiles.json + Schema) で、
 * ここは型を付けて export するだけで、記録を持たない。
 */
export const AFFILIATE_OFFER_PROFILES = data.profiles as AffiliateOfferProfile[];

/** creative → program の安定参照。A8 は mid / a8mat の突合、例外は実機 catalog で確認済み。 */
export const AFFILIATE_PROGRAM_REF_BY_AD_ID: Readonly<Record<string, string>> = data.programRefByAdId;
