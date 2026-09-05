import { createHash } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import { roadsideStationCount } from '../../../../data-configs/src/metrics/roadside-station-count';
import { fishingPortCountKsj } from '../../../../data-configs/src/metrics/fishing-port-count-ksj';
import { GIS_DATASETS } from '../../mlit-ksj/datasets';
import {
  PREF_CODES,
  PREF_NAME_BY_CODE,
} from '../../mlit-ksj/prefecture-assign';
import { buildStatsPayload } from '../../mlit-ksj/ksj-stats-core';
import {
  ZERO_PORT_CODES,
  parsePortText,
  parseStationRows,
  readSharedStrings,
  verifyCounts,
  verifySourceSha,
} from '../parse';

const stationRows = () => [
  ['県名', '駅 名', '登録回', '登録年月', '所在地'],
  ...PREF_CODES.map((code) => [
    PREF_NAME_BY_CODE[code],
    `駅${code}`,
    '第1回',
    'H5.4',
    '町',
  ]),
];
const portCodes = PREF_CODES.filter(
  (code) => !ZERO_PORT_CODES.some((zero) => zero === code)
);
const portRow = '1 1 - - - - - - - - - - 1 1 -';
const portFixture = () =>
  [
    '都道府県別漁港管理者別漁港数一覧 (令和８年４月１日現在)',
    ...portCodes.map((code) => `${PREF_NAME_BY_CODE[code]} ${portRow}`),
    '40 40 - - - - - - - - - - 40 40 -',
  ].join('\n');

describe('official commercial count extraction (no network / no observations in git)', () => {
  it('does not append XLSX phonetic guides to displayed station names', () => {
    expect(
      readSharedStrings(
        '<sst><si><t>県名</t><rPh><t>ケンメイ</t></rPh></si><si><r><t>駅</t></r><r><t>名</t></r></si></sst>'
      )
    ).toEqual(['県名', '駅名']);
  });
  it('counts exact station rows, with 47 prefectures and no inferred zeros', () => {
    expect(parseStationRows(stationRows(), 47).size).toBe(47);
    const fullWidth = stationRows();
    fullWidth[1][3] = 'Ｈ27.11';
    expect(parseStationRows(fullWidth, 47).size).toBe(47);
    expect(() => parseStationRows(stationRows().slice(0, -1), 47)).toThrow();
    expect(() =>
      parseStationRows([...stationRows(), stationRows()[1]], 48)
    ).toThrow(/Duplicate/);
    const wrong = stationRows();
    wrong[1][0] = '北海道電力';
    expect(() => parseStationRows(wrong, 47)).toThrow(/Invalid/);
  });
  it('rejects station header, column and national-total drift', () => {
    const wrong = stationRows();
    wrong[0][0] = '地域';
    expect(() => parseStationRows(wrong, 47)).toThrow(/header/);
    const empty = stationRows();
    empty[1][4] = '';
    expect(() => parseStationRows(empty, 47)).toThrow(/Incomplete/);
    expect(() => parseStationRows(stationRows(), 48)).toThrow(/National/);
  });
  it('uses the port total column, preserves Shiga and adds exactly seven zeros', () => {
    const counts = parsePortText(portFixture(), 40);
    expect(counts.get('25')).toBe(1);
    expect(
      [...counts].filter(([, n]) => n === 0).map(([code]) => code)
    ).toEqual(ZERO_PORT_CODES);
    expect(counts.size).toBe(47);
  });
  it('rejects missing/duplicate port prefectures, shifted columns and wrong date', () => {
    expect(() =>
      parsePortText(portFixture().replace(`滋賀県 ${portRow}\n`, ''), 40)
    ).toThrow();
    expect(() =>
      parsePortText(portFixture() + `\n北海道 ${portRow}`, 40)
    ).toThrow(/Duplicate/);
    expect(() =>
      parsePortText(
        portFixture().replace(`北海道 ${portRow}`, '北海道 1 1 -'),
        40
      )
    ).toThrow(/columns/);
    expect(() =>
      parsePortText(portFixture().replace('令和８年', '令和７年'), 40)
    ).toThrow(/date/);
  });
  it('catches within-row mutations and nationwide sum drift', () => {
    expect(() =>
      parsePortText(
        portFixture().replace(
          `北海道 ${portRow}`,
          `北海道 2 ${portRow.slice(2)}`
        ),
        40
      )
    ).toThrow(/subtotal/);
    expect(() =>
      parsePortText(portFixture().replace('40 40 -', '41 41 -'), 40)
    ).toThrow();
    expect(() => parsePortText(portFixture(), 41)).toThrow(/national/);
  });
  it('never accepts unreviewed source revisions', () => {
    const bytes = Buffer.from('synthetic fixture');
    const hash = createHash('sha256').update(bytes).digest('hex');
    expect(verifySourceSha(bytes, hash)).toBe(hash);
    expect(() => verifySourceSha(Buffer.from('changed'), hash)).toThrow(/SHA/);
  });
  it('rejects negative, unknown, missing and unexpected-zero counts before payload generation', () => {
    const good = parseStationRows(stationRows(), 47);
    for (const mutation of [
      new Map(good).set('01', -1),
      new Map(good).set('01', 0),
      new Map(good).set('48', 1),
    ]) {
      expect(() => verifyCounts(mutation, 47, [])).toThrow();
    }
    const payload = buildStatsPayload({
      metricKey: roadsideStationCount.key,
      unit: 'か所',
      yearCode: '2026',
      countsByPref: good,
      generatedAt: '2026-09-05T00:00:00Z',
    });
    expect(new Set(payload.rows.map((row) => row.yearCode))).toEqual(
      new Set(['2026'])
    );
    expect(payload.rows.every((row) => row.rank === 1)).toBe(true);
  });
  it('pins manual sources and removes both obsolete KSJ producer mappings', () => {
    for (const config of [roadsideStationCount, fishingPortCountKsj]) {
      expect(config.source.kind).toBe('external');
      if (config.source.kind !== 'external')
        throw new Error('external source required');
      expect(config.source.fetcherKey).toBe('manual');
      expect(config.source.config).not.toHaveProperty('ksjDataId');
      expect(config.years).toEqual({ from: 2026, to: 2026 });
      expect(
        GIS_DATASETS.flatMap((ds) => ds.rankingConfig ?? []).some(
          (rc) => rc.rankingKey === config.key
        )
      ).toBe(false);
    }
    for (const id of ['P35', 'C09'])
      expect(GIS_DATASETS.find((ds) => ds.dataId === id)?.isRankingTarget).toBe(
        false
      );
  });
});
