/**
 * article-structure-lint — ブログ記事の構造品質 lint (共有ライブラリ)
 *
 * quality-gate.mjs (単一記事ゲート) と audit-article-structure.mjs (全記事バッチ) で共有。
 *
 * 現在の検査:
 *   - source-link 配置: /ranking/ への <source-link> が記事末尾 (まとめ/関連セクション以降)
 *     に集約されていないか。ランキングリンクは対応する図・データを扱うセクション内に
 *     インライン配置すべき (末尾集約は回遊性・文脈性を損なう)。
 *
 * 設計方針 (CLAUDE.md 原則 5): 構造品質の機械判定可能な部分はコードで一律検査する。
 * 「どの図にどのリンクを置くか」の意味判断は agent (brushup) に委ねる。
 *
 * 補足: /category/ /themes/ への <source-link> はナビゲーション目的のため末尾配置を許容。
 *   検査対象は図・データと対応する /ranking/ リンクに限定する。
 */

/** frontmatter (先頭の --- ... ---) を除いた本文を返す */
function stripFrontmatter(md) {
  const m = md.match(/^---\n[\s\S]*?\n---\n?/);
  return m ? md.slice(m[0].length) : md;
}

/**
 * 末尾ゾーンの開始位置を求める。
 * 「## まとめ / おわりに / 結論」見出し、なければ「### 関連記事」、
 * いずれも無ければ本文末尾 25% 地点。
 */
function findTailZoneStart(body) {
  const tailHeading = body.match(/\n##\s*(まとめ|おわりに|結論|さいごに)/);
  if (tailHeading) return tailHeading.index;
  const relatedHeading = body.match(/\n###?\s*関連記事/);
  if (relatedHeading) return relatedHeading.index;
  return Math.floor(body.length * 0.75);
}

/** /ranking/ への <source-link> の出現位置 (本文内 index) を列挙 */
function rankingSourceLinkIndices(body) {
  const indices = [];
  const re = /<source-link\s+href="\/ranking\/[^"]*"\s*>/g;
  let m;
  while ((m = re.exec(body)) !== null) indices.push(m.index);
  return indices;
}

/** 図 (markdown 画像 + インライン svg) の数を数える */
function countFigures(body) {
  const images = (body.match(/!\[[^\]]*\]\([^)]+\)/g) || []).length;
  const svgs = (body.match(/<svg[\s\S]*?<\/svg>/g) || []).length;
  return images + svgs;
}

/**
 * source-link 配置を lint する。
 * @param {string} md - article.md 全文 (frontmatter 含む)
 * @returns {{ warnings: string[], stats: object }}
 */
export function lintSourceLinkPlacement(md) {
  const warnings = [];
  const body = stripFrontmatter(md);

  const tailStart = findTailZoneStart(body);
  const rankingLinks = rankingSourceLinkIndices(body);
  const tailLinks = rankingLinks.filter((i) => i >= tailStart);
  const inlineLinks = rankingLinks.filter((i) => i < tailStart);
  const figures = countFigures(body);

  // アンチパターン: /ranking/ source-link が末尾ゾーンに 2 個以上集約
  if (tailLinks.length >= 2) {
    warnings.push(
      `/ranking/ への source-link が末尾に ${tailLinks.length} 個集約されている` +
        ` (本文中インライン: ${inlineLinks.length} 個)。` +
        ` 各ランキングリンクは対応する図・データを扱うセクション (SVG 図の直下等) に分散配置すべき。`,
    );
  }

  return {
    warnings,
    stats: {
      rankingSourceLinks: rankingLinks.length,
      tailRankingLinks: tailLinks.length,
      inlineRankingLinks: inlineLinks.length,
      figures,
    },
  };
}
