import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { test } from 'node:test';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../..');
const script = path.join(root, '.claude/scripts/blog/generate-article-charts.ts');
const tsx = path.join(root, 'node_modules/tsx/dist/cli.mjs');

function render(t, rows, options = {}) {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'stats47-chart-ranks-'));
  t.after(() => fs.rmSync(base, { recursive: true, force: true }));
  const dir = path.join(base, 'fixture');
  const data = path.join(dir, 'data');
  fs.mkdirSync(data, { recursive: true });
  fs.writeFileSync(path.join(dir, 'article.md'), '---\npublished: false\n---\n');
  fs.writeFileSync(path.join(data, 'fixture-prefecture-rankings.json'), JSON.stringify({
    title: '順位検証', unit: '件', showBars: false, data: rows, ...options,
  }));
  execFileSync(process.execPath, [tsx, script, '--slug', 'fixture', '--base', path.relative(root, base)], { cwd: root });
  return ['', '-ig'].map((suffix) => fs.readFileSync(path.join(data, `fixture-prefecture-rankings${suffix}.svg`), 'utf8'));
}

const rankBadges = (svg) => [...svg.matchAll(/<text[^>]*text-anchor="middle"[^>]*>(\d+)<\/text>/g)].map((match) => Number(match[1]));

test('上位側と下位側の抽出前に同順位を導出し、旧入力の連番rankを修正する', (t) => {
  const rows = Array.from({ length: 47 }, (_, i) => ({ pref: `県${i}`, value: i === 0 ? 4 : i < 12 ? 1 : 0, rank: i + 1 }));
  for (const svg of render(t, rows)) {
    assert.deepEqual(rankBadges(svg), [1, 2, 2, 2, 2, 13, 13, 13, 13, 13]);
  }
});

test('入力が昇順でも値の降順を維持し、reverse配色で順位を反転しない', (t) => {
  const rows = Array.from({ length: 12 }, (_, i) => ({ pref: `県${i}`, value: i - 6 }));
  for (const svg of render(t, rows, { reverse: true })) {
    assert.deepEqual(rankBadges(svg), [1, 2, 3, 4, 5, 8, 9, 10, 11, 12]);
    assert.ok(svg.indexOf('>県11</text>') < svg.indexOf('>県10</text>'));
    assert.ok(svg.indexOf('>県1</text>') < svg.indexOf('>県0</text>'));
  }
});

test('同値のないデータは正典rankの有無で表示を変えない', (t) => {
  const rows = Array.from({ length: 12 }, (_, i) => ({ pref: `県${i}`, value: 12 - i }));
  const without = render(t, rows);
  const withRanks = render(t, rows.map((row, i) => ({ ...row, rank: i + 1 })));
  const stripTime = (svg) => svg.replace(/<!-- data-source:[\s\S]*?-->/, '');
  assert.deepEqual(without.map(stripTime), withRanks.map(stripTime));
});
