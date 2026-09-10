import { AIRPORT_TRAFFIC_SOURCE } from '@stats47/data-configs/theme-catalog';
import { z } from 'zod';
const source = AIRPORT_TRAFFIC_SOURCE;
const count = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const passengers = z
  .object({
    internationalBoarding: count,
    internationalAlighting: count,
    internationalTransit: count,
    internationalTotal: count,
    domesticBoarding: count,
    domesticAlighting: count,
    domesticTotal: count,
    total: count,
  })
  .strict();
const cargo = z
  .object({
    internationalLoaded: count,
    internationalUnloaded: count,
    internationalTotal: count,
    domesticLoaded: count,
    domesticUnloaded: count,
    domesticTotal: count,
    total: count,
  })
  .strict();
const totals = z.object({ passengers, cargo }).strict();
export const airportTrafficSnapshotSchema = z
  .object({
    schemaVersion: z.literal(1),
    period: z.literal(source.period),
    periodType: z.literal(source.periodType),
    releaseStatus: z.literal(source.releaseStatus),
    generatedAt: z.string().datetime(),
    passengerUnit: z.literal(source.passengerUnit),
    cargoUnit: z.literal(source.cargoUnit),
    source: z
      .object({
        title: z.literal(source.title),
        url: z.literal(source.url),
        files: z
          .array(
            z
              .object({
                filename: z.string(),
                url: z.string().url(),
                sha256: z.string(),
              })
              .strict()
          )
          .length(source.files.length),
      })
      .strict(),
    airports: z
      .array(
        z
          .object({
            airportName: z.string(),
            areaCodes: z.array(z.string()).min(1).max(2),
            passengers,
            cargo,
          })
          .strict()
      )
      .length(source.airportCount),
    national: totals,
    notes: z.array(z.string()),
  })
  .strict()
  .superRefine((snapshot, ctx) => {
    const fail = (message: string) =>
      ctx.addIssue({ code: z.ZodIssueCode.custom, message });
    if (JSON.stringify(snapshot.source.files) !== JSON.stringify(source.files))
      fail('原表と所在地原典のURL・SHAが一致しない');
    if (JSON.stringify(snapshot.notes) !== JSON.stringify(source.notes))
      fail('旅客・所在地・対象空港の注記が欠落');
    const seen = new Set<string>();
    for (const row of snapshot.airports) {
      const mapping = source.airports.find(
        (item) => item.airportName === row.airportName
      );
      if (
        !mapping ||
        seen.has(row.airportName) ||
        JSON.stringify(row.areaCodes) !== JSON.stringify(mapping.areaCodes)
      )
        fail('空港の一意な名称・所在地対応が不正');
      seen.add(row.airportName);
    }
    for (const row of [...snapshot.airports, snapshot.national]) {
      const p = row.passengers;
      const c = row.cargo;
      if (
        p.internationalBoarding +
          p.internationalAlighting +
          p.internationalTransit !==
          p.internationalTotal ||
        p.domesticBoarding + p.domesticAlighting !== p.domesticTotal ||
        p.internationalTotal + p.domesticTotal !== p.total
      )
        fail('乗客・降客・通過客・国内外の保存則違反');
      if (
        c.internationalLoaded + c.internationalUnloaded !==
          c.internationalTotal ||
        c.domesticLoaded + c.domesticUnloaded !== c.domesticTotal ||
        c.internationalTotal + c.domesticTotal !== c.total
      )
        fail('積込・取卸・国内外の保存則違反');
    }
    for (const key of Object.keys(
      source.national.passengers
    ) as (keyof typeof source.national.passengers)[]) {
      if (
        snapshot.national.passengers[key] !== source.national.passengers[key] ||
        snapshot.airports.reduce((sum, row) => sum + row.passengers[key], 0) !==
          snapshot.national.passengers[key]
      )
        fail('旅客96空港と全国の保存則違反');
    }
    for (const key of Object.keys(
      source.national.cargo
    ) as (keyof typeof source.national.cargo)[]) {
      if (
        snapshot.national.cargo[key] !== source.national.cargo[key] ||
        snapshot.airports.reduce((sum, row) => sum + row.cargo[key], 0) !==
          snapshot.national.cargo[key]
      )
        fail('貨物96空港と全国の保存則違反');
    }
  });
export type AirportTrafficSnapshot = z.infer<
  typeof airportTrafficSnapshotSchema
>;
export function parseAirportTrafficSnapshot(
  raw: unknown
): AirportTrafficSnapshot | null {
  const result = airportTrafficSnapshotSchema.safeParse(raw);
  return result.success ? result.data : null;
}
/** 全国では空港を一意に、県では公式所在地との対応で選択する。 */
export function selectAirports(
  snapshot: AirportTrafficSnapshot,
  areaCode: string | null
) {
  return areaCode === null
    ? snapshot.airports
    : snapshot.airports.filter((row) => row.areaCodes.includes(areaCode));
}
