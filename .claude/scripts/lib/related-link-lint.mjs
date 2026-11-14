/**
 * related-link-lint — 本文の `[表示名](/blog/<slug>)` が、リンク先の現在の題と無関係な呼び方になっていないかを検出する
 * (BLOG-REVISE-PATTERNS-01、2026-11-14 追加)。
 *
 * 事象: 2026-10-07 の 22 本の書き直しで、同時に書き直した姉妹記事 (unhealthy-period-gender-prefecture-gap と
 * healthy-life-expectancy-male-female-gap) への関連記事の紹介が、姉妹記事の新しい題・内容と食い違い、
 * critic が毎回目視で REVISE にした。critic の型は `related-link`。
 *
 * 表示名は題の言い換えが普通 (公開済み記事の内部リンクのうち題と完全一致は 4 件 / 55 件) なので、
 * 完全一致は求めない。次の 2 つだけを判定する。
 *
 *   NO_OVERLAP  表示名から「記事」「こちら」などの汎用語を除いた残りが、リンク先の題 (title / seoTitle / subtitle) と
 *               2 文字連続 (ひらがな・カタカナはそろえて比較) を 1 つも共有しない。別の話題を指している
 *   STALE_TITLE リンク先が送り箱で題を変えている最中のとき、表示名が台帳 (data/blog/ledger/articles.json) の
 *               旧題と一致し、新しい題とは一致しない。書き直しで題を変えた姉妹記事への古い紹介
 *
 * 判定しないもの: リンク先の題を引けない slug (実在は internal-link-lint が見る) / 汎用語だけの表示名 (「別記事」) /
 * source-link カード (題の言い換えではなく出典の説明を書く)。
 *
 * 実測 (2026-11-14・contents/blog の公開済み 294 本、内部リンク 55 件): 0 件。表示名が題と共有する 2 文字連続の最小は 1 つで、
 * 検査の境界は「0 個」に置いた (1 個以上の言い換えは正当な紹介として通す)。
 * 判定の力は限られる。題と少しでも語が重なる食い違い (姉妹記事の内容の取り違えなど) は引き続き critic が見る。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { datasetPath } from '../../../config/datasets.mjs';
import { extractInternalLinks } from './internal-link-lint.mjs';

const PROJECT_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  '..'
);

/** 紹介の定型で、話題を表さない語。除いたあとに残る語で題と照らす */
const GENERIC_WORDS = /こちらの?記事|別の?記事|前の?記事|次の?記事|記事|こちら|ページ|詳しく|詳細|解説|前編|後編|続編|関連|一覧/g;

/** 比較用の正規化: 全角半角をそろえ、カタカナをひらがなに寄せ、記号・空白を消す */
export function normalizeForLinkName(text) {
  return text
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))
    .replace(/[^\p{L}\p{N}]/gu, '');
}

function bigrams(normalized) {
  const out = new Set();
  for (let i = 0; i < normalized.length - 1; i++) out.add(normalized.slice(i, i + 2));
  return out;
}

function frontmatterValue(content, key) {
  const fm = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fm) return '';
  const line = fm[1].match(new RegExp(`^${key}:\\s*(.*)$`, 'm'));
  return line ? line[1].replace(/^["']|["']$/g, '') : '';
}

let ledgerCache = null;
function ledgerTitles() {
  if (ledgerCache) return ledgerCache;
  const file = path.join(PROJECT_ROOT, datasetPath('blog.articles'));
  const map = new Map();
  if (fs.existsSync(file)) {
    for (const a of JSON.parse(fs.readFileSync(file, 'utf8')).articles ?? []) {
      if (a.slug && a.title) map.set(a.slug, a.title);
    }
  }
  ledgerCache = map;
  return map;
}

/**
 * リンク先の題を引く。送り箱 (contents/blog/<slug>/article.md) に原稿があればその frontmatter が現在の題
 * (書き直し中の新しい題)。無ければ台帳の題。
 * @returns {{current: string[], ledger: string|null} | null}
 */
export function resolveBlogTitles(slug, root = PROJECT_ROOT) {
  const ledger = ledgerTitles().get(slug) ?? null;
  const draft = path.join(root, 'contents/blog', slug, 'article.md');
  if (fs.existsSync(draft)) {
    const md = fs.readFileSync(draft, 'utf8');
    const current = ['title', 'seoTitle', 'subtitle']
      .map((k) => frontmatterValue(md, k))
      .filter(Boolean);
    if (current.length > 0) return { current, ledger };
  }
  return ledger ? { current: [ledger], ledger } : null;
}

/**
 * @param {string} content article.md 全文
 * @param {{ resolve?: (slug: string) => ({current: string[], ledger: string|null} | null) }} [deps] テスト用の差し替え口
 * @returns {{blockers: string[], warnings: string[], hits: {slug: string, label: string, kind: 'no-overlap'|'stale-title'}[]}}
 */
export function lintRelatedLinkNames(content, deps = {}) {
  const resolve = deps.resolve ?? ((slug) => resolveBlogTitles(slug));
  const blockers = [];
  const hits = [];
  const seen = new Set();
  const report = (slug, label, kind, message) => {
    hits.push({ slug, label, kind });
    const key = `${kind}:${slug}:${label}`;
    if (seen.has(key)) return;
    seen.add(key);
    blockers.push(message);
  };

  for (const link of extractInternalLinks(content)) {
    if (link.type !== 'blog' || link.kind !== 'text' || link.segments.length !== 2) continue;
    const slug = link.segments[1];
    const titles = resolve(slug);
    if (!titles) continue;

    const normalizedLabel = normalizeForLinkName(link.label);
    const topic = normalizeForLinkName(link.label.replace(GENERIC_WORDS, ''));
    if (topic.length < 2) continue; // 汎用語だけ。話題を主張していない

    const currentNormalized = titles.current.map(normalizeForLinkName);
    if (
      titles.ledger &&
      normalizeForLinkName(titles.ledger) === normalizedLabel &&
      !currentNormalized.includes(normalizedLabel)
    ) {
      report(
        slug,
        link.label,
        'stale-title',
        `RELATED_LINK_STALE_TITLE: /blog/${slug} への表示名「${link.label}」は旧題です (現在の題: 「${titles.current[0]}」)。書き直しで題を変えた記事への紹介は、新しい題と内容に合わせて書き直してください`
      );
      continue;
    }

    const labelGrams = bigrams(topic);
    const titleGrams = new Set(currentNormalized.flatMap((t) => [...bigrams(t)]));
    if (![...labelGrams].some((g) => titleGrams.has(g))) {
      report(
        slug,
        link.label,
        'no-overlap',
        `RELATED_LINK_NO_OVERLAP: /blog/${slug} への表示名「${link.label}」が、リンク先の題「${titles.current[0]}」と語を 1 つも共有しません。別の記事を指している可能性があります。リンク先の現在の題と内容を読んで、表示名を書き直してください`
      );
    }
  }
  return { blockers, warnings: [], hits };
}
