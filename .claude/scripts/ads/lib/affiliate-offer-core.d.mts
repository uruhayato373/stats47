export const OFFER_CONDITION_STALE_DAYS: number;

export interface AffiliateProgramRefDerivation {
  byAdId: Record<string, string>;
  unresolved: Array<{ adId: string; token: string | null }>;
  ambiguous: Array<{ adId: string; token: string; programRefs: string[] }>;
}

export function deriveAffiliateProgramRefs(
  ads: readonly any[],
  overrides?: Readonly<Record<string, string>>,
): AffiliateProgramRefDerivation;

export function validateAffiliateOfferProfiles(input: {
  profiles: readonly object[];
  ads: readonly object[];
  knownVerticals: readonly string[];
}): string[];

export function buildAffiliateOfferQueues(input: object): {
  discovery: unknown[];
  decision: unknown[];
  excluded: unknown[];
};

export function isNormalAffiliateAd(ad: object): boolean;
