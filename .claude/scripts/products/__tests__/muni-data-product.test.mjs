import test from 'node:test';
import assert from 'node:assert/strict';
import {
  boundaryCodeMap,
  buildRows,
  compareBoundaryAreas,
  parseEstatValues,
  reconcile,
  splitAreaName,
  toCsv,
} from '../lib/muni-data-product.mjs';

const area = (cityCode, cityName, level = '2', prefCode = `${cityCode.slice(0, 2)}000`) => ({ cityCode, cityName, level, prefCode });
const source = (areaCode, yearCode, value) => ({ areaCode, yearCode, value });
const spec = (extra = {}) => ({ unit: '百万円', roundingTolerance: 2, ...extra });
const areas = [area('01100', '北海道 札幌市'), area('01202', '北海道 函館市')];

test('行政区の名前は市名ごと残し、都道府県だけを分ける', () => {
  assert.deepEqual(splitAreaName('北海道 札幌市 中央区'), { pref: '北海道', name: '札幌市 中央区' });
  assert.throws(() => splitAreaName('北海道'));
});

test('空の値は 0 にせず、空欄と行なしを別の注記で残す (0 は実値のまま)', () => {
  const rows = buildRows({
    cityRows: [source('01100', '2000', 0), source('01100', '2001', 5), source('01202', '2001', null)],
    areas,
    spec: spec(),
  });
  const find = (code, year) => rows.find((r) => r.code === code && r.year === year);
  assert.equal(rows.length, 4);
  assert.equal(find('01100', '2000').value, 0);
  assert.equal(find('01100', '2000').note, '');
  assert.equal(find('01202', '2001').value, null);
  assert.equal(find('01202', '2001').note, '元データ空欄 (記号未確認)');
  assert.equal(find('01202', '2000').note, '元データに行なし');
});

test('e-Stat の記号が取れていれば未確認の代わりに記号と意味を書く', () => {
  const { symbols, numbers } = parseEstatValues({
    values: [
      { '@area': '01202', '@time': '2001100000', $: 'X' },
      { '@area': '01100', '@time': '2001100000', $: '5' },
    ],
    notes: { '@char': 'X', $: '秘匿' },
    yearOf: (t) => t.slice(0, 4),
  });
  assert.equal(numbers.get('01100|2001'), 5);
  const rows = buildRows({ cityRows: [source('01202', '2001', null)], areas: [areas[1]], spec: spec(), symbols });
  assert.equal(rows[0].note, '元データ記号 X (秘匿)');
});

test('年の注記・行の注記は指定の範囲にだけ付く', () => {
  const rows = buildRows({
    cityRows: [source('01100', '2005', 1), source('01100', '2006', 1), source('01202', '2005', 1)],
    areas,
    spec: spec({ yearNotes: { 2006: '切替' }, rowNotes: [{ codes: ['01100'], toYear: 2005, note: '旧村を含まない' }] }),
  });
  const notes = Object.fromEntries(rows.map((r) => [`${r.code}${r.year}`, r.note]));
  assert.equal(notes['011002005'], '旧村を含まない');
  assert.equal(notes['011002006'], '切替');
  assert.equal(notes['012022005'], '');
});

const reconcileOf = (cityRows, prefValue, extra) => {
  const s = spec(extra);
  const rows = buildRows({ cityRows, areas, spec: s });
  return reconcile({ rows, prefRows: [{ areaCode: '01000', yearCode: '2000', value: prefValue }], spec: s });
};

test('差は丸め・空欄・未説明に分かれ、空欄がなければ大きな差を空欄のせいにしない', () => {
  const full = [source('01100', '2000', 10), source('01202', '2000', 20)];
  assert.equal(reconcileOf(full, 31).byPrefYear[0].kind, 'rounding');
  assert.equal(reconcileOf(full, 100).byPrefYear[0].kind, 'unexplained');
  const blank = [source('01100', '2000', 10), source('01202', '2000', null)];
  assert.equal(reconcileOf(blank, 100).byPrefYear[0].kind, 'blank');
  // 空欄があっても自治体の合計が県計を超えるなら説明がつかない
  assert.equal(reconcileOf(blank, 5).byPrefYear[0].kind, 'unexplained');
});

test('既知の不一致は実測の差が変わると未説明へ戻る', () => {
  const full = [source('01100', '2000', 10), source('01202', '2000', 20)];
  const issue = (expectPrefDiff) => ({ knownIssues: [{ code: '01100', year: 2000, expectPrefDiff, note: 'x' }] });
  assert.equal(reconcileOf(full, 25, issue(-5)).byPrefYear[0].kind, 'source-inconsistency');
  assert.equal(reconcileOf(full, 26, issue(-5)).byPrefYear[0].kind, 'unexplained');
});

test('全国の集計は県の値と自治体の値の合計を別々に足す', () => {
  const r = reconcileOf([source('01100', '2000', 10), source('01202', '2000', null)], 100);
  assert.deepEqual(
    { p: r.byYear[0].prefTotal, m: r.byYear[0].muniTotal, d: r.byYear[0].diff, b: r.byYear[0].blanks },
    { p: 100, m: 10, d: 90, b: 1 },
  );
});

test('BOM は指定したときだけ先頭に付き、カンマを含む値は囲む', () => {
  assert.equal(toCsv(['a'], [['x,y']]), 'a\r\n"x,y"\r\n');
  assert.equal(toCsv(['a'], [[null]], { bom: true }).charCodeAt(0), 0xfeff);
});

test('境界のコード突合は区を親へ送り、旧コードと届かない自治体を洗い出す', () => {
  const master = [
    area('13100', '東京都 特別区部'),
    area('13101', '東京都 千代田区', '3', '13100'),
    area('22130', '静岡県 浜松市'),
    area('22138', '静岡県 浜松市 中央区', '3', '22130'),
    area('47382', '沖縄県 与那国町'),
  ];
  assert.equal(boundaryCodeMap(master).get('13101'), '13100');
  const census = [
    { code: '13101', name: '千代田区' },
    { code: '22131', name: '浜松市中区' },
    { code: '99999', name: '架空村' },
  ];
  const r = compareBoundaryAreas({ census, areas: master, overrides: { 22131: '22130' } });
  assert.deepEqual(r.unmapped.map((c) => c.code), ['99999']);
  assert.deepEqual(r.notReached, ['47382']);
  assert.deepEqual(r.remapped, [{ code: '22131', name: '浜松市中区', to: '22130' }]);
});
