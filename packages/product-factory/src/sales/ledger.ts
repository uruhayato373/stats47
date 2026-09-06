import type {
  SalesChannel,
  SalesLedger,
  SalesObservation,
  SalesSummary,
} from "./types";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const CHANNELS: readonly SalesChannel[] = ["kdp", "coconala"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertNonNegativeInteger(value: unknown, field: string): asserts value is number {
  if (!Number.isInteger(value) || Number(value) < 0) {
    throw new Error(`${field} must be a non-negative integer`);
  }
}

export function validateSalesLedger(value: unknown): SalesLedger {
  if (!isRecord(value) || value.schemaVersion !== 1 || !Array.isArray(value.observations)) {
    throw new Error("sales ledger must have schemaVersion=1 and observations[]");
  }

  const seenIds = new Set<string>();
  const observations = value.observations.map((row, index): SalesObservation => {
    if (!isRecord(row)) throw new Error(`observations[${index}] must be an object`);
    if (typeof row.id !== "string" || !row.id) throw new Error(`observations[${index}].id is required`);
    if (seenIds.has(row.id)) throw new Error(`duplicate observation id: ${row.id}`);
    seenIds.add(row.id);
    if (!CHANNELS.includes(row.channel as SalesChannel)) {
      throw new Error(`observations[${index}].channel is invalid`);
    }
    if (typeof row.productId !== "string" || !row.productId) {
      throw new Error(`observations[${index}].productId is required`);
    }
    if (typeof row.periodStart !== "string" || !DATE_PATTERN.test(row.periodStart)) {
      throw new Error(`observations[${index}].periodStart must be YYYY-MM-DD`);
    }
    if (typeof row.periodEnd !== "string" || !DATE_PATTERN.test(row.periodEnd)) {
      throw new Error(`observations[${index}].periodEnd must be YYYY-MM-DD`);
    }
    if (row.periodStart > row.periodEnd) {
      throw new Error(`observations[${index}] periodStart is after periodEnd`);
    }
    assertNonNegativeInteger(row.orders, `observations[${index}].orders`);
    assertNonNegativeInteger(row.units, `observations[${index}].units`);
    assertNonNegativeInteger(row.netRevenueYen, `observations[${index}].netRevenueYen`);
    assertNonNegativeInteger(row.refunds, `observations[${index}].refunds`);
    if (row.kenpRead !== undefined) {
      assertNonNegativeInteger(row.kenpRead, `observations[${index}].kenpRead`);
    }
    if (typeof row.evidencePath !== "string" || !row.evidencePath) {
      throw new Error(`observations[${index}].evidencePath is required`);
    }
    if (!row.evidencePath.startsWith(".local/product-sales-evidence/")) {
      throw new Error(
        `observations[${index}].evidencePath must be inside .local/product-sales-evidence`,
      );
    }
    if (typeof row.evidenceSha256 !== "string" || !SHA256_PATTERN.test(row.evidenceSha256)) {
      throw new Error(`observations[${index}].evidenceSha256 must be lowercase sha256`);
    }
    if (typeof row.recordedAt !== "string" || Number.isNaN(Date.parse(row.recordedAt))) {
      throw new Error(`observations[${index}].recordedAt must be ISO datetime`);
    }

    return row as unknown as SalesObservation;
  });

  return { schemaVersion: 1, observations };
}

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
