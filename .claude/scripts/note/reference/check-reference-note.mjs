#!/usr/bin/env node
/**
 * 教材の企画から作った note 記事 (build-reference-note.ts の作業コピー) を保存前に検査する。
 *
 *   node .claude/scripts/note/reference/check-reference-note.mjs <key...> [--apply-title]
 *
 * --apply-title: 合格した記事の題名を記事台帳へ書く (生成時は企画の問いを仮の題名にしている)
 *
 * - 執筆の印 (<!-- WRITE:… -->) が残っていない。題名・説明文があり、題名が企画の問いの写しではない
 * - 「## この問いへの答え」の節がある
 * - 題名・説明文・本文に出てくる数値が、chart-data.json・data-provenance.json にある値 (各都道府県の値・平均・最大最小の比・
 *   地方別平均・順位相関・年) か 47 以下の整数 (順位・件数) だけである。書籍の数値や暗算した差を本文に入れない
 * - 本文の画像がすべて images/ にある
 * exit 0 = 合格 / 1 = 不合格 (理由を出す)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { updateArticleLedger } from '../lib/article-ledger.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const WORK_ROOT = path.join(ROOT, 'docs/31_note記事原稿');
const SMALL_INTEGER_MAX = 47;

const fmt = (v, d) => v.toLocaleString('ja-JP', { minimumFractionDigits: d, maximumFractionDigits: d });

/** chart-data.json の数値すべてから、本文に書いてよい表記を集める (桁区切りの有無・小数 0〜3 桁を許す) */
export function allowedNumbers(chart) {
  const allowed = new Set();
  const add = (v) => {
    for (const digits of [0, 1, 2, 3]) {
      const s = fmt(v, digits);
      allowed.add(s);
      allowed.add(s.replace(/,/g, ''));
    }
    allowed.add(String(v));
  };
  const walk = (node) => {
    if (typeof node === 'number' && Number.isFinite(node)) add(node);
    else if (typeof node === 'string') for (const [n] of node.matchAll(/\d[\d,]*(?:\.\d+)?/g)) allowed.add(n);
    else if (Array.isArray(node)) node.forEach(walk);
    else if (node && typeof node === 'object') Object.values(node).forEach(walk);
  };
  walk(chart);
  return allowed;
}

export function numbersIn(text) {
  const stripped = text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\]\([^)]*\)/g, ']')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\d{4}年改定/g, ''); // 分類の版の名前 (品目分類 2020年改定) は数値の主張ではない
  return [...stripped.matchAll(/-?\d[\d,]*(?:\.\d+)?/g)].map((m) => m[0].replace(/,$/, ''));
}

const titleOf = (draft) => draft.match(/^---\n[\s\S]*?^title:\s*"(.*)"$/m)?.[1] ?? '';

export function checkArticle(dir) {
  const errors = [];
  const draft = fs.readFileSync(path.join(dir, 'draft.md'), 'utf8');
  const chart = JSON.parse(fs.readFileSync(path.join(dir, 'chart-data.json'), 'utf8'));
  const [, front = '', body = ''] = draft.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/) ?? [];
  if (!front) errors.push('frontmatter が無い');
  if (/<!--\s*WRITE:/.test(draft)) errors.push('執筆の印 (<!-- WRITE:… -->) が残っている');
  const title = front.match(/^title:\s*"(.*)"$/m)?.[1] ?? '';
  const description = front.match(/^description:\s*"(.*)"$/m)?.[1] ?? '';
  if (!title) errors.push('題名が無い');
  if (!description) errors.push('説明文が無い');
  if (title && title === chart.question) errors.push('題名が企画の問いの写しのまま');
  if (!/^## この問いへの答え$/m.test(body)) errors.push('「## この問いへの答え」の節が無い');
  // 生成器が書く出典の統計表 ID・年齢区分などは data-provenance.json と chart-data.json の文字列にある
  const provenancePath = path.join(dir, 'data-provenance.json');
  const provenance = fs.existsSync(provenancePath) ? JSON.parse(fs.readFileSync(provenancePath, 'utf8')) : {};
  const allowed = allowedNumbers({ chart, provenance });
  const unknown = new Set();
  for (const n of numbersIn(`${title}\n${description}\n${body}`)) {
    const plain = n.replace(/^-/, '');
    if (allowed.has(n) || allowed.has(plain)) continue;
    if (/^\d+$/.test(plain) && Number(plain) <= SMALL_INTEGER_MAX) continue;
    unknown.add(n);
  }
  if (unknown.size) errors.push(`chart-data.json に無い数値: ${[...unknown].join(', ')}`);
  for (const [, file] of body.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g))
    if (!fs.existsSync(path.join(dir, file))) errors.push(`画像が無い: ${file}`);
  return errors;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const keys = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  const applyTitle = process.argv.includes('--apply-title');
  if (!keys.length) {
    console.error('使い方: check-reference-note.mjs <key...> [--apply-title]');
    process.exit(2);
  }
  let failed = 0;
  const passed = [];
  for (const key of keys) {
    const dir = path.join(WORK_ROOT, key);
    const errors = checkArticle(dir);
    if (errors.length) {
      failed++;
      console.error(`✗ ${key}\n  ${errors.join('\n  ')}`);
    } else {
      passed.push([key, titleOf(fs.readFileSync(path.join(dir, 'draft.md'), 'utf8'))]);
      console.log(`✓ ${key}`);
    }
  }
  if (applyTitle && passed.length)
    updateArticleLedger((ledger) => {
      for (const [key, title] of passed) {
        const article = ledger.articles.find((a) => a.key === key);
        if (!article) throw Error(`記事台帳に無い: ${key} (build-reference-note.ts --register で登録する)`);
        article.title = title;
      }
    });
  process.exit(failed ? 1 : 0);
}
