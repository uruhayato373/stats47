import assert from 'node:assert/strict';

import { fetchPrefectures } from '@stats47/area';
import { TOURISM_SEASONALITY_SOURCE } from '@stats47/data-configs/theme-catalog';
import { it as test } from 'vitest';

import { parseTourismSeasonalitySnapshot } from '../tourism-seasonality-snapshot';

const PREFECTURES = fetchPrefectures();
const periods = Array.from({ length: 12 }, (_, index) => `2024-${String(index + 1).padStart(2, '0')}`);
const source = {
  schemaVersion: 1, seriesKey: 'tourism-seasonality', year: '2024', unit: '人泊',
  releaseStatus: 'final', generatedAt: '2026-09-10T00:00:00.000Z', source: { ...TOURISM_SEASONALITY_SOURCE.source } as { title: string; url: string; sha256: string },
  rows: periods.flatMap((period) => PREFECTURES.map((pref) => ({
    areaCode: pref.prefCode, areaName: pref.prefName, period, value: 10 as number | null,
    missingReason: undefined as string | undefined,
  }))),
  national: periods.map((period) => ({ period, value: 1000 })) as { period: string; value: number }[] | null,
};
const copy = () => structuredClone(source);

test('fixture provides 47 prefectures and the separate official national series',()=>{
 const result=parseTourismSeasonalitySnapshot(source);
 assert.ok(result);assert.equal(result.rows.length,564);assert.equal(result.national!.length,12);
 assert.equal(result.rows[0].period,'2024-01');assert.equal(result.unit,'人泊');
});
test('a numerical zero remains an observed zero',()=>{
 const data=copy();data.rows[0].value=0;
 assert.equal(parseTourismSeasonalitySnapshot(data)?.rows[0].value,0);
});
test('an absent national series remains absent and is not replaced by prefecture averages',()=>{
 const data=copy();data.national=null;
 assert.equal(parseTourismSeasonalitySnapshot(data)?.national,null);
});
test('null requires an explicit missing reason; an observed value cannot carry a missing reason',()=>{
 const data=copy();data.rows[0].value=null;
 assert.equal(parseTourismSeasonalitySnapshot(data),null);
 data.rows[0].missingReason='原表で非公表';
 assert.equal(parseTourismSeasonalitySnapshot(data)?.rows[0].value,null);
 data.rows[0].value=0;
 assert.equal(parseTourismSeasonalitySnapshot(data),null);
});
test('duplicated or removed prefecture-months are rejected',()=>{
 const data=copy();data.rows[0]=data.rows[1];assert.equal(parseTourismSeasonalitySnapshot(data),null);
 const removed=copy();removed.rows.pop();assert.equal(parseTourismSeasonalitySnapshot(removed),null);
});
test('wrong area identity or yearly/monthly scope is rejected',()=>{
 for(const changed of [{areaCode:'00000'},{areaName:'東京都'},{period:'2025-01'},{period:'2024'}]){
  const data=copy();Object.assign(data.rows[0],changed);assert.equal(parseTourismSeasonalitySnapshot(data),null);
 }
});
test('national month duplicates and a different source hash are rejected',()=>{
 const data=copy();data.national![0]=data.national![1];assert.equal(parseTourismSeasonalitySnapshot(data),null);
 const stale=copy();stale.source.sha256='0'.repeat(64);assert.equal(parseTourismSeasonalitySnapshot(stale),null);
});
