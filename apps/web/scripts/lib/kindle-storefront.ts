export interface KindleStorefrontEdition {
  readonly title: string;
  readonly priceYen: number;
  readonly status: string;
  readonly asin?: string | null;
  readonly kdpStatus?: string | null;
  readonly withdrawal?: unknown;
  readonly unpublishAfterReplacementLive?: boolean;
}

export interface KindleStorefrontListing extends KindleStorefrontEdition {
  readonly replacesAsin?: string;
  readonly previousEditions?: readonly KindleStorefrontEdition[];
}

function isLive(edition: KindleStorefrontEdition): boolean {
  return edition.status === "listed" && edition.kdpStatus === "live" &&
    Boolean(edition.asin) && !edition.withdrawal;
}

/** 新版を販売中と偽らず、明示的に維持されている販売中の旧版だけを引き継ぐ。 */
export function selectLiveKindleEdition(
  listing: KindleStorefrontListing,
): KindleStorefrontEdition | null {
  if (!["draft", "listed"].includes(listing.status) || listing.withdrawal) return null;
  if (isLive(listing)) return listing;
  if (!listing.replacesAsin) return null;
  const predecessors = (listing.previousEditions ?? []).filter((edition) =>
    edition.asin === listing.replacesAsin &&
    edition.unpublishAfterReplacementLive === true && isLive(edition),
  );
  return predecessors.length === 1 ? predecessors[0] : null;
}
