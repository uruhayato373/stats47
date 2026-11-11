/**
 * 問いへの回答 (archetype Q) の本文の数値を data/*.json と照らす gate (2026-11-09 追加) の回帰テスト。
 * 実行: node --test .claude/scripts/lib/__tests__/quality-gate.q-numbers.test.mjs
 *
 * 全国の値だけの記事は県名と順位の照合が効かず、数値の正しさを審査役の目だけが担保していた
 * (BLOG-GATE-NATIONAL-VALUES-01)。data に無い数値を書くと止まり、補助値の JSON に置くと通ることを固定する。
 * 記事ディレクトリを引数に渡しても読めること (以前は EISDIR で落ちた) も確かめる。
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GATE = path.resolve(__dirname, '../../blog/quality-gate.mjs');

const article = (archetype, body) => `---
title: "教育費の年収差は広がったのか"
seoTitle: "教育費の年収差｜第Ⅴ階級は第Ⅰ階級の16.8倍"
description: "家計調査の年収五分位で教育費を比べると、上位の階級の支出は増え、下位の階級の支出は減りました。倍率の動きを確かめます。"
archetype: ${archetype}
published: false
---

## 結論

${body}

![教育費](data/education.svg)
`;

function runGate(md, dataFiles, { asDir = false } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'qg-qnum-'));
  const data = path.join(dir, 'data');
  fs.mkdirSync(data);
  fs.writeFileSync(path.join(dir, 'article.md'), md);
  fs.writeFileSync(path.join(data, 'education.svg'), '<svg viewBox="0 0 960 404" width="960" height="404"></svg>');
  fs.writeFileSync(path.join(data, 'education.source.json'), JSON.stringify({ kind: 'manual', source: 'test' }));
  for (const [name, json] of Object.entries(dataFiles)) fs.writeFileSync(path.join(data, name), JSON.stringify(json));
  try {
    let out;
    try {
      out = execFileSync('node', [GATE, asDir ? dir : path.join(dir, 'article.md')], { encoding: 'utf8' });
    } catch (e) {
      out = e.stdout;
    }
    return JSON.parse(out.slice(out.indexOf('{')));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

const CHART = { 'education.json': { title: '教育費', data: [{ label: '第Ⅰ階級', value: 21690 }, { label: '第Ⅴ階級', value: 364901 }] } };
const BODY = '第Ⅰ階級の教育費は21,690円、第Ⅴ階級は364,901円で、第Ⅴ階級は第Ⅰ階級の16.8倍です。';
const numberBlocker = (r) => r.blockers.find((b) => b.includes('data/*.json に無い'));

test('Q: data に無い比 (16.8倍) を書くと止まり、図の値は照合される', () => {
  const r = runGate(article('Q', BODY), CHART);
  assert.ok(numberBlocker(r), JSON.stringify(r.blockers));
  assert.match(numberBlocker(r), /16\.8倍/);
  assert.equal(r.checks.articleNumbers.unmatched, 1);
});

test('Q: 比を補助値の JSON に置くと通る', () => {
  const appendix = { 'appendix-supporting-values.json': { chartType: 'appendix', data: [{ label: '第Ⅴ÷第Ⅰ', value: 16.82, unit: '倍' }] } };
  const r = runGate(article('Q', BODY), { ...CHART, ...appendix });
  assert.equal(numberBlocker(r), undefined);
  assert.equal(r.checks.articleNumbers.unmatched, 0);
});

test('Q 以外の型ではこの照合をしない', () => {
  const r = runGate(article('C', BODY), CHART);
  assert.equal(numberBlocker(r), undefined);
  assert.equal(r.checks.articleNumbers, undefined);
});

test('記事ディレクトリを渡しても article.md を読む', () => {
  const r = runGate(article('Q', BODY), CHART, { asDir: true });
  assert.ok(numberBlocker(r));
});

test('generatedBy が送り箱 (contents/blog/) を指す図は止まり、/tmp の過去の負債は止めない', () => {
  const run = (generatedBy) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'qg-genby-'));
    const data = path.join(dir, 'data');
    fs.mkdirSync(data);
    fs.writeFileSync(path.join(dir, 'article.md'), article('C', BODY));
    fs.writeFileSync(path.join(data, 'education.svg'), '<svg viewBox="0 0 960 404" width="960" height="404"></svg>');
    fs.writeFileSync(path.join(data, 'education.json'), JSON.stringify(CHART['education.json']));
    fs.writeFileSync(path.join(data, 'education.source.json'), JSON.stringify({ kind: 'manual', source: 'test', generatedBy }));
    try {
      let out;
      try {
        out = execFileSync('node', [GATE, path.join(dir, 'article.md')], { encoding: 'utf8' });
      } catch (e) {
        out = e.stdout;
      }
      return JSON.parse(out.slice(out.indexOf('{'))).blockers.filter((b) => b.includes('generatedBy'));
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  };
  assert.equal(run('contents/blog/x/analysis/build.mjs').length, 1);
  assert.equal(run('/tmp/old.mjs').length, 0);
  assert.equal(run('.claude/scripts/blog/fetch-ranking-data-r2.mjs').length, 0);
});
