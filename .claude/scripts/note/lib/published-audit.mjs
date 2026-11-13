/**
 * note 公開記事の機械採点 (純粋関数)。取得は audit-note-published.mjs が行い、ここは判定だけを持つ。
 * 公開ページの実物 (本文 HTML・画像の寸法と中身・導線カード) を測り、記事ごとの違反と点数にする。
 * 文章の意味の正しさは判定しない (第 2 段の意味レビューの担当)。
 */
import { NOTE_RANKING_IMAGES } from './note-render-spec.mjs';

/** ランキング本文画像の共通の型の寸法 (note-render-spec が正本) */
export const TYPE_SIZE = { width: NOTE_RANKING_IMAGES[0].width, height: NOTE_RANKING_IMAGES[0].height };
export const TYPE_IMAGE_COUNT = NOTE_RANKING_IMAGES.length;

/** 違反コードと減点。点数は 100 からの減点で、同じコードは 1 回だけ引く */
export const WEIGHTS = {
  image_fetch_failed: 20, // 本文画像を取得できない
  ranking_image_not_type: 25, // ランキング記事なのに共通の型の画像が 3 枚そろっていない
  image_duplicate: 10, // 同じ画像を 2 か所以上に貼っている
  source_card_unrelated: 20, // 「この記事の元データ」のカードが別の指標の記事を指している
  source_card_unverifiable: 5, // 同カードの行き先を台帳で確かめられない
  stale_year: 10, // 記事の年が、サイトにある最新の年より古い
  figure_value_mismatch: 20, // 図・本文の値が今の値と合わない (本文の図の台帳の判定)
  card_visibility_issue: 10, // カードが公開ページで表示されていない (カード監査の判定)
};

export function pngSize(buffer) {
  if (!buffer || buffer.length < 24 || buffer.subarray(1, 4).toString('ascii') !== 'PNG') return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

export const noteIdOf = (url) => String(url ?? '').match(/\/n\/(n[0-9a-f]+)/i)?.[1] ?? null;

export function rankingKeysOf(targets) {
  return (targets ?? []).filter((t) => t.startsWith('/ranking/')).map((t) => t.slice('/ranking/'.length).split(/[?#/]/)[0]);
}

const textOf = (html) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

/** 公開本文 HTML から本文画像の URL と、導線カード (直前の太字の見出し文 + 行き先) を取り出す */
export function parseBody(html) {
  const images = [...html.matchAll(/<img[^>]+src="([^"]+)"/g)].map((m) => m[1]);
  // 見出しが新しくても説明文に「この記事の元データ」が残る記事があるので、段落の全体を label に持つ
  const cards = [...html.matchAll(/<p[^>]*><strong>([^<]+)<\/strong>((?:(?!<\/p>)[\s\S])*)<\/p>\s*<figure[^>]*data-src="([^"]+)"/g)]
    .map((m) => ({ label: `${m[1].trim()} ${textOf(m[2]).trim()}`.trim(), target: m[3] }));
  return { images, cards, text: textOf(html) };
}

/** 記事が扱う年。題名に年があればそれ、無ければ本文冒頭で最も多く出る年 */
export function articleYearOf(title, text) {
  const inTitle = title.match(/(20\d\d)年/);
  if (inTitle) return Number(inTitle[1]);
  const counts = new Map();
  for (const m of text.slice(0, 2000).matchAll(/(20\d\d)年度?/g)) counts.set(m[1], (counts.get(m[1]) ?? 0) + 1);
  const top = [...counts].sort((a, b) => b[1] - a[1])[0];
  return top ? Number(top[0]) : null;
}

/**
 * 1 記事を採点する。
 * @param article   カタログの記事 (key・title・isPaid・stats47Targets)
 * @param body      parseBody の結果
 * @param images    [{ src, ok, width, height, sha }] 取得した本文画像
 * @param context   { byNoteId: Map<noteId, catalog article>, latestYear, figureCheck, cardIssues }
 */
export function auditArticle(article, body, images, context) {
  const issues = [];
  const add = (code, detail) => issues.push({ code, detail });
  const rankingKeys = rankingKeysOf(article.stats47Targets);
  // 型の対象: 無料のランキング記事 (系列 A・ランキング 1 本を指す)。有料は公開 API に本文の全体が出ないので測らない
  const isRankingArticle = article.series === 'A' && rankingKeys.length === 1 && !article.isPaid;

  const failed = images.filter((i) => !i.ok);
  if (failed.length > 0) add('image_fetch_failed', `${failed.length} 枚を取得できない`);

  if (isRankingArticle) {
    const typed = images.filter((i) => i.width === TYPE_SIZE.width && i.height === TYPE_SIZE.height).length;
    if (typed < TYPE_IMAGE_COUNT) {
      const sizes = images.filter((i) => i.ok).map((i) => `${i.width}x${i.height}`).join(',') || '画像なし';
      add('ranking_image_not_type', `型 ${TYPE_SIZE.width}x${TYPE_SIZE.height} が ${typed}/${TYPE_IMAGE_COUNT} 枚 (実物: ${sizes})`);
    }
  }

  const seen = new Map();
  for (const image of images.filter((i) => i.sha)) seen.set(image.sha, (seen.get(image.sha) ?? 0) + 1);
  const duplicated = [...seen.values()].filter((n) => n > 1).length;
  if (duplicated > 0) add('image_duplicate', `同じ画像が ${duplicated} 組`);

  for (const card of body.cards.filter((c) => c.label.includes('元データ'))) {
    const target = context.byNoteId.get(noteIdOf(card.target));
    const targetKeys = rankingKeysOf(target?.stats47Targets);
    // データセット商品 (系列 D) は多数の指標を収録するが、台帳の指標は代表の 1 本だけなので、一致しなくても無関係と言えない
    if (!target || targetKeys.length === 0 || rankingKeys.length === 0 || target.series === 'D') add('source_card_unverifiable', `行き先 ${card.target} が収録する指標を台帳で確かめられない`);
    else if (!targetKeys.some((k) => rankingKeys.includes(k))) add('source_card_unrelated', `記事は ${rankingKeys.join(',')}・行き先「${target.title}」は ${targetKeys.join(',')}`);
  }

  const year = articleYearOf(article.title, body.text);
  if (isRankingArticle && year && context.latestYear && year < context.latestYear) add('stale_year', `記事 ${year} 年・サイトの最新 ${context.latestYear} 年`);

  if (['changed', 'body-differs', 'unmapped'].includes(context.figureCheck)) add('figure_value_mismatch', `本文の図の台帳: ${context.figureCheck}`);
  if (context.cardIssues?.length > 0) add('card_visibility_issue', context.cardIssues.join(','));

  const score = Math.max(0, 100 - [...new Set(issues.map((i) => i.code))].reduce((sum, code) => sum + WEIGHTS[code], 0));
  return { score, issues, year, isRankingArticle };
}

export function summarize(rows) {
  const byCode = {};
  for (const row of rows) for (const code of new Set(row.issues.map((i) => i.code))) byCode[code] = (byCode[code] ?? 0) + 1;
  const audited = rows.filter((r) => r.score !== null);
  const band = (lo, hi) => audited.filter((r) => r.score >= lo && r.score <= hi).length;
  return {
    articles: rows.length,
    unread: rows.length - audited.length,
    clean: audited.filter((r) => r.issues.length === 0).length,
    byCode,
    scoreBands: { '100': band(100, 100), '80-99': band(80, 99), '60-79': band(60, 79), '0-59': band(0, 59) },
  };
}

/**
 * 縮小専用の上限 (.claude/config/note-published-baseline.json) と今の本数を比べる。
 * 上限に載せたコードだけを見る (カード表示・図の値は元の監査が自分の上限を持つ)。
 */
export function checkBaseline(summary, baseline) {
  const counts = { ...Object.fromEntries(Object.keys(baseline.maxByCode).map((code) => [code, summary.byCode[code] ?? 0])), lowScore: summary.scoreBands['0-59'] };
  const limits = { ...baseline.maxByCode, lowScore: baseline.maxLowScore };
  const exceeded = Object.keys(limits).filter((key) => counts[key] > limits[key]).map((key) => ({ key, count: counts[key], max: limits[key] }));
  const shrinkable = Object.keys(limits).filter((key) => counts[key] < limits[key]).map((key) => ({ key, count: counts[key], max: limits[key] }));
  return { ok: exceeded.length === 0, exceeded, shrinkable };
}

/** 違反の種類ごとの直し方。tool の <key> を記事キーに置き換えて dry-run し、確かめてから --commit を付ける */
export const REMEDIATION_ROUTES = [
  { kind: 'dataset-card-wording', tool: 'node .claude/scripts/note/update-published-navigation.mjs --slug <key>', match: (row) => hasCode(row, 'source_card_unverifiable') || hasCode(row, 'source_card_unrelated') },
  { kind: 'ranking-image-type', tool: 'node .claude/scripts/note/update-note-body-figures.mjs --key <key>', match: (row) => hasCode(row, 'ranking_image_not_type') && row.hasChartData },
  { kind: 'ranking-image-type-no-chart-data', tool: null, blocked: 'chart-data.json が無い記事。R2 の値と記事の年から固定コピーを作る手順が先に要る', match: (row) => hasCode(row, 'ranking_image_not_type') && !row.hasChartData },
  { kind: 'semantic-review', tool: null, blocked: '機械では直せない。note-critic に該当の段落と 47 県の値だけを渡して読む', match: (row) => hasCode(row, 'figure_value_mismatch') || (row.score !== null && row.score < 60) },
];

const hasCode = (row, code) => row.issues.some((issue) => issue.code === code);

/**
 * 次に直す記事を、直し方ごとに並べる。閲覧の多い記事から、閲覧の記録が無ければ点数の低い記事から。
 * @param views Map<記事 key, 閲覧数> (土曜の記録 data/note/dashboard/latest.json)
 */
export function buildQueue(rows, views) {
  return REMEDIATION_ROUTES.map(({ kind, tool, blocked, match }) => {
    const keys = rows.filter((row) => !row.unread && match(row))
      .sort((a, b) => (views.get(b.key) ?? -1) - (views.get(a.key) ?? -1) || a.score - b.score || a.key.localeCompare(b.key))
      .map((row) => row.key);
    return { kind, tool, ...(blocked ? { blocked } : {}), total: keys.length, keys };
  });
}
