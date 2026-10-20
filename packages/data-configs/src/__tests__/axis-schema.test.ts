import { describe, expect, it } from 'vitest';
import Ajv from 'ajv';
import { generateTypeSchemas } from '../../scripts/metric-schema';
import { isYAxisConfig } from '@stats47/types';

describe('axis serialization contract', () => {
  it('keeps fixed bounds mandatory and disallows bounds on auto/sync in both validators', () => {
    const schema = generateTypeSchemas('packages/types/src/numeric-domain.ts', [
      'YAxisConfig',
    ]).YAxisConfig;
    const validate = new Ajv().compile(schema);
    for (const [value, valid] of [
      [{ mode: 'fixed', domain: [-10, 50] }, true],
      [{ mode: 'fixed' }, false],
      [{ mode: 'auto' }, true],
      [{ mode: 'sync' }, true],
      [{ mode: 'auto', domain: [0, 100] }, false],
      [{ mode: 'sync', domain: [0, 100] }, false],
      [{ mode: 'fixed', domain: [0] }, false],
    ] as const) {
      expect(validate(value)).toBe(valid);
      expect(isYAxisConfig(value)).toBe(valid);
    }
  }, 60000);
});
