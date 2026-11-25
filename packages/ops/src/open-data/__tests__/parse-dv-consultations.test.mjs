import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { parseDvConsultations } from '../lib/parse-dv-consultations.mjs';

// 内閣府男女共同参画局「配偶者暴力相談支援センターにおける相談件数等」(取得 2026-11-25) の
// 「（３）都道府県別相談件数」を pdftotext -layout にかけた節だけを写した fixture。
const fixture = (year) => fs.readFileSync(new URL(`./fixtures/dv-consultations-${year}.txt`, import.meta.url), 'utf8');
const NATIONAL = { 2022: [309, 122211], 2023: [313, 126743], 2024: [317, 127796] };

for (const year of [2022, 2023, 2024]) {
  test(`${year}: 47 県と全国が取れ、県の和が全国の公表値と一致する`, () => {
    const r = parseDvConsultations(fixture(year), { fiscalYear: year });
    assert.equal(r.fiscalYear, year);
    assert.equal(r.prefectures.length, 47);
    assert.deepEqual([r.national.centers, r.national.total], NATIONAL[year]);
    assert.equal(r.prefectures.reduce((s, p) => s + p.centers, 0), NATIONAL[year][0]);
    assert.equal(r.prefectures.reduce((s, p) => s + p.consultations, 0), NATIONAL[year][1]);
  });
}

test('2024: 個別の行を PDF の値と突き合わせる (県名の空白・北海道・桁区切り)', () => {
  const r = parseDvConsultations(fixture(2024));
  const by = Object.fromEntries(r.prefectures.map((p) => [p.prefName, p]));
  assert.equal(r.prefectures[0].prefName, '北海道');
  assert.equal(r.prefectures[46].prefName, '沖縄県');
  assert.deepEqual([by['東京都'].centers, by['東京都'].consultations], [22, 24305]);
  assert.deepEqual([by['鹿児島県'].centers, by['鹿児島県'].consultations], [19, 2431]);
  assert.equal(by['神奈川県'].values.perCenter, 1126.6);
  assert.equal(by['埼玉県'].values.otherSex, 53);
});

test('壊した入力: 県の値を 1 つ変えると和が合わず落ちる', () => {
  const broken = fixture(2024).replace('1,679      475     1,106       98     1,679     1,652', '1,680      475     1,106       98     1,680     1,652');
  assert.notEqual(broken, fixture(2024));
  assert.throws(() => parseDvConsultations(broken), /総数|和/);
});

test('壊した入力: 内訳の和が崩れた行で落ちる', () => {
  const broken = fixture(2024).replace('2,864    1,069     1,757', '2,864    1,070     1,757');
  assert.throws(() => parseDvConsultations(broken), /北海道: 来所 \+ 電話 \+ その他 != 総数/);
});

test('壊した入力: 県の行が欠けると落ちる', () => {
  const broken = fixture(2024).split('\n').filter((l) => !l.startsWith('沖 縄')).join('\n');
  assert.throws(() => parseDvConsultations(broken), /県数 46 != 47/);
});

test('壊した入力: 県の重複と節の欠落で落ちる', () => {
  const lines = fixture(2024).split('\n');
  const dup = [...lines, lines.find((l) => l.startsWith('青 森'))].join('\n');
  assert.throws(() => parseDvConsultations(dup), /県の重複: 青森県/);
  assert.throws(() => parseDvConsultations('関係ない文書'), /節が見つかりません/);
});

test('壊した入力: 1 センター当たりが総数 / 施設数と合わないと落ちる', () => {
  const broken = fixture(2024).replace('136.4', '236.4');
  assert.throws(() => parseDvConsultations(broken), /北海道: 1 センター当たり/);
});
