#!/usr/bin/env node
/**
 * build-note-figure-ledger.mjs — 公開済み note 記事の本文の図を台帳にし、今の R2 の値と照らす。
 *
 * カバーには台帳があるが本文の図には無く、どの記事がどの指標のどの年を使い、値が今も同じかを
 * たどれなかった。記事の draft.md の画像参照と data-provenance.json・chart-data.json から台帳を作り、
 * 固定コピーの値を R2 `app/stats/<key>/values.json` の同じ年と照らす。
 * 回収した旧記事には固定コピーが無いので、指標は台帳の stats47Targets、年は題名、図の種類は直前の見出しから読み、
 * 本文の順位と値を article-factual-check で照らす。人が読んで誤検知と確かめた主張は data/note/body-figure-reviews.json に理由つきで残し、数えない。
 *
 * 出力 data/note/body-figures.json は図のファイル名と指標と年だけを持つ (有料本文の文章や値は書かない)。
 * 有料記事の本文は非公開 R2 にあるので S3 認証が要る。認証が無ければ止まる。
 * 手元で無料記事だけ試すときは --public-only (台帳は書かず集計だけ出す)。
 *
 * Usage:
 *   node .claude/scripts/note/build-note-figure-ledger.mjs                # 全件・台帳を書く (CI)
 *   node .claude/scripts/note/build-note-figure-ledger.mjs --public-only --out <path>  # 無料記事だけ。台帳は別の場所へ
 *   node .claude/scripts/note/build-note-figure-ledger.mjs --check        # 直すべき記事を出し、上限を超えたら exit 1 (週次)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import dotenv from 'dotenv';
import os from 'node:os';
import { checkArticleFactual } from '../lib/article-factual-check.mjs';
import { R2_PRIVATE_BUCKET, R2_PUBLIC_BASE_URL } from '../lib/site-config.cjs';
import { datasetPath } from '../../../config/datasets.mjs';
import { readArticleLedger } from './lib/article-ledger.mjs';
import { createR2Store, fetchNoteDetail } from './lib/cover-storage.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const LEDGER = path.join(ROOT, datasetPath('note.body-figures'));
const REVIEWS = path.join(ROOT, datasetPath('note.body-figure-reviews'));
const R2 = process.env.R2_PUBLIC_FETCH_URL || R2_PUBLIC_BASE_URL;
const CONCURRENCY = 6;
/** 固定コピーの丸めで生じる差を許す幅 (最後の桁の 1.5 目盛り)。audit-chart-axes.ts と同じ */
const LAST_DIGIT_TOLERANCE = 1.5;

const RANKING_IMAGES = [
  [/choropleth/, 'ranking-map'],
  [/chart-x/, 'ranking-bar'],
  [/boxplot/, 'ranking-boxplot'],
];

/** 旧記事の見出しが名乗る図の種類 */
const HEADING_KINDS = [
  [/コロプレス|地図/, 'ranking-map'],
  [/箱ひげ/, 'ranking-boxplot'],
  [/ランキング|棒グラフ|順位/, 'ranking-bar'],
];

/** 本文の画像参照を、記事ディレクトリからの相対パスと直前の見出しで返す */
export function bodyImagesOf(markdown, { remote = false } = {}) {
  const seen = new Map();
  let heading = '';
  for (const line of markdown.split('\n')) {
    if (/^#{2,4}\s/.test(line)) heading = line.replace(/^#+\s*/, '');
    for (const m of line.matchAll(/!\[[^\]]*\]\(([^)\s]+)\)/g)) {
      const file = m[1].replace(/^\.\//, '');
      if ((remote || !/^https?:/.test(file)) && !seen.has(file)) seen.set(file, heading);
    }
  }
  return [...seen].map(([file, section]) => ({ file, section }));
}

/** note.com の本文 HTML を、見出しと画像と段落の順だけ残した Markdown にする */
export function noteHtmlToMarkdown(html) {
  return html
    .replace(/<figure[^>]*>\s*<img[^>]*src="([^"]+)"[^>]*>[\s\S]*?<\/figure>/g, (_, src) => `\n![](${src.split('?')[0]})\n`)
    .replace(/<img[^>]*src="([^"]+)"[^>]*>/g, (_, src) => `\n![](${src.split('?')[0]})\n`)
    .replace(/<h([2-4])[^>]*>([\s\S]*?)<\/h\1>/g, (_, level, text) => `\n${'#'.repeat(Number(level))} ${text}\n`)
    .replace(/<\/(p|li|blockquote)>/g, '\n')
    .replace(/<[^>]+>/g, '');
}

/** 台帳の stats47Targets から指標キーを 1 つ読む。複数を指す記事は指標を決められない */
export function rankingKeyOfTargets(targets) {
  const keys = (targets ?? []).map((t) => /^\/ranking\/([^/?#]+)/.exec(t)?.[1]).filter(Boolean);
  return keys.length === 1 ? keys[0] : null;
}

/** 題名の【2021年版】や 2023年 から記事の年を読む。2 つ以上の年を書く題名は決められない */
export function yearOfTitle(title) {
  const years = [...new Set([...String(title).matchAll(/(?<!\d)((?:19|20)\d{2})年/g)].map((m) => m[1]))];
  return years.length === 1 ? years[0] : null;
}

/** 図の種類。ランキング 3 種は名前で決まり、指標に結ばれた他の図は chart、残りは diagram (手順図など) */
export function figureKindOf(file, provenanceCharts, section = '', isRankingArticle = false) {
  const base = path.posix.basename(file);
  const ranking = RANKING_IMAGES.find(([pattern]) => pattern.test(base));
  if (ranking) return ranking[1];
  if (provenanceCharts.includes(file)) return 'chart';
  const named = isRankingArticle ? HEADING_KINDS.find(([pattern]) => pattern.test(section)) : null;
  return named ? named[1] : 'diagram';
}

/** 固定コピーの値のうち、今の R2 の同じ年と違う県の数。比べられないときは null */
export function countChangedValues(snapshot, observed) {
  if (!Array.isArray(snapshot) || snapshot.length === 0 || observed.size === 0) return null;
  let changed = 0;
  let compared = 0;
  for (const row of snapshot) {
    const now = observed.get(String(row.area_code));
    if (typeof row.value !== 'number' || now === undefined) continue;
    compared += 1;
    const digits = (String(row.value).split('.')[1] ?? '').length;
    if (Math.abs(now - row.value) > LAST_DIGIT_TOLERANCE * 10 ** -digits) changed += 1;
  }
  return compared === 0 ? null : changed;
}

const fetchWithRetry = async (url) => {
  for (let i = 0; i < 4; i++) {
    try {
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (res.ok) return res.text();
    } catch { /* 取り直す */ }
    await new Promise((done) => setTimeout(done, 1200 * (i + 1)));
  }
  throw Error(`取得できない: ${url}`);
};

/**
 * 順位の不一致のうち、同値の県の並べ方の違いだけのものか。note の旧記事は同値にも通し番号を振っているので、
 * 書かれた順位が同値の県の順位の範囲に入れば誤りではない。
 */
export function isTieNotation(issue, rows) {
  const m = /本文「(?:(\S{2,3}?)\.\.\.(\d+)位|(\d+)位\.\.\.(\S{2,3}?))」/.exec(issue);
  if (!m) return false;
  const pref = m[1] ?? m[4];
  const stated = Number(m[2] ?? m[3]);
  const row = rows.find((r) => r.areaName.startsWith(pref));
  if (!row) return false;
  const above = rows.filter((r) => r.value > row.value).length;
  const tied = rows.filter((r) => r.value === row.value).length;
  return tied > 1 && stated > above && stated <= above + tied;
}

/** 本文で最も多く書かれた年のうち、指標に値がある年。題名に年が無い記事に使う */
export function yearOfBody(markdown, availableYears) {
  const counts = new Map();
  for (const m of markdown.matchAll(/(?<!\d)((?:19|20)\d{2})年/g)) if (availableYears.includes(m[1])) counts.set(m[1], (counts.get(m[1]) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1] || b[0].localeCompare(a[0]))[0]?.[0] ?? null;
}

/** 指標の 1 年分を作業用の data/ に置いて本文の順位・値を照らし、確認済みを除いて合わない主張を返す */
async function bodyClaimIssues(draft, rankingKey, rows, reviewed) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'note-figure-'));
  try {
    const item = await fetchWithRetry(`${R2}/app/ranking/${rankingKey}/item.json`);
    const label = (item ? JSON.parse(item).title : null) ?? rankingKey;
    const sorted = [...rows].sort((a, b) => b.value - a.value);
    const data = sorted.map((r) => ({ areaName: r.areaName, rank: sorted.findIndex((o) => o.value === r.value) + 1, value: r.value, label, unit: r.unit ?? '' }));
    fs.writeFileSync(path.join(dir, 'ranking.json'), JSON.stringify(data));
    // 逆引き (「1位…秋田」) は同じ文の別の県を拾う。実物で確かめた 67 本はどれも題名の 1 位が今の値と一致していたので数えない
    const { blockers, warnings } = checkArticleFactual(draft, dir);
    const claims = [...blockers, ...warnings.filter((w) => w.startsWith('VALUE_MISMATCH'))];
    return claims.filter((issue) => !issue.startsWith('INVERSE_RANK_MISMATCH') && !isTieNotation(issue, rows) && !reviewed.includes(issue));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

const valuesCache = new Map();
const prefectureRows = (key) => {
  if (!valuesCache.has(key)) valuesCache.set(key, fetchWithRetry(`${R2}/app/stats/${key}/values.json`).then((text) => (text ? JSON.parse(text).rows : null)));
  return valuesCache.get(key).then((rows) => (rows ?? []).filter((r) => r.value !== null && /^\d{2}000$/.test(r.areaCode) && r.areaCode !== '00000'));
};

/** 本文が note.com にしか無い記事 (すべて無料) を公開 API から読む */
async function readNoteBody(article) {
  const id = /\/n\/(n[a-f0-9]+)/.exec(article.noteUrl ?? '')?.[1];
  if (!id) return null;
  const detail = await fetchNoteDetail(id).catch(() => null);
  return detail?.body ? noteHtmlToMarkdown(detail.body) : null;
}

async function inspectArticle(article, readFile, reviews) {
  const entry = { key: article.key, noteUrl: article.noteUrl, isPaid: Boolean(article.isPaid), store: article.body.store };
  const reviewed = reviews[article.key]?.map((r) => r.issue) ?? [];
  const noteOnly = article.body.store === 'note-only' || !article.body.manifest;
  const draft = noteOnly ? await readNoteBody(article) : await readFile(article, 'draft.md');
  if (draft === null) return { ...entry, figures: [], valueCheck: 'body-unread' };
  const provenanceText = noteOnly ? null : await readFile(article, 'data-provenance.json');
  const provenance = provenanceText ? JSON.parse(provenanceText) : null;
  const chartText = noteOnly ? null : await readFile(article, 'chart-data.json');
  const chart = chartText ? JSON.parse(chartText) : null;
  const rankingKey = provenance?.rankingKey ?? chart?._meta?.rankingKey ?? rankingKeyOfTargets(article.stats47Targets);
  const charts = Array.isArray(provenance?.charts) ? provenance.charts : [];
  const figures = bodyImagesOf(draft, { remote: noteOnly }).map(({ file, section }) => ({ file, kind: figureKindOf(file, charts, section, Boolean(rankingKey)) }));
  const hasDataFigure = figures.some((f) => f.kind !== 'diagram');
  if (article.vertical === 'product-sales') return { ...entry, figures, valueCheck: 'product-sample' };
  if (!rankingKey) return { ...entry, figures, valueCheck: hasDataFigure ? 'unmapped' : 'no-data-figure' };
  if (!hasDataFigure && !provenance) return { ...entry, rankingKey, figures, valueCheck: 'no-data-figure' };
  const metricRows = await prefectureRows(rankingKey);
  const year = String(provenance?.year ?? chart?._meta?.year ?? '') || yearOfTitle(article.title)
    || yearOfBody(draft, [...new Set(metricRows.map((r) => String(r.yearCode)))]);
  if (!year) return { ...entry, rankingKey, figures, valueCheck: 'no-year' };
  const located = { ...entry, rankingKey, year, figures };
  const rows = metricRows.filter((r) => String(r.yearCode) === year);
  if (rows.length === 0) return { ...located, valueCheck: 'year-gone' };
  const changed = chart ? countChangedValues(chart.data, new Map(rows.map((r) => [String(r.areaCode), r.value]))) : null;
  if (changed > 0) return { ...located, valueCheck: 'changed', changedPrefectures: changed };
  const issues = await bodyClaimIssues(draft, rankingKey, rows, reviewed);
  if (issues.length > 0) return { ...located, valueCheck: 'body-differs', bodyIssues: issues.length, bodyIssueSample: issues.slice(0, 5) };
  return { ...located, valueCheck: chart ? 'match' : 'body-match' };
}

const tally = (articles) => {
  const byValueCheck = {};
  for (const a of articles) byValueCheck[a.valueCheck] = (byValueCheck[a.valueCheck] ?? 0) + 1;
  return { articles: articles.length, figures: articles.reduce((n, a) => n + a.figures.length, 0), byValueCheck };
};

async function main(argv) {
  dotenv.config({ path: path.join(ROOT, '.env.local'), quiet: true });
  if (argv.includes('--check')) return checkLedger();
  const publicOnly = argv.includes('--public-only');
  const hasCredentials = Boolean(process.env.R2_S3_ENDPOINT && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY);
  if (!publicOnly && !hasCredentials) throw Error('有料記事を読むには R2 の S3 認証が要る。手元では --public-only');
  const published = readArticleLedger().articles.filter((a) => a.status === 'published');
  const targets = publicOnly ? published.filter((a) => a.body.store !== 'r2-private') : published;
  const privateStore = hasCredentials ? createR2Store({ bucket: R2_PRIVATE_BUCKET }) : null;
  const readFile = async (article, name) => {
    if (article.body.store === 'r2-public') return fetchWithRetry(`${R2}/${article.r2Path}/${name}`);
    const bytes = await privateStore.get(`${article.r2Path}/${name}`);
    return bytes ? bytes.toString('utf8') : null;
  };
  const reviews = JSON.parse(fs.readFileSync(REVIEWS, 'utf8')).reviews;
  const articles = [];
  for (let i = 0; i < targets.length; i += CONCURRENCY) {
    articles.push(...await Promise.all(targets.slice(i, i + CONCURRENCY).map((a) => inspectArticle(a, readFile, reviews))));
  }
  articles.sort((a, b) => a.key.localeCompare(b.key));
  const summary = tally(articles);
  console.log(JSON.stringify(summary));
  for (const a of articles.filter((x) => ['changed', 'body-differs'].includes(x.valueCheck))) console.log(`${a.key}: ${a.rankingKey} ${a.year} ${a.valueCheck} ${a.changedPrefectures ?? a.bodyIssues} ${(a.bodyIssueSample ?? []).join(' / ').slice(0, 120)}`);
  const out = argv.includes('--out') ? argv[argv.indexOf('--out') + 1] : null;
  if (publicOnly && !out) return;
  fs.writeFileSync(out ?? LEDGER, `${JSON.stringify({ schemaVersion: 1, summary, articles }, null, 2)}\n`);
}

/** 直すべき記事を一覧にし、上限 (縮小専用) を超えたら止める */
function checkLedger() {
  const ledger = JSON.parse(fs.readFileSync(LEDGER, 'utf8'));
  const { maxArticlesToFix } = JSON.parse(fs.readFileSync(path.join(ROOT, '.claude/config/note-figure-baseline.json'), 'utf8'));
  const toFix = ledger.articles.filter((a) => a.valueCheck === 'changed' || a.valueCheck === 'body-differs');
  console.log(`note 本文の図: 記事 ${ledger.summary.articles} / 図 ${ledger.summary.figures} / 直すべき記事 ${toFix.length} (上限 ${maxArticlesToFix})`);
  for (const a of toFix) console.log(`- ${a.key}: ${a.rankingKey} ${a.year} ${(a.bodyIssueSample ?? []).join(' / ') || `値の違う県 ${a.changedPrefectures}`}`);
  if (toFix.length > maxArticlesToFix) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
