/**
 * 本文×図の data JSON 照合 gate (2026-10-26 追加) の回帰テスト。
 * 実行: node --test .claude/scripts/lib/__tests__/quality-gate.claim-gates.test.mjs
 *
 * - BLOG-SEOTITLE-MIXED-YEAR-01: 年の違う図を並べた記事で title/seoTitle に年が 1 つだけ
 * - BLOG-METRIC-NAME-GATE-01 ①: 図「スルメイカ漁獲量」の値を本文が「イカ類」と呼ぶ
 * - BLOG-METRIC-NAME-GATE-01 ②: 「N年と比べて」の N が時系列の期間内の極値
 *
 * critic が実際に止めた 2 記事の形を注入して発火し、正しい書き方では発火しないことを両方固定する
 * (unit-semantics-standards の「誤りを注入して発火・正しい値で無反応」)。最後に quality-gate.mjs を
 * 子プロセスで走らせ、3 つが warnings / checks に配線されていることを確かめる。
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  extractChartYears,
  extractTitleYears,
  lintMixedYearTitle,
} from '../title-year-lint.mjs';
import {
  lintExtremeBaseYear,
  lintHypernymMetricNames,
} from '../metric-name-lint.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GATE = path.resolve(__dirname, '../../blog/quality-gate.mjs');

const article = ({ title, seoTitle, body }) => `---
title: "${title}"
seoTitle: "${seoTitle}"
description: "テスト用の記事です。年の違う指標や魚種別の漁獲量を並べたときに、本文と図の食い違いを機械で止められるかを確かめます。"
published: false
---

## 全体像

${body}
`;

// --- sixth-industry-direct-sales の形: 農業産出額 (2024年) と農家総所得 (2003年度) ---
const OUTPUT_2024 = {
  base: 'agri-output-ranking',
  json: { title: '農業産出額', subtitle: '2024年', year: '2024', data: [] },
  source: { kind: 'ranking', year: '2024' },
};
const INCOME_2003FY = {
  base: 'farm-income-ranking',
  json: { title: '農家総所得', subtitle: '2003年度', year: '2003', data: [] },
  source: { kind: 'ranking', year: '2003年度' },
};

test('年: 2024年と2003年度の図を並べ seoTitle に 2024年 だけ → warning', () => {
  const md = article({
    title: '農業日本一の北海道は、農家総所得では何位なのか',
    seoTitle: '農業産出額1位は北海道・農家総所得は8位（2024年）',
    body: '本文',
  });
  const r = lintMixedYearTitle(md, [OUTPUT_2024, INCOME_2003FY]);
  assert.equal(r.warnings.length, 1);
  assert.match(r.warnings[0], /2003年度・2024年/);
});

test('年: 指標ごとに年を書き分けた seoTitle では発火しない', () => {
  const md = article({
    title: '農業日本一の北海道は、農家総所得では何位なのか',
    seoTitle: '農業産出額1位は北海道（2024年）｜農家総所得は8位（2003年度）',
    body: '本文',
  });
  assert.deepEqual(lintMixedYearTitle(md, [OUTPUT_2024, INCOME_2003FY]).warnings, []);
});

test('年: 図の年が 1 つ・タイトルの年が図に無い・「2020・2023年」の列記では発火しない', () => {
  const same = { ...INCOME_2003FY, source: { year: '2024' }, json: { year: '2024' } };
  const one = article({ title: 't', seoTitle: '農業産出額（2024年）', body: '本文' });
  assert.deepEqual(lintMixedYearTitle(one, [OUTPUT_2024, same]).warnings, []);
  const unrelated = article({ title: 't', seoTitle: '1980年から何が変わったか', body: '本文' });
  assert.deepEqual(lintMixedYearTitle(unrelated, [OUTPUT_2024, INCOME_2003FY]).warnings, []);
  const listed = article({ title: 't', seoTitle: '共働きと部屋数 2003・2024年', body: '本文' });
  assert.deepEqual(extractTitleYears(listed), [2003, 2024]);
  assert.deepEqual(lintMixedYearTitle(listed, [OUTPUT_2024, INCOME_2003FY]).warnings, []);
});

test('年: 時系列の期間 (1956〜2018) は時点の年に数えず、散布図の x/y の年は両方数える', () => {
  assert.deepEqual(extractChartYears({ year: '1956〜2018' }, undefined), []);
  assert.deepEqual(
    extractChartYears({}, { year: 'x:2020/y:2023' }).map((y) => y.year),
    [2020, 2023]
  );
  assert.equal(extractChartYears({ subtitle: '2003年度' }, { year: '2003' })[0].fiscal, true);
});

// --- fishery-species-prefecture-specialty の形 ①: スルメイカの値を「イカ類」と呼ぶ ---
const SQUID = {
  base: 'squid-catch-ranking',
  json: {
    title: 'スルメイカ漁獲量',
    label: 'スルメイカ漁獲量',
    data: [
      { areaName: '青森県', value: 5370 },
      { areaName: '北海道', value: 5012 },
    ],
  },
  source: { kind: 'ranking', year: '2023' },
};

test('呼び名: スルメイカ漁獲量の値を「イカ類」と書くと warning', () => {
  const md = article({
    title: 't',
    seoTitle: 's',
    body: '2023年のイカ類は青森県が5,370トンで首位、北海道が5,012トンで続きます。',
  });
  const r = lintHypernymMetricNames(md, [SQUID]);
  assert.equal(r.warnings.length, 1);
  assert.match(r.warnings[0], /イカ類.*スルメイカ漁獲量.*5,370/);
});

test('呼び名: 図と同じ名前・値を語らない文・図名が「〜類」なら発火しない', () => {
  const ok = article({
    title: 't',
    seoTitle: 's',
    body: '2023年のスルメイカは青森県が5,370トンで首位です。イカ類全体の統計はこの表にはありません。',
  });
  assert.deepEqual(lintHypernymMetricNames(ok, [SQUID]).warnings, []);
  const tuna = {
    base: 'tuna-scatter',
    json: {
      title: 'マグロ類漁獲量と支出',
      xLabel: 'マグロ類漁獲量',
      yLabel: 'まぐろ消費支出額',
      points: [{ label: '静岡県', x: 23704, y: 10254 }],
    },
  };
  const named = article({
    title: 't',
    seoTitle: 's',
    body: 'マグロ類は静岡県が漁獲量23,704トン、消費支出額10,254円でどちらも1位です。',
  });
  assert.deepEqual(lintHypernymMetricNames(named, [tuna]).warnings, []);
});

// --- ②: 2013〜2018年で最も低い 2015 年を基準に「強まった」と書く ---
const SHARE = {
  base: 'scallop-share-timeseries',
  json: {
    title: 'ホタテガイの北海道シェア',
    series: [
      {
        label: 'ホタテガイの北海道シェア',
        data: [
          { year: '2013', value: 92.1 },
          { year: '2014', value: 91.5 },
          { year: '2015', value: 89.8 },
          { year: '2016', value: 91.0 },
          { year: '2017', value: 92.4 },
          { year: '2018', value: 91.7 },
        ],
      },
    ],
  },
};

test('基準年: 期間内で最低の 2015 年と比べて「強まった」と書くと warning', () => {
  const md = article({
    title: 't',
    seoTitle: 's',
    body: '2015年と比べてホタテの寡占はさらに強まりました。',
  });
  const r = lintExtremeBaseYear(md, [SHARE]);
  assert.equal(r.warnings.length, 1);
  assert.match(r.warnings[0], /2015年は「ホタテガイの北海道シェア」の期間内で最低の年/);
});

test('基準年: 極値でない年・期間の始点・極値と明示した比較では発火しない', () => {
  for (const body of [
    '2016年と比べてホタテの寡占はさらに強まりました。',
    '2013年と比べてホタテの寡占は続いています。',
    'シェアが最も低かった2015年と比べると、寡占は戻っています。',
  ]) {
    const md = article({ title: 't', seoTitle: 's', body });
    assert.deepEqual(lintExtremeBaseYear(md, [SHARE]).warnings, [], body);
  }
});

// --- quality-gate.mjs への配線 ---
function runGate(md, charts) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'qg-claim-'));
  const data = path.join(dir, 'data');
  fs.mkdirSync(data);
  const refs = charts.map((c) => `![${c.base}](data/${c.base}.svg)`).join('\n\n');
  fs.writeFileSync(path.join(dir, 'article.md'), `${md}\n${refs}\n`);
  for (const c of charts) {
    fs.writeFileSync(
      path.join(data, `${c.base}.svg`),
      '<svg viewBox="0 0 960 404" width="960" height="404"></svg>'
    );
    fs.writeFileSync(path.join(data, `${c.base}.json`), JSON.stringify(c.json));
    if (c.source)
      fs.writeFileSync(path.join(data, `${c.base}.source.json`), JSON.stringify(c.source));
  }
  try {
    let out;
    try {
      out = execFileSync('node', [GATE, path.join(dir, 'article.md')], { encoding: 'utf8' });
    } catch (e) {
      out = e.stdout; // blocker があると exit 1。stdout の JSON を読む
    }
    return JSON.parse(out);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test('quality-gate: 3 つの照合が warnings と checks に出て、正しい記事では 0 件', () => {
  const bad = article({
    title: 't',
    seoTitle: '農業産出額と農家総所得（2024年）',
    body:
      '2023年のイカ類は青森県が5,370トンで首位です。\n\n' +
      '2015年と比べてホタテの寡占はさらに強まりました。',
  });
  const r = runGate(bad, [OUTPUT_2024, INCOME_2003FY, SQUID, SHARE]);
  assert.equal(r.checks.mixedYearTitle, 1);
  assert.equal(r.checks.hypernymMetricNames, 1);
  assert.equal(r.checks.extremeBaseYear, 1);
  assert.ok(r.warnings.some((w) => w.startsWith('年の違う図')));
  assert.ok(r.warnings.some((w) => w.startsWith('指標の呼び名')));
  assert.ok(r.warnings.some((w) => w.startsWith('比較の基準年')));
  // warning であって blocker ではない
  assert.ok(!r.blockers.some((b) => /年の違う図|指標の呼び名|比較の基準年/.test(b)));

  const good = article({
    title: 't',
    seoTitle: '農業産出額（2024年）｜農家総所得（2003年度）',
    body:
      '2023年のスルメイカは青森県が5,370トンで首位です。\n\n' +
      '2016年と比べてホタテの寡占はさらに強まりました。',
  });
  const g = runGate(good, [OUTPUT_2024, INCOME_2003FY, SQUID, SHARE]);
  assert.equal(g.checks.mixedYearTitle, 0);
  assert.equal(g.checks.hypernymMetricNames, 0);
  assert.equal(g.checks.extremeBaseYear, 0);
});
