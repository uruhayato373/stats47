import { lookupArea } from '@stats47/area';
import { SHELTER_APPLICABILITY_SOURCE as source } from '@stats47/data-configs/theme-catalog';
import { z } from 'zod';
const count = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
const hazard = z
  .object({
    key: z.string(),
    applicable: count,
    notApplicable: count,
    unknown: count,
  })
  .strict();
const coverage = z
  .object({
    catalogMunicipalities: count,
    bothPublished: count,
    emergencyOnlyPublished: count,
    shelterOnlyPublished: count,
    notPublished: count,
  })
  .strict();
const row = z
  .object({
    areaCode: z.string(),
    areaName: z.string(),
    latestDatabaseUpdate: z.string().date(),
    coverage,
    emergency: z
      .object({
        facilities: count,
        addressAlsoShelter: count,
        hazards: z.array(hazard).length(8),
      })
      .strict(),
    shelter: z
      .object({
        facilities: count,
        general: count,
        welfare: count,
        addressAlsoEmergency: count,
        hazardAttributes: z.literal('not-provided-for-this-facility-type'),
      })
      .strict(),
  })
  .strict()
  .superRefine((r, ctx) => {
    const fail = (message: string) => ctx.addIssue({ code: 'custom', message });
    if (
      r.coverage.catalogMunicipalities !==
      r.coverage.bothPublished +
        r.coverage.emergencyOnlyPublished +
        r.coverage.shelterOnlyPublished +
        r.coverage.notPublished
    )
      fail('publication coverage partition');
    if (r.shelter.general + r.shelter.welfare !== r.shelter.facilities)
      fail('general/welfare partition');
    if (
      r.emergency.addressAlsoShelter > r.emergency.facilities ||
      r.shelter.addressAlsoEmergency > r.shelter.facilities
    )
      fail('same address subset');
    if (
      JSON.stringify(r.emergency.hazards.map((h) => h.key)) !==
      JSON.stringify(source.hazards.map((h) => h.key))
    )
      fail('eight distinct hazard definitions');
    for (const h of r.emergency.hazards)
      if (
        h.applicable + h.notApplicable + h.unknown !== r.emergency.facilities ||
        h.unknown !== 0
      )
        fail('hazard field conservation/unknown symbol absent in fixed source');
    if (
      !/^2026-\d{2}-\d{2}$/.test(r.latestDatabaseUpdate) ||
      r.latestDatabaseUpdate > source.latestDatabaseUpdate
    )
      fail('DB update date');
  });
const pins = source.files.map((f) => ({
  filename: f.filename,
  sha256: f.sha256,
  bytes: f.bytes,
}));
export const shelterApplicabilitySnapshotSchema = z
  .object({
    schemaVersion: z.literal(1),
    seriesKey: z.literal(source.seriesKey),
    dataVersion: z.literal(source.dataVersion),
    acquiredOn: z.literal(source.acquiredOn),
    latestDatabaseUpdate: z.literal(source.latestDatabaseUpdate),
    generatedAt: z.string().datetime(),
    unit: z.literal('掲載件数（共通ID）'),
    sourcePins: z.array(
      z
        .object({ filename: z.string(), sha256: z.string(), bytes: count })
        .strict()
    ),
    national: row,
    rows: z.array(row).length(47),
  })
  .strict()
  .superRefine((v, ctx) => {
    const fail = (message: string) => ctx.addIssue({ code: 'custom', message });
    if (JSON.stringify(v.sourcePins) !== JSON.stringify(pins))
      fail('official source pins');
    if (
      v.national.areaCode !== '00000' ||
      v.national.areaName !== '全国' ||
      v.national.latestDatabaseUpdate !== source.latestDatabaseUpdate
    )
      fail('national identity');
    const codes = v.rows.map((r) => r.areaCode);
    if (
      JSON.stringify(codes) !==
      JSON.stringify(
        Array.from(
          { length: 47 },
          (_, i) => String(i + 1).padStart(2, '0') + '000'
        )
      )
    )
      fail('47 unique prefectures');
    for (const r of v.rows)
      if (lookupArea(r.areaCode)?.areaName !== r.areaName)
        fail('canonical area name');
    const sum = (fn: (r: z.infer<typeof row>) => number) =>
      v.rows.reduce((n, r) => n + fn(r), 0);
    for (const key of [
      'catalogMunicipalities',
      'bothPublished',
      'emergencyOnlyPublished',
      'shelterOnlyPublished',
      'notPublished',
    ] as const)
      if (
        v.national.coverage[key] !== sum((r) => r.coverage[key]) ||
        v.national.coverage[key] !== source.expected[key]
      )
        fail('national coverage sum');
    for (const key of ['facilities', 'addressAlsoShelter'] as const)
      if (v.national.emergency[key] !== sum((r) => r.emergency[key]))
        fail('national emergency sum');
    for (const key of [
      'facilities',
      'general',
      'welfare',
      'addressAlsoEmergency',
    ] as const)
      if (v.national.shelter[key] !== sum((r) => r.shelter[key]))
        fail('national shelter sum');
    if (
      v.national.emergency.facilities !== source.expected.emergencyFacilities ||
      v.national.shelter.facilities !== source.expected.shelterFacilities ||
      v.national.shelter.general !== source.expected.generalShelters ||
      v.national.shelter.welfare !== source.expected.welfareShelters
    )
      fail('official national cohorts');
    // Array-length errors are already recorded; avoid indexing an incomplete row.
    if (
      v.national.emergency.hazards.length !== 8 ||
      v.rows.some((r) => r.emergency.hazards.length !== 8)
    )
      return;
    for (let i = 0; i < 8; i++)
      for (const key of ['applicable', 'notApplicable', 'unknown'] as const)
        if (
          v.national.emergency.hazards[i]![key] !==
          sum((r) => r.emergency.hazards[i]![key])
        )
          fail('national hazard sum');
    for (const h of v.national.emergency.hazards)
      if (
        h.applicable !==
        source.expected.hazardApplicable[
          h.key as keyof typeof source.expected.hazardApplicable
        ]
      )
        fail('official national hazard counts');
  });
export type ShelterApplicabilitySnapshot = z.infer<
  typeof shelterApplicabilitySnapshotSchema
>;
export type ShelterApplicabilityRow = z.infer<typeof row>;
export function parseShelterApplicabilitySnapshot(
  raw: unknown
): ShelterApplicabilitySnapshot | null {
  const r = shelterApplicabilitySnapshotSchema.safeParse(raw);
  return r.success ? r.data : null;
}
export function selectShelterApplicability(
  snapshot: ShelterApplicabilitySnapshot,
  areaCode: string | null
): ShelterApplicabilityRow | null {
  return areaCode === null
    ? snapshot.national
    : (snapshot.rows.find((r) => r.areaCode === areaCode) ?? null);
}
