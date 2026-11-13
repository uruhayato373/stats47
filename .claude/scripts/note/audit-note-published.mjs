#!/usr/bin/env node
/**
 * note の公開記事を全件、公開ページの実物から機械採点する read-only 監査。note へは書かない。ログインも要らない。
 * 判定は lib/published-audit.mjs。既存のカード監査・本文の図の台帳の結果も記事ごとの点数へまとめる。
 *
 *   node .claude/scripts/note/audit-note-published.mjs                 # 全公開記事 → data/note/published-audit-latest.json
 *   node .claude/scripts/note/audit-note-published.mjs --key <記事key>  # 1 記事だけ測って標準出力へ (台帳は書かない)
 *   node .claude/scripts/note/audit-note-published.mjs --limit 20      # 先頭 N 本だけ測って標準出力へ (台帳は書かない)
 *   node .claude/scripts/note/audit-note-published.mjs --check         # 全件を測って台帳を書き、縮小専用の上限を超えたら exit 1 (週次)
 *
 * 台帳の queue が次に直す記事の並び。直す手順は .claude/skills/note/remediate-note-published/SKILL.md。
 * exit 0 = 測れた / 1 = --check で上限を超えた / 2 = 取得できない記事が 5% を超えた (不完全な結果で台帳を上書きしない)
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { datasetDir, datasetPath } from "../../../config/datasets.mjs";
import { auditArticle, buildQueue, checkBaseline, noteIdOf, parseBody, pngSize, rankingKeysOf, summarize } from './lib/published-audit.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const { R2_PUBLIC_BASE_URL } = createRequire(import.meta.url)('../lib/site-config.cjs');
const R2 = process.env.R2_PUBLIC_FETCH_URL || R2_PUBLIC_BASE_URL;
// 採点結果とカード監査の結果は、note の最新の検査結果の置き場 (note.cover-rollout) に並ぶ
const LATEST_DIR = datasetDir('note.cover-rollout');
const OUTPUT = resolve(ROOT, LATEST_DIR, 'published-audit-latest.json');
const args = process.argv.slice(2);
const option = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : null);
const onlyKey = option('--key');
const limit = option('--limit') ? Number(option('--limit')) : null;

async function fetchRetry(url, as) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(url, { headers: { 'user-agent': 'stats47-note-published-audit/1.0' }, signal: AbortSignal.timeout(30_000) });
      if (response.status === 404) return null;
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return as === 'buffer' ? Buffer.from(await response.arrayBuffer()) : await response.text();
    } catch (error) {
      if (attempt === 3) return null;
      await new Promise((done) => setTimeout(done, attempt * 1000));
    }
  }
  return null;
}

async function pool(items, size, worker) {
  const results = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: size }, async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await worker(items[index], index);
    }
  }));
  return results;
}

const readJson = (path) => JSON.parse(readFileSync(resolve(ROOT, path), 'utf8'));
const catalog = JSON.parse(execFileSync(process.execPath, ['--import', 'tsx', resolve(ROOT, '.claude/scripts/note/catalog/dump-circulation-json.ts')], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }));
const published = catalog.articles.filter((a) => noteIdOf(a.noteUrl));
const byNoteId = new Map(published.map((a) => [noteIdOf(a.noteUrl), a]));
const figureCheck = new Map(readJson(datasetPath('note.body-figures')).articles.map((a) => [a.key, a.valueCheck]));
const cardIssues = new Map(readJson(`${LATEST_DIR}/card-visibility-latest.json`).articles.map((a) => [a.key, (a.issues ?? []).map((i) => i.code)]));

const latestYearCache = new Map();
function latestYearOf(rankingKey) {
  if (!latestYearCache.has(rankingKey)) {
    latestYearCache.set(rankingKey, fetchRetry(`${R2}/app/stats/${rankingKey}/values.json`).then((text) => {
      const years = text ? JSON.parse(text).rows.map((row) => Number(String(row.year ?? row.yearCode ?? '').slice(0, 4))).filter(Boolean) : [];
      return years.length > 0 ? Math.max(...years) : null;
    }));
  }
  return latestYearCache.get(rankingKey);
}

async function measure(article) {
  const base = { key: article.key, noteUrl: article.noteUrl, isPaid: article.isPaid };
  const raw = await fetchRetry(`https://note.com/api/v3/notes/${noteIdOf(article.noteUrl)}`);
  const data = raw ? JSON.parse(raw).data : null;
  if (!data?.body) return { ...base, score: null, issues: [], unread: true };
  const body = parseBody(data.body);
  const images = await pool(body.images, 3, async (src) => {
    // 幅 1200 の配信版を読む。型 (1080 幅) と旧版 (1080・1200 幅) は縮小されず、同じ画像は同じバイト列になる
    const buffer = await fetchRetry(`${src.split('?')[0]}?width=1200`, 'buffer');
    const size = pngSize(buffer);
    return { ok: Boolean(buffer), width: size?.width ?? null, height: size?.height ?? null, sha: buffer ? createHash('sha256').update(buffer).digest('hex') : null };
  });
  const rankingKeys = rankingKeysOf(article.stats47Targets);
  const result = auditArticle(article, body, images, {
    byNoteId,
    latestYear: rankingKeys.length === 1 ? await latestYearOf(rankingKeys[0]) : null,
    figureCheck: figureCheck.get(article.key),
    cardIssues: cardIssues.get(article.key),
  });
  return {
    ...base,
    score: result.score,
    issues: result.issues,
    isRankingArticle: result.isRankingArticle,
    year: result.year,
    imageSizes: images.map((i) => (i.ok ? `${i.width}x${i.height}` : 'failed')),
    hashtags: data.hashtag_notes?.length ?? 0,
    // 固定コピー (chart-data.json) を持つ記事だけが、今の道具で型の画像を作り直せる
    hasChartData: ['match', 'changed'].includes(figureCheck.get(article.key)),
    cards: body.cards.map((c) => ({ label: c.label, target: c.target.split('?')[0] })),
  };
}

let targets = onlyKey ? published.filter((a) => a.key === onlyKey) : published;
if (onlyKey && targets.length !== 1) { console.error(`公開記事に無い key: ${onlyKey}`); process.exit(2); }
if (limit) targets = targets.slice(0, limit);

let done = 0;
const rows = await pool(targets, 4, async (article) => {
  const row = await measure(article);
  if (++done % 50 === 0) console.error(`${done}/${targets.length}`);
  return row;
});
rows.sort((a, b) => (a.score ?? -1) - (b.score ?? -1) || a.key.localeCompare(b.key));
const summary = summarize(rows);
const dashboard = readJson(`${datasetDir('note.dashboard')}/latest.json`);
const views = new Map(dashboard.articles.filter((a) => a.catalogKey).map((a) => [a.catalogKey, a.pageViews ?? 0]));
const queue = buildQueue(rows, views);
const report = { schemaVersion: 1, account: catalog.account, measuredAt: new Date().toISOString(), viewsFetchedAt: dashboard.fetchedAt, summary, queue, articles: rows };

if (onlyKey || limit) {
  console.log(JSON.stringify(onlyKey ? rows[0] : { summary, worst: rows.slice(0, 5) }, null, 1));
} else {
  if (summary.unread > rows.length * 0.05) { console.error(`取得できない記事が ${summary.unread}/${rows.length} 本。台帳は更新しない`); process.exit(2); }
  writeFileSync(OUTPUT, `${JSON.stringify(report, null, 1)}\n`);
  console.log(JSON.stringify({ ...summary, queue: Object.fromEntries(queue.map((q) => [q.kind, q.total])) }, null, 1));
  if (args.includes('--check')) {
    const verdict = checkBaseline(summary, readJson('.claude/config/note-published-baseline.json'));
    for (const item of verdict.shrinkable) console.log(`上限を下げられる: ${item.key} ${item.max} → ${item.count} (.claude/config/note-published-baseline.json)`);
    for (const item of verdict.exceeded) console.error(`上限を超えた: ${item.key} ${item.count} 本 (上限 ${item.max})`);
    if (!verdict.ok) process.exit(1);
  }
}
