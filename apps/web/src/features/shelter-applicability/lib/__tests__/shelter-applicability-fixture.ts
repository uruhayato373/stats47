import { lookupArea } from '@stats47/area';
import { SHELTER_APPLICABILITY_SOURCE as source } from '@stats47/data-configs/theme-catalog';

import type {
  ShelterApplicabilityRow,
  ShelterApplicabilitySnapshot,
} from '../shelter-applicability-snapshot';
/** Synthetic partition for contract tests; not observations for publication. */
export function shelterApplicabilityFixture(): ShelterApplicabilitySnapshot {
  const e = source.expected;
  const split = (n: number, i: number) =>
    Math.floor(n / 47) + (i < n % 47 ? 1 : 0);
  const make = (i: number | null): ShelterApplicabilityRow => {
    const n = (value: number) => (i === null ? value : split(value, i));
    const areaCode =
      i === null ? '00000' : String(i + 1).padStart(2, '0') + '000';
    const coverage = {
      catalogMunicipalities: 0,
      bothPublished: n(e.bothPublished),
      emergencyOnlyPublished: n(e.emergencyOnlyPublished),
      shelterOnlyPublished: n(e.shelterOnlyPublished),
      notPublished: n(e.notPublished),
    };
    coverage.catalogMunicipalities =
      coverage.bothPublished +
      coverage.emergencyOnlyPublished +
      coverage.shelterOnlyPublished +
      coverage.notPublished;
    const general = n(e.generalShelters),
      welfare = n(e.welfareShelters),
      facilities = n(e.emergencyFacilities);
    return {
      areaCode,
      areaName: i === null ? '全国' : lookupArea(areaCode)!.areaName,
      latestDatabaseUpdate: source.latestDatabaseUpdate,
      coverage,
      emergency: {
        facilities,
        addressAlsoShelter: 0,
        hazards: source.hazards.map((h) => {
          const applicable = n(e.hazardApplicable[h.key]);
          return {
            key: h.key,
            applicable,
            notApplicable: facilities - applicable,
            unknown: 0,
          };
        }),
      },
      shelter: {
        facilities: general + welfare,
        general,
        welfare,
        addressAlsoEmergency: 0,
        hazardAttributes: 'not-provided-for-this-facility-type',
      },
    };
  };
  return {
    schemaVersion: 1,
    seriesKey: source.seriesKey,
    dataVersion: source.dataVersion,
    acquiredOn: source.acquiredOn,
    latestDatabaseUpdate: source.latestDatabaseUpdate,
    generatedAt: '2026-09-11T00:00:00.000Z',
    unit: '掲載件数（共通ID）',
    sourcePins: source.files.map((f) => ({
      filename: f.filename,
      sha256: f.sha256,
      bytes: f.bytes,
    })),
    national: make(null),
    rows: Array.from({ length: 47 }, (_, i) => make(i)),
  };
}
