import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { extractRoadMaintenance, ROAD_MAINTENANCE_SOURCES } from '../ingest-road-maintenance.mjs';

const prefectures = createRequire(import.meta.url)('../../../../packages/area/src/data/prefectures.json');
function fixture(facility = 'bridge') {
  const source = ROAD_MAINTENANCE_SOURCES.find((row) => row.facility === facility);
  const rows = prefectures.map((pref, index) => {
    const grades = source.national.slice(1).map((total) => Math.floor(total / 47) + Number(index < total % 47));
    return `${pref.prefName} ${grades.reduce((sum, value) => sum + value, 0)} ${grades.join(' ')}`;
  }).reverse();
  return [`全${source.name}2 全道路管理者分 2026年3月31日時点 所在する 都道府県 判定区分 Ⅰ Ⅱ Ⅲ Ⅳ 2014～25年度`, ...rows, `合計 ${source.national.join(' ')}`].join('\n');
}
test('施設所在地で47県を識別し、診断済母数と区分の保存則を守る', () => {
  for (const facility of ['bridge', 'tunnel']) {
    const data = extractRoadMaintenance(fixture(facility), facility);
    assert.equal(data.rows.length, 47);
    assert.equal(data.rows[0].areaCode, '01000');
    assert.equal(data.rows[46].areaCode, '47000');
    assert.equal(data.rows[0].values[0], data.rows[0].values.slice(1).reduce((sum, value) => sum + value, 0));
  }
});
test('最新診断に3巡目だけの点検母数・異時点・欠県を混ぜない', () => {
  assert.throws(() => extractRoadMaintenance(fixture().replace('2014～25年度', '2024～25年度'), 'bridge'));
  assert.throws(() => extractRoadMaintenance(fixture().replace('2026年3月31日', '2025年3月31日'), 'bridge'));
  assert.throws(() => extractRoadMaintenance(fixture().replace(/^北海道.*\n/m, ''), 'bridge'), /Missing prefecture/);
  assert.throws(() => extractRoadMaintenance(fixture().replace('725525', '725524'), 'bridge'));
});
