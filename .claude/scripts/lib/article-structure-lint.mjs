/**
 * article-structure-lint — ブログ記事の構造品質 lint (共有ライブラリ)
 *
 * quality-gate.mjs (単一記事ゲート) / audit-article-structure.mjs (全記事バッチ) /
 * audit-published-blog.mjs (公開済み棚卸し) で共有する。実装をここ 1 箇所に集約し、
 * 各スクリプトに同種チェックのコピーを持たせない (ドリフト防止)。
 *
 * 検査対象: /ranking/ への <source-link> カードの配置。
 * カードは「そのセクションの主題データへ深掘りする 1 枚」であってリンク集ではない。
 * 束ねて並べるとどのカードがどの図に対応するか文脈が失われ、読者には無関係なリンクの
 * 羅列に見える (2026-07-24 に /blog/black-tea-income-gap で実際に報告された)。
 *
 *   dup-ranking-link   同一 /ranking/<key> へのカードが記事内に 2 枚以上   → blocker
 *   adjacent-cluster   カードが空白のみを挟んで 2 枚以上連続              → blocker
 *   no-figure-section  図が 1 枚も無い H2 セクション内にカードがある      → blocker
 *   tail-cluster       末尾ゾーン (まとめ以降) にカードが 2 枚以上        → blocker
 *   offtopic-link      指標名がそのセクションの散文に出てこない            → warning
 *
 * 束ねたい場合・図の無い節から誘導したい場合は、カードではなくインラインテキストリンク
 * (`あわせて見る: [ラベル](/ranking/key)`) を使う。既存記事の一括是正は
 * .claude/scripts/blog/fix-source-link-placement.mjs が行う。
 *
 * 設計方針 (CLAUDE.md 原則 5): 構造品質の機械判定可能な部分はコードで一律検査する。
 * 「どの図にどのリンクを置くか」の意味判断は agent (brushup / blog-critic) に委ねる。
 *
 * 補足: /category/ /themes/ への <source-link> はナビゲーション目的のため末尾配置を許容。
 *   検査対象は図・データと対応する /ranking/ リンクに限定する。
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const METRICS_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../packages/data-configs/src/metrics",
);

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

/** H2 セクションに分割 (先頭の導入部も 1 セクションとして扱う) */
function findSections(body) {
  const starts = [];
  const re = /^## .*$/gm;
  let m;
  while ((m = re.exec(body)) !== null) starts.push({ index: m.index, heading: m[0] });
  const secs = [];
  if (starts.length === 0 || starts[0].index > 0) {
    secs.push({ start: 0, end: starts.length ? starts[0].index : body.length, heading: "" });
  }
  for (let i = 0; i < starts.length; i++) {
    secs.push({
      start: starts[i].index,
      end: i + 1 < starts.length ? starts[i + 1].index : body.length,
      heading: starts[i].heading,
    });
  }
  for (const s of secs) s.text = body.slice(s.start, s.end);
  return secs;
}

/** /ranking/ への <source-link> を列挙 (位置・key・ラベル付き) */
function findRankingLinks(body) {
  const links = [];
  const re = /<source-link\s+href="\/ranking\/([^"]+)"\s*>([\s\S]*?)<\/source-link>/g;
  let m;
  while ((m = re.exec(body)) !== null) {
    links.push({
      index: m.index,
      end: m.index + m[0].length,
      key: m[1].replace(/\/$/, ""),
      label: m[2].trim(),
    });
  }
  return links;
}

/** 図 (markdown 画像 + インライン svg) の数を数える */
function countFigures(text) {
  const images = (text.match(/!\[[^\]]*\]\([^)]+\)/g) || []).length;
  const svgs = (text.match(/<svg[\s\S]*?<\/svg>/g) || []).length;
  return images + svgs;
}

const titleCache = new Map();
/** metric config (git TS) から指標の正準名を引く。config が無い key は null (検査スキップ) */
function metricTitle(key) {
  if (titleCache.has(key)) return titleCache.get(key);
  let t = null;
  try {
    const p = path.join(METRICS_DIR, `${key}.ts`);
    if (fs.existsSync(p)) {
      const m = fs.readFileSync(p, "utf8").match(/"?title"?:\s*"([^"]+)"/);
      if (m) t = m[1];
    }
  } catch {
    t = null;
  }
  titleCache.set(key, t);
  return t;
}

/**
 * source-link 配置を lint する。
 * @param {string} md - article.md 全文 (frontmatter 含む)
 * @returns {{ blockers: string[], warnings: string[], stats: object }}
 */
export function lintSourceLinkPlacement(md) {
  const blockers = [];
  const warnings = [];
  const body = stripFrontmatter(md);

  const tailStart = findTailZoneStart(body);
  const sections = findSections(body);
  const links = findRankingLinks(body);
  const tailLinks = links.filter((l) => l.index >= tailStart);
  const inlineLinks = links.filter((l) => l.index < tailStart);
  const figures = countFigures(body);

  // --- dup-ranking-link: 同じランキングのカードを 2 枚以上出さない
  const byKey = new Map();
  for (const l of links) byKey.set(l.key, (byKey.get(l.key) ?? 0) + 1);
  const dupKeys = [...byKey.entries()].filter(([, c]) => c > 1);
  if (dupKeys.length) {
    blockers.push(
      `[dup-ranking-link] 同一ランキングへの source-link カードが重複: ` +
        dupKeys.map(([k, c]) => `${k}×${c}`).join(", ") +
        ` — 初出 1 枚だけ残し、他は削除するかインラインリンクにする`,
    );
  }

  // --- adjacent-cluster: カードを並べない (どの図に対応するか分からなくなる)
  let clusters = 0;
  let clusterMax = 1;
  for (let i = 1, run = 1; i < links.length; i++) {
    const between = body.slice(links[i - 1].end, links[i].index);
    if (/^\s*$/.test(between)) {
      run++;
      if (run === 2) clusters++;
      clusterMax = Math.max(clusterMax, run);
    } else {
      run = 1;
    }
  }
  if (clusters > 0) {
    blockers.push(
      `[adjacent-cluster] source-link カードが連続配置されている (${clusters} 箇所・最大 ${clusterMax} 枚連続)` +
        ` — 対応する図を持つ 1 枚だけカードで残し、他は「あわせて見る: [ラベル](/ranking/key)」のインラインリンクにまとめる`,
    );
  }

  // --- no-figure-section: 図の無いセクションのカード
  const noFigure = [];
  for (const sec of sections) {
    const inSec = links.filter((l) => l.index >= sec.start && l.index < sec.end);
    if (inSec.length === 0) continue;
    if (countFigures(sec.text) === 0) noFigure.push(...inSec.map((l) => l.key));
  }
  if (noFigure.length) {
    blockers.push(
      `[no-figure-section] 図の無いセクションに source-link カードがある (${noFigure.length} 枚: ` +
        `${noFigure.slice(0, 4).join(", ")}${noFigure.length > 4 ? " 他" : ""})` +
        ` — カードは対応する図を持つセクションにのみ置く。図の無い節からの誘導はインラインリンクにする`,
    );
  }

  // --- tail-cluster: 末尾集約 (2026-07-24 に warning → blocker へ昇格)
  if (tailLinks.length >= 2) {
    blockers.push(
      `[tail-cluster] /ranking/ への source-link が末尾に ${tailLinks.length} 個集約されている` +
        ` (本文中インライン: ${inlineLinks.length} 個)。` +
        ` 各ランキングリンクは対応する図・データを扱うセクション (SVG 図の直下等) に分散配置すべき。`,
    );
  }

  // --- offtopic-link (warning): 指標名がその節の散文に出てこない = 題材のズレ疑い。
  //     表記ゆれで誤検知しうるので警告のみ。可否の意味判断は blog-critic に委ねる。
  const offtopic = [];
  for (const sec of sections) {
    const inSec = links.filter((l) => l.index >= sec.start && l.index < sec.end);
    if (inSec.length === 0) continue;
    const prose = sec.text.replace(/<source-link[\s\S]*?<\/source-link>/g, "");
    for (const l of inSec) {
      const t = metricTitle(l.key);
      if (t && !prose.includes(t)) offtopic.push(`${l.key}(${t})`);
    }
  }
  if (offtopic.length) {
    warnings.push(
      `[offtopic-link] 指標名がそのセクションの本文に出てこない source-link が ${offtopic.length} 件` +
        ` (${offtopic.slice(0, 3).join(", ")}${offtopic.length > 3 ? " 他" : ""})` +
        ` — 本文で触れていないランキングへ誘導していないか確認する`,
    );
  }

  return {
    blockers,
    warnings,
    stats: {
      rankingSourceLinks: links.length,
      tailRankingLinks: tailLinks.length,
      inlineRankingLinks: inlineLinks.length,
      figures,
      dupRankingLinks: dupKeys.reduce((a, [, c]) => a + (c - 1), 0),
      adjacentClusters: clusters,
      noFigureSectionLinks: noFigure.length,
      offtopicLinks: offtopic.length,
    },
  };
}
