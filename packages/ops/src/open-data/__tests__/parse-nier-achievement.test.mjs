import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { diffFromNational, parseNierAchievement } from '../lib/parse-nier-achievement.mjs';

// 国立教育政策研究所「全国学力・学習状況調査 実施概況 全国－都道府県（公立）」(取得 2026-11-25) の 1 ページ目を
// pdftotext -layout にかけ、タイトル・見出し・表の行だけを残して各教科の平均正答率の列より右を切った fixture。
const fixture = (name) => fs.readFileSync(new URL(`./fixtures/nier-achievement-${name}.txt`, import.meta.url), 'utf8');

// 公式の「全国（公立）」行の値 (出典 PDF の同じ行)
const NATIONAL_PUBLIC = {
  '2022-elementary': { subjects: ['国語', '算数', '理科'], rates: [65.6, 63.2, 63.3] },
  '2022-junior-high': { subjects: ['国語', '数学', '理科'], rates: [69.0, 51.4, 49.3] },
  '2023-elementary': { subjects: ['国語', '算数'], rates: [67.2, 62.5] },
  '2023-junior-high': { subjects: ['国語', '数学', '英語'], rates: [69.8, 51.0, 45.6] },
  '2024-elementary': { subjects: ['国語', '算数'], rates: [67.7, 63.4] },
  '2024-junior-high': { subjects: ['国語', '数学'], rates: [58.1, 52.5] },
};

for (const [name, want] of Object.entries(NATIONAL_PUBLIC)) {
  test(`${name}: 47 県と全国（公立）が取れ、教科は見出しどおり`, () => {
    const r = parseNierAchievement(fixture(name));
    assert.equal(r.fiscalYear, Number(name.slice(0, 4)));
    assert.equal(r.schoolLevel, name.slice(5));
    assert.deepEqual(r.subjects, want.subjects);
    assert.deepEqual(want.subjects.map((s) => r.national.public[s]), want.rates);
    assert.equal(r.prefectures.length, 47);
    assert.equal(r.prefectures[0].prefName, '北海道');
    assert.equal(r.prefectures[46].prefName, '沖縄県');
    for (const p of r.prefectures) for (const s of want.subjects) assert.ok(Number.isInteger(p.rates[s]), `${p.prefName} ${s} は公表どおり整数`);
  });
}

test('2024 小学校: 個別の県の値を PDF と突き合わせる', () => {
  const r = parseNierAchievement(fixture('2024-elementary'));
  const by = Object.fromEntries(r.prefectures.map((p) => [p.prefName, p]));
  assert.deepEqual(by['北海道'].rates, { 国語: 67, 算数: 61 });
  assert.deepEqual(by['沖縄県'].rates, { 国語: 66, 算数: 58 });
  assert.equal(by['北海道'].students['国語'], 34531);
});

test('年によって教科の構成が違う (年をまたぐ水準比較をしない根拠の一つ)。年ごとの比較は全国（公立）との差で行う', () => {
  const subjectSets = ['2022-junior-high', '2023-junior-high', '2024-junior-high'].map((n) => parseNierAchievement(fixture(n)).subjects.join('・'));
  assert.equal(new Set(subjectSets).size, 3);
  const r = parseNierAchievement(fixture('2024-elementary'));
  const diffs = Object.fromEntries(diffFromNational(r, '国語').map((d) => [d.prefName, d.diff]));
  assert.equal(diffs['北海道'], -0.7);
  assert.equal(diffs['沖縄県'], -1.7);
  assert.throws(() => diffFromNational(r, '理科'), /教科 理科 がありません/);
});

test('壊した入力: 県の値を 1 つ大きく変えると全国との加重平均が合わず落ちる', () => {
  const text = fixture('2024-elementary');
  const broken = text.replace(/(^北海道.*?9\.3 \()\s*67 \)/m, '$1 97 )');
  assert.notEqual(broken, text);
  assert.throws(() => parseNierAchievement(broken), /国語: 47 県の加重平均/);
});

test('壊した入力: 県の行が欠ける・重複する・表が無いと落ちる', () => {
  const lines = fixture('2024-elementary').split('\n');
  assert.throws(() => parseNierAchievement(lines.filter((l) => !l.startsWith('沖縄県')).join('\n')), /県数 46 != 47/);
  assert.throws(() => parseNierAchievement([...lines, lines.find((l) => l.startsWith('青森県'))].join('\n')), /県の重複: 青森県/);
  assert.throws(() => parseNierAchievement('令和６年度 小学校調査\n関係ない文書'), /表が見つかりません/);
});

test('壊した入力: 人数の列が欠けた行 (教科数と合わない) で落ちる', () => {
  const text = fixture('2024-elementary');
  const broken = text.replace('34,531      34,531    35,089', '34,531      35,089');
  assert.notEqual(broken, text);
  assert.throws(() => parseNierAchievement(broken), /人数の列数/);
});

test('壊した入力: 全国（公立）の行が無いと落ちる', () => {
  const broken = fixture('2024-elementary').split('\n').filter((l) => !l.startsWith('全国（公立）')).join('\n');
  assert.throws(() => parseNierAchievement(broken), /全国（公立）の行がありません/);
});
