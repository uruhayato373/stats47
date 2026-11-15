import { createRequire } from 'node:module';
import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { isCityAreaCode, isPrefectureAreaCode } from '../index';
import { extractYearCode } from '../../../estat-api/src/stats-data/utils/extract-year-code';

const require = createRequire(import.meta.url);
const nodeArea = require('../../../../.claude/scripts/lib/prefectures.cjs');
const nodeYear = require('../../../../.claude/scripts/lib/year-code.mjs');

describe('area entrypoints', () => {
  it('preserves the previous predicates for every five-digit code', () => {
    for (let n = 0; n < 100000; n++) {
      const code = String(n).padStart(5, '0');
      const pref = Number(code.slice(0, 2));
      const validPref = pref >= 1 && pref <= 47;
      expect(isPrefectureAreaCode(code)).toBe(validPref && code.endsWith('000'));
      expect(isCityAreaCode(code)).toBe(validPref && !code.endsWith('000'));
      expect(nodeArea.isPrefectureAreaCode(code)).toBe(isPrefectureAreaCode(code));
      expect(nodeArea.isCityAreaCode(code)).toBe(isCityAreaCode(code));
    }
  });
  it('rejects malformed lengths, nondigits, national and out-of-range prefixes', () => {
    for (const code of ['', '01', '1000', '010000', '0100x', '00000', '00999', '48000', '48999']) {
      expect(isPrefectureAreaCode(code)).toBe(false);
      expect(isCityAreaCode(code)).toBe(false);
    }
  });
  it('has plain-node parity for every code in every area master', () => {
    const directory = new URL('../../../../data/areas/master/', import.meta.url);
    let codes = 0;
    function visit(value: unknown): void {
      if (typeof value === 'string' && /^\d{5}$/.test(value)) {
        codes++;
        expect(nodeArea.isPrefectureAreaCode(value)).toBe(isPrefectureAreaCode(value));
        expect(nodeArea.isCityAreaCode(value)).toBe(isCityAreaCode(value));
      } else if (Array.isArray(value)) value.forEach(visit);
      else if (value && typeof value === 'object') Object.values(value).forEach(visit);
    }
    for (const name of readdirSync(directory).filter((name) => name.endsWith('.json'))) {
      visit(JSON.parse(readFileSync(new URL(name, directory), 'utf8')));
    }
    expect(codes).toBeGreaterThan(47);
  });
});

describe('year mirror and previous-implementation boundaries', () => {
  it('matches the canonical API, including malformed and short input', () => {
    for (const value of ['', '2', '202', '2024', '2024100000', '2024000101', 'abcd000000', '20x4000000', '令和六年', '9999999999']) {
      expect(nodeYear.extractYearCode(value)).toBe(extractYearCode(value));
      const guarded = /^\d{4}/.test(value) ? extractYearCode(value) : value.slice(0, 4);
      expect(guarded).toBe(value.slice(0, 4));
    }
  });
  it('preserves numeric year-spec coercion, including non-year numbers', () => {
    for (const n of [2024, 2009100000, 9999, 10000, 0, -2009100000, 2024.5, 1e21, NaN, Infinity]) {
      const old = n > 9999 ? Number(String(n).slice(0, 4)) : n;
      const current = n > 9999 ? Number(/^\d{4}/.test(String(n)) ? extractYearCode(String(n)) : String(n).slice(0, 4)) : n;
      expect(current).toBe(old);
    }
  });
});

describe('entrypoint checker', () => {
  const checker = require('../../scripts/check-area-year-entrypoint.mjs');
  it('finds definitions and official/short-name arrays, but not comments or imports', () => {
    expect(checker.literalCounts('function isPrefCode5(x) {} const isCityCode5 = x => true; function to4(x) {}')).toEqual({ prefCheck: 1, cityCheck: 1, yearCheck: 1, prefectureNames: 0 });
    expect(checker.literalCounts('// function to4(x) {}\nimport { isPrefCode5 } from "x";').prefCheck).toBe(0);
    for (const values of [nodeArea.PREF_NAMES, nodeArea.PREF_NAMES.map((n: string) => n.replace(/[都府県]$/, ''))]) {
      expect(checker.literalCounts(`const names = ${JSON.stringify(values)};`).prefectureNames).toBe(1);
    }
  });
  it('rejects new copies and growing or stale baselines', () => {
    const file = { path: 'packages/example.ts', text: 'function to4(x) { return x; }' };
    const rule = { prefCheck: 0, cityCheck: 0, yearCheck: 1, prefectureNames: 0, reason: 'fixture' };
    expect(checker.auditSources([file], {}, undefined)).not.toEqual([]);
    expect(checker.auditSources([file], { [file.path]: rule }, {})).not.toEqual([]);
    expect(checker.auditSources([file], { [file.path]: rule }, { [file.path]: rule })).toEqual([]);
    expect(checker.auditSources([], { [file.path]: rule }, undefined)).not.toEqual([]);
  });
});
