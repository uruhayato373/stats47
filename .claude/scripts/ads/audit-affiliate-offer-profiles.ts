/**
 * offer catalog / creative programRef のread-only監査。
 * action/frictionは推測せず、未同定creativeと未分類profileをJSONで列挙する。
 * R2・ASP・SSOTへ書き込まない。
 */
import { AFFILIATE_ADS } from "../../../apps/web/scripts/affiliate-ads-data";
import {
  AFFILIATE_OFFER_PROFILES,
  AFFILIATE_PROGRAM_REF_BY_AD_ID,
} from "../../../apps/web/scripts/affiliate-offer-profiles-data";
import { AFFILIATE_VERTICALS } from "./lib/affiliate-status-core.mjs";
import {
  deriveAffiliateProgramRefs,
  validateAffiliateOfferProfiles,
} from "./lib/affiliate-offer-core.mjs";

function main(): void {
  const derived = deriveAffiliateProgramRefs(AFFILIATE_ADS, AFFILIATE_PROGRAM_REF_BY_AD_ID);
  const declarationErrors: string[] = [];
  for (const ad of AFFILIATE_ADS) {
    const candidate = derived.byAdId[ad.id] ?? null;
    const declared = ad.programRef ?? null;
    if (candidate !== declared) {
      declarationErrors.push(
        `ad:${ad.id}.program-ref-candidate-mismatch:${declared ?? "missing"}:${candidate ?? "unresolved"}`,
      );
    }
  }

  const knownProgramRefs = [...new Set(Object.values(derived.byAdId))];
  const validationErrors = validateAffiliateOfferProfiles({
    profiles: AFFILIATE_OFFER_PROFILES,
    ads: AFFILIATE_ADS,
    knownVerticals: AFFILIATE_VERTICALS,
  });
  const unclassifiedProfiles = AFFILIATE_OFFER_PROFILES
    .filter((profile) => profile.lane === "unknown")
    .map((profile) => ({
      programRef: profile.programRef,
      vertical: profile.vertical,
      actionType: profile.actionType,
      frictionTier: profile.frictionTier,
      portfolioStatus: profile.portfolioStatus,
    }));

  const output = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    summary: {
      ads: AFFILIATE_ADS.length,
      adsWithProgramRef: AFFILIATE_ADS.filter((ad) => ad.programRef).length,
      adsWithoutProgramRef: derived.unresolved.length + derived.ambiguous.length,
      uniqueProgramRefs: knownProgramRefs.length,
      profiles: AFFILIATE_OFFER_PROFILES.length,
      unclassifiedProfiles: unclassifiedProfiles.length,
      unresolvedAds: derived.unresolved.length,
      ambiguousAds: derived.ambiguous.length,
      errors: validationErrors.length + declarationErrors.length,
    },
    errors: [...validationErrors, ...declarationErrors],
    unresolvedAds: derived.unresolved,
    ambiguousAds: derived.ambiguous,
    unclassifiedProfiles,
  };
  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
  if (output.summary.errors > 0) process.exitCode = 1;
}

main();
