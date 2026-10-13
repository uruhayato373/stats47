/**
 * 教材 (参考文献) の分析企画 × 展開先の状態を、展開記録 (data/source-inventory/expansion.json) と各チャネルの正本から決める。
 * 規約: .claude/rules/reference-source-standards.md §5「分析企画の展開」
 *
 * - 対象は採択した企画 (再利用・新指標・掛け合わせ) の contentRoles。文脈のみ・一次資料なし・対象外は制作単位にしない
 * - 済み (done) は公開中のページ ID を指す記録か、ランキング・調査・テーマ・全国では指標・調査が公開ページに載っていること (derived)
 * - 企画中 (planned)・見送り (declined) は記録だけで決まる。どれでもなければ未着手 (pending)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';
import { datasetDir, datasetPath } from '../../../../config/datasets.mjs';

export const EXPANSION_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
export const CHANNELS = ['ranking', 'survey', 'theme', 'area', 'japan', 'blog', 'note', 'x', 'instagram', 'youtube'];
/** 指標・調査が公開ページに載っていれば、記録なしで済みとみなす展開先 */
export const DERIVED_CHANNELS = new Set(['ranking', 'survey', 'theme', 'japan']);
const ADOPTED = new Set(['reuse-existing-metric', 'new-metric', 'combined-analysis']);
const TARGET_KINDS = {
  ranking: ['ranking', 'municipality-ranking'],
  survey: ['survey'],
  theme: ['theme', 'municipality-theme'],
  area: ['area', 'area-theme', 'city'],
  japan: ['japan-theme'],
  blog: ['blog'],
  note: ['note'],
  x: ['sns'],
  instagram: ['sns'],
  youtube: ['sns'],
};

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));

export function loadAnalyses(root = EXPANSION_ROOT) {
  const base = path.join(root, datasetDir('source-inventory.analyses'));
  const analyses = [];
  for (const sourceKey of fs.readdirSync(base).sort()) {
    const dir = path.join(base, sourceKey);
    if (!fs.statSync(dir).isDirectory()) continue;
    for (const edition of fs.readdirSync(dir).sort()) {
      const file = path.join(dir, edition, 'analyses.json');
      if (!fs.existsSync(file)) continue;
      for (const analysis of readJson(file).analyses) analyses.push({ ...analysis, sourceKey, edition });
    }
  }
  return analyses;
}

let validateShape;
export function loadExpansion(root = EXPANSION_ROOT) {
  const ledger = readJson(path.join(root, datasetPath('source-inventory.expansion')));
  validateShape ??= new Ajv({ allErrors: true }).compile(readJson(path.join(root, datasetPath('source-inventory.expansion-schema'))));
  if (!validateShape(ledger)) throw Error(`expansion schema: ${new Ajv().errorsText(validateShape.errors)}`);
  return ledger;
}

/** 各チャネルの正本から、ページ ID → 状態 の索引を作る。note は記事台帳、SNS は投稿台帳、ほかはページ ID の台帳 */
export function loadChannelIndex(root = EXPANSION_ROOT) {
  const pages = new Map();
  const pagesDir = path.join(root, datasetDir('content.pages'));
  for (const file of fs.readdirSync(pagesDir)) {
    if (!file.endsWith('.json')) continue;
    for (const p of readJson(path.join(pagesDir, file)).pages ?? [])
      pages.set(p.id, { kind: p.kind, published: p.published === true, rankingKeys: p.rankingKeys ?? [] });
  }
  for (const a of readJson(path.join(root, datasetPath('note.articles'))).articles) {
    const rankingKeys = (a.stats47Targets ?? []).map((t) => t.match(/^\/ranking\/([^/?#]+)/)?.[1]).filter(Boolean);
    pages.set(`note:${a.key}`, { kind: 'note', published: a.status === 'published', rankingKeys, title: a.title });
  }
  for (const p of readJson(path.join(root, datasetPath('sns.posts'))).posts ?? []) {
    pages.set(`sns:${p.id}`, {
      kind: 'sns', platform: p.platform, published: p.status === 'posted', exists: p.status !== 'deleted',
      rankingKeys: snsMetricKeys(p),
    });
  }
  return pages;
}

const kindOf = (target) => target.slice(0, target.indexOf(':'));

/** 投稿台帳の metric_keys は配列・カンマ区切りの文字列・null が混在する。null なら content_key を使う */
function snsMetricKeys(post) {
  const raw = post.metric_keys;
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string' && raw) return raw.split(',').map((k) => k.trim()).filter(Boolean);
  return post.content_key ? [post.content_key] : [];
}

/** 記録 1 件の検査。エラー文の配列を返す (空 = 合格) */
export function checkRecord(record, analysis, index) {
  const errors = [];
  const at = `${record.analysis} × ${record.channel}`;
  if (!analysis) return [`${at}: 分析企画が無い`];
  if (!analysis.contentRoles.includes(record.channel)) errors.push(`${at}: 企画の展開先 (contentRoles) に ${record.channel} が無い`);
  if (!record.target) return errors;
  if (!TARGET_KINDS[record.channel].includes(kindOf(record.target)))
    errors.push(`${at}: ${record.target} は ${record.channel} のページ ID ではない (${TARGET_KINDS[record.channel].join(' / ')})`);
  const page = index.get(record.target);
  if (page?.kind === 'sns' && page.platform !== record.channel)
    errors.push(`${at}: ${record.target} は ${page.platform} の投稿`);
  if (record.status === 'done' && !page?.published) errors.push(`${at}: 済みの記録が公開中でないページを指す (${record.target})`);
  return errors;
}

export function validateExpansion(ledger, analyses, index) {
  const byId = new Map(analyses.map((a) => [a.id, a]));
  const errors = ledger.records.flatMap((r) => checkRecord(r, byId.get(r.analysis), index));
  const seen = new Map();
  for (const r of ledger.records) {
    const key = `${r.analysis}|${r.channel}`;
    const statuses = seen.get(key) ?? new Set();
    if (r.status === 'declined' && statuses.has('declined')) errors.push(`${key}: 見送りの記録が重複`);
    statuses.add(r.status);
    seen.set(key, statuses);
  }
  for (const [key, statuses] of seen)
    if (statuses.has('declined') && statuses.has('done')) errors.push(`${key}: 済みと見送りが両方ある`);
  return errors;
}

function publishedKeys(index, kinds) {
  const keys = new Set();
  for (const [, p] of index) if (p.published && kinds.includes(p.kind)) for (const k of p.rankingKeys) keys.add(k);
  return keys;
}

function derivedDone(analysis, channel, index, themeKeys, japanKeys) {
  if (channel === 'ranking')
    return analysis.metricKeys.length > 0 && analysis.metricKeys.every((k) => index.get(`ranking:${k}`)?.published);
  if (channel === 'survey')
    return analysis.surveyIds.length > 0 && analysis.surveyIds.every((s) => index.get(`survey:${s}`)?.published);
  const keys = channel === 'theme' ? themeKeys : channel === 'japan' ? japanKeys : null;
  return Boolean(keys) && analysis.metricKeys.length > 0 && analysis.metricKeys.every((k) => keys.has(k));
}

/** 採択した企画 × 展開先ごとの状態。state は done / derived / planned / declined / pending */
export function expansionStatus(analyses, ledger, index) {
  const records = new Map();
  for (const r of ledger.records) {
    const key = `${r.analysis}|${r.channel}`;
    records.set(key, [...(records.get(key) ?? []), r]);
  }
  const themeKeys = publishedKeys(index, ['theme', 'municipality-theme']);
  const japanKeys = publishedKeys(index, ['japan-theme']);
  const rows = [];
  for (const analysis of analyses) {
    if (!ADOPTED.has(analysis.resolution)) continue;
    for (const channel of analysis.contentRoles) {
      const own = records.get(`${analysis.id}|${channel}`) ?? [];
      const done = own.filter((r) => r.status === 'done');
      let state = 'pending';
      if (done.length) state = 'done';
      else if (own.some((r) => r.status === 'declined')) state = 'declined';
      else if (DERIVED_CHANNELS.has(channel) && derivedDone(analysis, channel, index, themeKeys, japanKeys)) state = 'derived';
      else if (own.some((r) => r.status === 'planned')) state = 'planned';
      rows.push({ analysis, channel, state, records: own });
    }
  }
  return rows;
}

/** 未着手の企画に、同じ指標を使う公開中のページを候補として添える (結ぶかどうかは問いを読んで人と agent が決める) */
export function suggestTargets(analysis, channel, index, limit = 5) {
  const kinds = TARGET_KINDS[channel];
  const keys = new Set(analysis.metricKeys);
  const hits = [];
  for (const [id, p] of index) {
    if (!p.published || !kinds.includes(p.kind)) continue;
    if (p.kind === 'sns' && p.platform !== channel) continue;
    const overlap = p.rankingKeys.filter((k) => keys.has(k)).length;
    if (overlap) hits.push({ id, overlap });
  }
  return hits.sort((a, b) => b.overlap - a.overlap || (a.id < b.id ? -1 : 1)).slice(0, limit);
}
