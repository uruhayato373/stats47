import { AIRPORT_TRAFFIC_SOURCE as source } from '@stats47/data-configs/theme-catalog';
/** Synthetic allocation solely for schema and UI tests. */
export function airportTrafficFixture() {
  return {
    schemaVersion: 1,
    period: source.period,
    periodType: source.periodType,
    releaseStatus: source.releaseStatus,
    generatedAt: '2026-09-10T15:00:00.000Z',
    passengerUnit: source.passengerUnit,
    cargoUnit: source.cargoUnit,
    source: {
      title: source.title,
      url: source.url,
      files: structuredClone(source.files),
    },
    airports: source.airports.map((airport, index) => ({
      airportName: airport.airportName,
      areaCodes: [...airport.areaCodes],
      passengers: Object.fromEntries(
        Object.entries(source.national.passengers).map(([key, value]) => [
          key,
          index === 0 ? value : 0,
        ])
      ),
      cargo: Object.fromEntries(
        Object.entries(source.national.cargo).map(([key, value]) => [
          key,
          index === 0 ? value : 0,
        ])
      ),
    })),
    national: structuredClone(source.national),
    notes: structuredClone(source.notes),
  };
}
