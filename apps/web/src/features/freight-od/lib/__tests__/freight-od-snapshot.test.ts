import { describe, expect, it } from 'vitest';

import {
  freightOdSnapshotSchema,
  parseFreightOdSnapshot,
  selectFreightPartners,
} from '../freight-od-snapshot';

import { freightOdFixture } from './freight-od-fixture';
describe('freight OD source contract', () => {
  it('accepts all47x47 cells for four separate modes', () =>
    expect(parseFreightOdSnapshot(freightOdFixture())?.modes).toHaveLength(4));
  it('rejects missing and duplicate OD cells', () => {
    const s = freightOdFixture();
    s.modes[0].od[0] = s.modes[0].od[1];
    expect(parseFreightOdSnapshot(s)).toBeNull();
  });
  it('rejects altered flow with unchanged margins', () => {
    const s = freightOdFixture();
    s.modes[0].od[0].value++;
    expect(parseFreightOdSnapshot(s)).toBeNull();
  });
  it('rejects direction reversal', () => {
    const s = freightOdFixture();
    s.modes[0].od.forEach(
      (p) =>
        ([p.originAreaCode, p.destinationAreaCode] = [
          p.destinationAreaCode,
          p.originAreaCode,
        ])
    );
    expect(parseFreightOdSnapshot(s)).toBeNull();
  });
  it('rejects changing a maritime calendar year to a fiscal year', () => {
    const s = freightOdFixture();
    s.modes[1].periodType = 'fiscal';
    expect(parseFreightOdSnapshot(s)).toBeNull();
  });
  it('rejects hiding road rounding difference', () => {
    const s = freightOdFixture();
    s.modes[2].officialNationalTotal -= 4;
    expect(parseFreightOdSnapshot(s)).toBeNull();
  });
  it('distinguishes outbound, inbound, zero, and unknown area', () => {
    const s = freightOdSnapshotSchema.parse(freightOdFixture());
    expect(
      selectFreightPartners(s, 'rail', '01000', 'outbound')!.total
    ).toBeGreaterThan(0);
    expect(selectFreightPartners(s, 'rail', '01000', 'inbound')!.total).toBe(0);
    expect(selectFreightPartners(s, 'rail', '99999', 'inbound')).toBeNull();
  });
  it('rejects null payload', () =>
    expect(parseFreightOdSnapshot(null)).toBeNull());
});
