import { lookupArea } from '@stats47/area';
import { FREIGHT_OD_SOURCE as source } from '@stats47/data-configs/theme-catalog';
/** Synthetic test allocation, never used as an observation. */
export function freightOdFixture() {
  const codes = Array.from(
    { length: 47 },
    (_, index) => String(index + 1).padStart(2, '0') + '000'
  );
  return {
    schemaVersion: 1,
    period: source.period,
    commodity: '総貨物',
    generatedAt: '2026-09-10T15:00:00.000Z',
    source: {
      title: source.title,
      url: source.url,
      files: structuredClone(source.files),
    },
    prefectures: codes.map((areaCode) => ({
      areaCode,
      areaName: lookupArea(areaCode)!.areaName,
    })),
    modes: source.modes.map((mode) => {
      const total =
        mode.officialNationalTotal + mode.nationalRoundingDifference;
      return {
        mode: mode.mode,
        label: mode.label,
        unit: mode.unit,
        periodType: mode.periodType,
        officialNationalTotal: mode.officialNationalTotal,
        od: codes.flatMap((originAreaCode) =>
          codes.map((destinationAreaCode) => ({
            originAreaCode,
            destinationAreaCode,
            value:
              originAreaCode === '01000' && destinationAreaCode === '02000'
                ? total
                : 0,
          }))
        ),
        originTotals: codes.map((areaCode) => ({
          areaCode,
          value: areaCode === '01000' ? total : 0,
        })),
        destinationTotals: codes.map((areaCode) => ({
          areaCode,
          value: areaCode === '02000' ? total : 0,
        })),
      };
    }),
    notes: structuredClone(source.notes),
  };
}
