export interface AffiliatePortfolioViewModel {
  generatedAt: string | null;
  gates: Record<string, { status: string; reasons: string[] }>;
  totals: { offers: number; ads: number; unclassified: number; sharedOutcomePrograms: number };
  lanes: Array<{ lane: string; count: number }>;
  confirmedRevenueYen: number | null;
  confirmedRevenueUnavailableReason: string | null;
  unknownMetricOffers: number;
  nextAction: { id: string; reasons: string[]; programRef?: string } | null;
  unclassifiedProgramRefs: string[];
}

/** admin と単体HTMLが共有するread-only view model。判定はstate生成器だけが持つ。 */
export function buildAffiliatePortfolioViewModel(raw: Record<string, any>): AffiliatePortfolioViewModel {
  const offers: Array<Record<string, any>> = Array.isArray(raw.offers) ? raw.offers : [];
  const laneCounts = new Map<string, number>();
  for (const offer of offers) laneCounts.set(offer.lane ?? "unknown", (laneCounts.get(offer.lane ?? "unknown") ?? 0) + 1);
  const revenueMetrics = offers.map((offer) => offer.metrics?.confirmedRevenueYen);
  const revenues = revenueMetrics
    .map((item) => item?.value)
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  const allRevenueKnown = offers.length > 0 && revenues.length === offers.length;
  const firstRevenueReason = offers
    .map((offer) => offer.metrics?.confirmedRevenueYen?.unavailableReason)
    .find((reason) => typeof reason === "string" && reason !== "");
  const unclassifiedProgramRefs = offers
    .filter((offer) => offer.portfolioStatus === "pending-classification")
    .map((offer) => String(offer.programRef));
  return {
    generatedAt: raw.generatedAt ?? null,
    gates: raw.gates ?? {},
    totals: {
      offers: Number(raw.summary?.offers ?? offers.length),
      ads: Number(raw.summary?.ads ?? raw.ads?.length ?? 0),
      unclassified: Number(raw.summary?.unclassified ?? unclassifiedProgramRefs.length),
      sharedOutcomePrograms: Number(raw.summary?.sharedOutcomePrograms ?? 0),
    },
    lanes: [...laneCounts.entries()].map(([lane, count]) => ({ lane, count })).sort((a, b) => a.lane.localeCompare(b.lane)),
    confirmedRevenueYen: allRevenueKnown ? revenues.reduce((sum, value) => sum + value, 0) : null,
    confirmedRevenueUnavailableReason: allRevenueKnown ? null : firstRevenueReason ?? "confirmed-outcome-unavailable",
    unknownMetricOffers: offers.filter((offer) =>
      Object.values(offer.metrics ?? {}).some((metric: any) => metric?.value == null),
    ).length,
    nextAction: raw.recommendedActions?.[0] ?? null,
    unclassifiedProgramRefs,
  };
}
