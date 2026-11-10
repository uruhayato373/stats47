import test from 'node:test';
import assert from 'node:assert/strict';
import { buildIndustryRows, industryCatalog, industryCheck, industryRowCells } from '../lib/muni-industry-product.mjs';
import { findItem, parseAreaIndustry, unitOf } from '../fetch-estat-muni-industry.mjs';

const area = (cityCode, cityName, level = '2', prefCode = `${cityCode.slice(0, 2)}000`) => ({ cityCode, cityName, level, prefCode });
const row = (area, year, industry, industryName, value) => ({ year, area, areaName: '', industry, industryName, value });
const table = (rows, unit = '万円') => ({ unit, rows });
const toyota = [
  row('23211', 2023, '00', '製造業計', '1000'),
  row('23211', 2023, '09', '食料品製造業', '100'),
  row('23211', 2023, '31', '輸送用機械器具製造業', '850'),
];

test('地域編の名前を年・自治体・業種に分け、都道府県は NN000・全国は 00000 にそろえる', () => {
  assert.deepEqual(parseAreaIndustry('2023000000_2023_23211_豊田市_15_印刷・同関連業'),
    { year: 2023, area: '23211', areaName: '豊田市', industry: '15', industryName: '印刷・同関連業' });
  assert.equal(parseAreaIndustry('2023000000_2023_23_愛知県_00_製造業計').area, '23000');
  assert.equal(parseAreaIndustry('2023000000_2023_00_全国計_00_製造業計').area, '00000');
  assert.equal(parseAreaIndustry('製造品出荷額等【万円】'), null);
  assert.equal(unitOf('製造品出荷額等【万円】'), '万円');
});

test('項目は完全一致を優先し、無ければその名前で始まる短い項目を選ぶ', () => {
  const axis = (names) => [{ '@id': 'cat01', CLASS: names.map((n, i) => ({ '@code': String(i), '@name': n })) }];
  assert.equal(findItem(axis(['事業所数', '製造品出荷額等【万円】', '製造品出荷額等_うち製造品【万円】']), '製造品出荷額等').name, '製造品出荷額等【万円】');
  assert.equal(findItem(axis(['製造品出荷額等【万円】', '製造品出荷額等']), '製造品出荷額等').name, '製造品出荷額等');
  assert.equal(findItem(axis(['事業所数']), '製造品出荷額等'), null);
});

test('値は元のまま、秘匿は 0 にせず記号で残し、無い業種も行として残す', () => {
  const tables = [table([...toyota, row('33202', 2023, '00', '製造業計', '500'), row('33202', 2023, '09', '食料品製造業', 'X'), row('33202', 2023, '31', '輸送用機械器具製造業', '300')])];
  const rows = buildIndustryRows({ tables, areas: [area('23211', '愛知県 豊田市'), area('33202', '岡山県 倉敷市'), area('01695', '北海道 色丹村')] });
  assert.equal(rows.length, 3 * 3);
  const find = (code, industry) => rows.find((r) => r.code === code && r.industry === industry);
  assert.equal(find('23211', '31').value, 850);
  assert.equal(find('23211', '31').unit, '万円');
  assert.deepEqual([find('33202', '09').value, find('33202', '09').note], [null, '元データ記号 X (秘匿)']);
  assert.deepEqual([find('01695', '00').value, find('01695', '00').note], [null, '元データに行なし']);
  assert.deepEqual(industryRowCells(find('23211', '09')), ['23211', '愛知県', '豊田市', 2023, '09', '食料品製造業', 100, '万円', '']);
});

test('政令市の業種の行は空欄にして区の別表へ案内し、製造業計の行は残す', () => {
  const tables = [table([row('27100', 2023, '00', '製造業計', '4000'), ...toyota])];
  const rows = buildIndustryRows({ tables, areas: [area('27100', '大阪府 大阪市')], designated: new Set(['27100']) });
  assert.equal(rows.find((r) => r.industry === '00').value, 4000);
  assert.match(rows.find((r) => r.industry === '31').note, /区の別表を参照/);
});

test('表で単位や業種名が食い違う、同じ組み合わせが 2 行ある入力は止める', () => {
  assert.throws(() => buildIndustryRows({ tables: [table(toyota), table([row('23211', 2022, '00', '製造業計', '1')], '百万円')], areas: [] }));
  assert.throws(() => industryCatalog([table(toyota), table([row('23211', 2022, '09', '食料品', '1'), row('23211', 2022, '00', '製造業計', '1')])]));
  assert.throws(() => buildIndustryRows({ tables: [table([...toyota, toyota[1]])], areas: [] }));
});

test('検算は製造業計と公表された業種の和の差を出し、本体の値 (百万円) と丸めを許して照らす', () => {
  const tables = [table([...toyota, row('33202', 2023, '00', '製造業計', '50000'), row('33202', 2023, '09', '食料品製造業', 'X'), row('33202', 2023, '31', '輸送用機械器具製造業', '30000')])];
  const rows = buildIndustryRows({ tables, areas: [area('23211', '愛知県 豊田市'), area('33202', '岡山県 倉敷市')] });
  const { checks, summary } = industryCheck({ rows, scale: 100, mainRows: [{ code: '23211', year: '2023', value: 10 }, { code: '33202', year: '2023', value: 501 }] });
  const kurashiki = checks.find((c) => c.code === '33202');
  assert.deepEqual([kurashiki.total, kurashiki.published, kurashiki.unpublished, kurashiki.hiddenIndustries], [50000, 30000, 20000, 1]);
  assert.equal(checks.find((c) => c.code === '23211').unpublished, 50);
  assert.equal(summary.matchesMain, 1);
  assert.deepEqual(summary.mismatches.map((m) => [m.code, m.mainDiff]), [['33202', -1]]);
});
