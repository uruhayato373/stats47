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
  }, 30_000); // 10 万件の総当たり。CI では既定の 5 秒を超えることがある (2026-11-17 に 5,158ms で落ちた)
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
  const zero = { prefCheck: 0, cityCheck: 0, yearCheck: 0, prefectureNames: 0, prefSlice: 0, pref5Build: 0, prefRegex: 0, nationalLiteral: 0, pref2Compare: 0, prefCount47: 0, prefArrayGen: 0, topoPrefCode: 0 };
  const counts = (text: string) => checker.literalCounts(text);

  it('finds definitions and official/short-name arrays, but not comments or imports', () => {
    expect(counts('function isPrefCode5(x) {} const isCityCode5 = x => true; function to4(x) {}')).toEqual({ ...zero, prefCheck: 1, cityCheck: 1, yearCheck: 1 });
    expect(counts('// function to4(x) {}\nimport { isPrefCode5 } from "x";').prefCheck).toBe(0);
    for (const values of [nodeArea.PREF_NAMES, nodeArea.PREF_NAMES.map((n: string) => n.replace(/[都府県]$/, ''))]) {
      expect(counts(`const names = ${JSON.stringify(values)};`).prefectureNames).toBe(1);
    }
  });

  describe('fires on each hand-written way to handle area codes', () => {
    const violations: Array<[string, string, string]> = [
      ['prefSlice', 'slice', 'const pref = areaCode.slice(0, 2);'],
      ['prefSlice', 'substring', 'const pref = cityCode.substring(0, 2);'],
      ['pref5Build', 'template', 'const areaCode = `${pref}000`;'],
      ['pref5Build', 'concat', 'const areaCode = pref + "000";'],
      ['pref5Build', 'padStart 5', 'const areaCode = String(n).padStart(5, "0");'],
      ['pref5Build', 'padStart 2', 'const prefCode = String(i + 1).padStart(2, "0");'],
      ['prefRegex', 'regex literal', 'const ok = /^\\d{2}000$/.test(areaCode);'],
      ['prefRegex', 'pref range regex', 'const ok = /^(0[1-9]|[1-3][0-9]|4[0-7])000$/.test(areaCode);'],
      ['prefRegex', 'new RegExp', 'const re = new RegExp("^\\\\d{2}000$");'],
      ['prefRegex', 'endsWith', 'const isPref = areaCode.endsWith("000");'],
      ['nationalLiteral', 'string', 'const national = "00000";'],
      ['nationalLiteral', 'compare', "if (row.areaCode === '00000') skip();"],
      ['pref2Compare', 'equality', 'if (prefCode === "13") return 1;'],
      ['pref2Compare', 'startsWith', 'const okinawa = areaCode.startsWith("47");'],
      ['prefCount47', 'length compare', 'if (rows.length !== 47) throw new Error("x");'],
      ['prefCount47', 'constant', 'const PREFECTURE_COUNT = 47;'],
      ['prefArrayGen', 'Array.from', 'const rows = Array.from({ length: 47 }, (_, i) => i);'],
      ['topoPrefCode', 'property', 'const code = feature.properties.N03_007;'],
      ['topoPrefCode', 'string key', 'const code = props["N03_007"];'],
    ];
    for (const [key, label, text] of violations) {
      it(`${key}: ${label}`, () => {
        expect(counts(text)[key]).toBe(1);
      });
    }
    it('counts a repeated form once per occurrence and ignores comments', () => {
      expect(counts('const a = x.areaCode.slice(0, 2);\nconst b = y.areaCode.slice(0, 2);')).toEqual({ ...zero, prefSlice: 2 });
      expect(counts('// const a = areaCode.slice(0, 2);\n/* "00000" */ const b = 1;')).toEqual(zero);
    });
  });

  describe('does not fire on the canonical way or on look-alikes', () => {
    const clean: Array<[string, string]> = [
      ['calls the canonical helpers', 'import { to2DigitPrefCode, isPrefectureAreaCode, NATIONAL_AREA_CODE, PREFECTURE_COUNT } from "@stats47/area/area-code";\nconst pref = to2DigitPrefCode(areaCode);\nif (isPrefectureAreaCode(code) && code !== NATIONAL_AREA_CODE && rows.length === PREFECTURE_COUNT) keep();'],
      ['mesh code slice', 'const prefix = meshCode.slice(0, 2);'],
      ['mesh code padStart', 'const meshCode = String(row).padStart(5, "0");'],
      ['mesh code zeros', 'const meshCode = "00000";'],
      ['month regex', 'const ok = /^\\d{4}-(0[1-9]|1[0-2])$/.test(period);'],
      ['month slice', 'const month = date.slice(0, 2);'],
      ['month padStart', 'const month = String(m).padStart(2, "0");'],
      ['version number', 'const latestVersion = String(n).padStart(5, "0");'],
      ['version compare', 'if (latestVersion === 47) update();'],
      ['specific prefecture default code', 'const DEFAULT_AREA_CODE = "13000";'],
      ['specific prefecture default in a call', 'load({ areaCode: "13000", year });'],
      ['other length', 'if (rows.length !== 48) throw new Error("x");'],
      ['non-area slice', 'const head = title.slice(0, 2);'],
      ['non-area 2-digit compare', 'if (hour === "13") return;'],
      ['strings that only mention the forms', 'const note = "areaCode.slice(0, 2) / 00000 / N03_007";'],
    ];
    for (const [label, text] of clean) {
      it(label, () => {
        expect(counts(text)).toEqual(zero);
      });
    }
  });

  it('rejects new copies and growing or stale baselines', () => {
    const file = { path: 'packages/example.ts', text: 'function to4(x) { return x; }' };
    const rule = { ...zero, yearCheck: 1, reason: 'fixture' };
    expect(checker.auditSources([file], {}, undefined)).not.toEqual([]);
    expect(checker.auditSources([file], { [file.path]: rule }, {})).not.toEqual([]);
    expect(checker.auditSources([file], { [file.path]: rule }, { [file.path]: rule })).toEqual([]);
    expect(checker.auditSources([], { [file.path]: rule }, undefined)).not.toEqual([]);
  });

  describe('baseline is shrink-only for the new kinds too', () => {
    const path = 'apps/example/src/a.ts';
    const two = { path, text: 'const a = areaCode.slice(0, 2);\nconst b = cityCode.slice(0, 2);' };
    const one = { path, text: 'const a = areaCode.slice(0, 2);' };
    const rule = (n: number) => ({ ...zero, prefSlice: n, reason: 'fixture' });

    it('passes when the code matches the baseline', () => {
      expect(checker.auditSources([two], { [path]: rule(2) }, undefined)).toEqual([]);
    });
    it('fails when the code adds an occurrence beyond the baseline', () => {
      expect(checker.auditSources([two], { [path]: rule(1) }, undefined)).not.toEqual([]);
    });
    it('fails when a new file introduces a kind with no baseline entry', () => {
      expect(checker.auditSources([two], {}, undefined)).not.toEqual([]);
    });
    it('fails when the baseline count grows against the previous baseline', () => {
      expect(checker.auditSources([two], { [path]: rule(2) }, { [path]: rule(1) }).join('\n')).toContain('allowlist may only shrink');
    });
    it('passes when the baseline shrinks along with the code', () => {
      expect(checker.auditSources([one], { [path]: rule(1) }, { [path]: rule(2) })).toEqual([]);
    });
    it('fails on a stale baseline once the code shrank (the baseline must be reduced too)', () => {
      expect(checker.auditSources([one], { [path]: rule(2) }, undefined).join('\n')).toContain('shrink stale');
    });
    it('compares a version-1 previous baseline only on the kinds it had', () => {
      // 版 1 に載っていなかったファイルの新しい種類の件数は、版を上げる 1 回だけの橋渡しとして許す
      expect(checker.auditSources([two], { [path]: rule(2) }, {}, 1)).toEqual([]);
      // 版 1 の種類が増えるのは許さない
      const grown = { path: 'apps/example/src/b.ts', text: 'function to4(x) { return x; }' };
      expect(checker.auditSources([grown], { [grown.path]: { ...zero, yearCheck: 1, reason: 'fixture' } }, {}, 1)).not.toEqual([]);
    });
  });
});
