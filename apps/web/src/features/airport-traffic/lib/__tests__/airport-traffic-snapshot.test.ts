import { describe, expect, it } from 'vitest';

import {
  airportTrafficSnapshotSchema,
  parseAirportTrafficSnapshot,
  selectAirports,
} from '../airport-traffic-snapshot';

import { airportTrafficFixture } from './airport-traffic-fixture';
describe('airport source contract', () => {
  it('accepts96uniqueairports', () =>
    expect(
      parseAirportTrafficSnapshot(airportTrafficFixture())?.airports
    ).toHaveLength(96));
  it('rejects missing airport', () => {
    const s = airportTrafficFixture();
    s.airports.pop();
    expect(parseAirportTrafficSnapshot(s)).toBeNull();
  });
  it('rejects wrong prefecture', () => {
    const s = airportTrafficFixture();
    s.airports[0].areaCodes = ['99999'] as never;
    expect(parseAirportTrafficSnapshot(s)).toBeNull();
  });
  it('rejects altered passenger sum', () => {
    const s = airportTrafficFixture();
    s.airports[0].passengers.total++;
    expect(parseAirportTrafficSnapshot(s)).toBeNull();
  });
  it('rejects altered cargo sum', () => {
    const s = airportTrafficFixture();
    s.airports[0].cargo.domesticTotal++;
    expect(parseAirportTrafficSnapshot(s)).toBeNull();
  });
  it('rejects missing transit', () => {
    const s = airportTrafficFixture();
    s.airports[0].passengers.internationalTransit = 0;
    expect(parseAirportTrafficSnapshot(s)).toBeNull();
  });
  it('keeps Itami once nationally and in both location filters', () => {
    const s = airportTrafficSnapshotSchema.parse(airportTrafficFixture());
    for (const code of [null, '27000', '28000'])
      expect(
        selectAirports(s, code).filter((a) => a.airportName === '大阪国際')
      ).toHaveLength(1);
  });
  it('distinguishes no-airport prefecture from missing payload', () => {
    const s = airportTrafficSnapshotSchema.parse(airportTrafficFixture());
    expect(selectAirports(s, '11000')).toHaveLength(0);
    expect(parseAirportTrafficSnapshot(null)).toBeNull();
  });
});
