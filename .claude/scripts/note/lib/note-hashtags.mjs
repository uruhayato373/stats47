/** Approved note hashtags: one git table keyed by article key (ledger note.hashtags), validated before it can reach note. */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { datasetPath } from '../../../../config/datasets.mjs';
import { PREF_NAMES } from '../../lib/prefectures.cjs';

export const HASHTAG_COUNT = 99;
export const HASHTAG_MODEL = 'claude-sonnet-5-5';
export const HASHTAG_FILE = datasetPath('note.hashtags');
const MAX_LENGTH = 25;
// note silently drops tags with other scripts (2026-10-03: #αモデル vanished after a successful update).
const ACCEPTED = /^#[0-9A-Za-z\u3041-\u3096\u30A1-\u30FA\u30FC\u30FB\u4E00-\u9FFF\u3005\uFF10-\uFF19\uFF21-\uFF3A\uFF41-\uFF5A_]+$/u;

/** Tags that describe note itself or ask for engagement, not the article's subject. */
export const GENERIC_HASHTAGS = new Set([
  '#note', '#noteクリエイター', '#毎日note', '#note記事', '#note初心者', '#読んで欲しい', '#フォロー',
  '#スキしてみて', '#クリエイター', '#情報発信', '#コンテンツ', '#マガジン', '#最新データ', '#まとめ',
  '#トレンド', '#注目', '#おすすめ', '#必読', '#知識', '#勉強', '#学び', '#インサイト', '#情報', '#知る',
  '#発見', '#無料', '#役立つ', '#保存版', '#シェアしたい', '#役に立つ情報', '#興味深い', '#面白い', '#へぇ',
  '#知らなかった', '#目からウロコ', '#なるほど', '#深い', '#勉強になる', '#ためになる', '#自己啓発',
  '#ライフスタイル', '#話題', '#人気', '#拡散希望', '#いいね', '#相互フォロー',
]);

const PREFECTURES = PREF_NAMES;

export function plainText(html) {
  return String(html ?? '').replace(/<(script|style)[\s\S]*?<\/\1>/g, ' ').replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
}

export const sourceSha256 = (title, text) => createHash('sha256').update(`${title}\n${text}`).digest('hex');

/** Prefectures named in the title must be findable by their own tag. */
export function requiredHashtags(title) {
  return PREFECTURES.filter((name) => title.includes(name)).map((name) => `#${name}`);
}

/** `text: null` re-checks a stored file without the article body (the year rule needs the body). */
export function validateHashtags(tags, { title, text }) {
  const errors = [];
  if (!Array.isArray(tags)) return { ok: false, errors: ['tags is not an array'] };
  const seen = new Set();
  for (const tag of tags) {
    if (typeof tag !== 'string' || !/^#[^#\s\-]+$/.test(tag)) errors.push(`format: ${tag}`);
    else if (!ACCEPTED.test(tag)) errors.push(`characters note drops: ${tag}`);
    else if (/^#\d+$/.test(tag)) errors.push(`numbers only: ${tag}`);
    else if ([...tag].length > MAX_LENGTH) errors.push(`too long: ${tag}`);
    else if (GENERIC_HASHTAGS.has(tag)) errors.push(`generic: ${tag}`);
    else if (text != null && /^#(19|20)\d{2}年/.test(tag) && !`${title} ${text}`.includes(tag.slice(1, 6))) errors.push(`year not in article: ${tag}`);
    // note treats #CLI and #cli as one tag.
    const key = String(tag).normalize('NFKC').toLowerCase();
    if (seen.has(key)) errors.push(`duplicate: ${tag}`);
    seen.add(key);
  }
  if (tags.length !== HASHTAG_COUNT) errors.push(`count ${tags.length} != ${HASHTAG_COUNT}`);
  for (const tag of requiredHashtags(title)) if (!seen.has(tag.normalize('NFKC').toLowerCase())) errors.push(`missing title region: ${tag}`);
  return { ok: errors.length === 0, errors };
}

function checkSlug(slug) {
  if (!/^[\w-]+$/.test(slug)) throw Error(`invalid slug: ${slug}`);
}

/** The whole table `{ hashtags: { <article key>: { tags, sourceSha256, model, generatedAt } } }`. */
export function readHashtagTable(root) {
  const file = path.join(root, HASHTAG_FILE);
  if (!fs.existsSync(file)) throw Error(`hashtag table missing: ${HASHTAG_FILE}`);
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

/** Replace one article's record and rewrite the whole table, keys sorted by article key. */
export function writeHashtagRecord(root, slug, { tags, sourceSha256, model, generatedAt }) {
  checkSlug(slug);
  const table = readHashtagTable(root);
  const hashtags = { ...table.hashtags, [slug]: { tags, sourceSha256, model, generatedAt } };
  const sorted = Object.fromEntries(Object.keys(hashtags).sort().map((key) => [key, hashtags[key]]));
  fs.writeFileSync(path.join(root, HASHTAG_FILE), `${JSON.stringify({ ...table, hashtags: sorted }, null, 2)}\n`);
}

/** Only tags that still pass the gate for the article in the article ledger (title joined from there) may be published. */
export function readApprovedHashtags(root, slug, { noteUrl }) {
  checkSlug(slug);
  const record = readHashtagTable(root).hashtags[slug];
  if (!record) throw Error(`hashtags missing: ${slug} (${HASHTAG_FILE})`);
  const { articles } = JSON.parse(fs.readFileSync(path.join(root, datasetPath('note.articles')), 'utf8'));
  const article = articles.find((a) => a.key === slug);
  if (!article || article.noteUrl !== noteUrl) throw Error(`hashtag article identity mismatch: ${slug}`);
  const check = validateHashtags(record.tags, { title: article.title, text: null });
  if (!check.ok) throw Error(`hashtags invalid: ${slug}: ${check.errors.join('; ')}`);
  return record.tags;
}
