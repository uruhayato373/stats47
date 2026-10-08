import type { SalesChannel, SalesLedger, SalesSummary } from "./types";

// 検証は認証付き計測の CI (素の node) と共有するため ledger-core.mjs に置く
export { validateSalesLedger } from "./ledger-core.mjs";

const CHANNELS: readonly SalesChannel[] = ["kdp", "coconala"];

export function summarizeSalesLedger(ledger: SalesLedger): SalesSummary {
  const observations = ledger.observations;
  const measuredChannels = CHANNELS.filter((channel) =>
    observations.some((row) => row.channel === channel),
  );
  const total = (field: "orders" | "units" | "netRevenueYen" | "refunds") =>
    observations.reduce((sum, row) => sum + row[field], 0);

  return {
    observationCount: observations.length,
    measuredChannels,
    orders: total("orders"),
    units: total("units"),
    netRevenueYen: total("netRevenueYen"),
    refunds: total("refunds"),
    kenpRead: observations.reduce((sum, row) => sum + (row.kenpRead ?? 0), 0),
    latestPeriodEnd:
      observations.length === 0
        ? null
        : observations.reduce(
            (latest, row) => (row.periodEnd > latest ? row.periodEnd : latest),
            observations[0].periodEnd,
          ),
  };
}
