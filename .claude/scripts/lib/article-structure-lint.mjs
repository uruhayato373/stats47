/**
 * article-structure-lint — ブログ記事の構造品質 lint (共有ライブラリ)
 *
 * quality-gate.mjs (単一記事ゲート) / audit-article-structure.mjs (全記事バッチ) /
 * audit-published-blog.mjs (公開済み棚卸し) で共有する。実装をここ 1 箇所に集約し、
 * 各スクリプトに同種チェックのコピーを持たせない (ドリフト防止)。
 *
 * 検査対象:
 *   - callout の連続配置
 *   - /ranking/ への <source-link> カードの配置
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

const CALLOUT_MARKER_RE = /^\s*>\s*\[!(NOTE|TIP|WARNING|IMPORTANT|CAUTION)\](?:\s+.*)?\s*$/i;
const FENCE_RE = /^\s*(?:>\s*)?(`{3,}|~{3,})/;
const CALLOUT_PRIORITY = { TIP: 1, NOTE: 2, IMPORTANT: 3, WARNING: 4, CAUTION: 5 };
const CALLOUT_INLINE_LABELS = {
  NOTE: "補足",
  TIP: "読み解きのポイント",
  WARNING: "注意",
  IMPORTANT: "重要",
  CAUTION: "要注意",
};

function findCalloutMarkers(lines) {
  const markers = [];
  let fenceChar = null;
  for (let i = 0; i < lines.length; i++) {
    const fence = lines[i].match(FENCE_RE);
    if (fence) {
      const char = fence[1][0];
      if (fenceChar === null) fenceChar = char;
      else if (fenceChar === char) fenceChar = null;
      continue;
    }
    if (fenceChar !== null) continue;

    const marker = lines[i].match(CALLOUT_MARKER_RE);
    if (marker) markers.push({ index: i, line: i + 1, type: marker[1].toUpperCase() });
  }
  return markers;
}

function findConsecutiveCalloutClusters(lines, markers) {
  const clusters = [];
  let run = markers.length > 0 ? [markers[0]] : [];
  for (let i = 1; i < markers.length; i++) {
    const previous = markers[i - 1];
    const current = markers[i];
    const between = lines.slice(previous.index + 1, current.index);
    const hasSeparatingContent = between.some(
      (line) => line.trim() !== "" && !/^\s*>/.test(line),
    );

    if (hasSeparatingContent) {
      if (run.length >= 2) clusters.push(run);
      run = [current];
    } else {
      run.push(current);
    }
  }
  if (run.length >= 2) clusters.push(run);
  return clusters;
}

/**
 * 通常本文・見出し・図表を挟まずに callout が続く箇所を lint する。
 * callout 本文の引用行と空行だけは「間に本文がある」と数えない。
 * fenced code 内の記法例は検査対象外。
 *
 * @param {string} md - article.md 全文 (frontmatter 含む)
 * @returns {{ blockers: string[], warnings: string[], stats: object }}
 */
export function lintConsecutiveCallouts(md) {
  const body = stripFrontmatter(md).replace(/\r\n/g, "\n");
  const lines = body.split("\n");
  const markers = findCalloutMarkers(lines);
  const clusters = findConsecutiveCalloutClusters(lines, markers);

  const pairCount = clusters.reduce((sum, cluster) => sum + cluster.length - 1, 0);
  const maxConsecutive = clusters.reduce((max, cluster) => Math.max(max, cluster.length), 1);
  const blockers = [];
  if (clusters.length > 0) {
    const samples = clusters
      .slice(0, 3)
      .map((cluster) => `L${cluster[0].line} ${cluster.map((item) => item.type).join("→")}`)
      .join(", ");
    blockers.push(
      `[adjacent-callouts] callout が通常本文・見出し・図表を挟まず連続している ` +
        `(${clusters.length} 箇所・${pairCount} 組・最大 ${maxConsecutive} 個連続: ${samples})` +
        ` — 最も重要な注意だけ callout に残し、分析・読み方・補足は通常本文へ戻すか、対応する節へ分散する`,
    );
  }

  return {
    blockers,
    warnings: [],
    stats: {
      calloutCount: markers.length,
      adjacentCalloutClusters: clusters.length,
      adjacentCalloutPairs: pairCount,
      maxConsecutiveCallouts: markers.length === 0 ? 0 : maxConsecutive,
      adjacentCalloutLocations: clusters.map((cluster) => ({
        line: cluster[0].line,
        types: cluster.map((item) => item.type),
      })),
    },
  };
}

/**
 * 連続 callout のうち最も重要な1つだけを残し、他をラベル付き通常本文へ戻す。
 * 文言・リンク・数値は変更しない。
 *
 * @param {string} md - article.md 全文
 * @returns {string}
 */
export function normalizeConsecutiveCallouts(md) {
  const newline = md.includes("\r\n") ? "\r\n" : "\n";
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const markers = findCalloutMarkers(lines);
  const clusters = findConsecutiveCalloutClusters(lines, markers);
  if (clusters.length === 0) return md;

  const demoted = new Map();
  for (const cluster of clusters) {
    const keeper = cluster.reduce((best, marker) =>
      CALLOUT_PRIORITY[marker.type] > CALLOUT_PRIORITY[best.type] ? marker : best,
    );
    for (const marker of cluster) {
      if (marker !== keeper) demoted.set(marker.index, marker.type);
    }
  }

  const output = [];
  for (let i = 0; i < lines.length; i++) {
    const type = demoted.get(i);
    if (!type) {
      output.push(lines[i]);
      continue;
    }

    const bodyLines = [];
    for (i = i + 1; i < lines.length && /^\s*>/.test(lines[i]); i++) {
      bodyLines.push(lines[i].replace(/^\s*>\s?/, ""));
    }
    i--;
    const label = CALLOUT_INLINE_LABELS[type] ?? "補足";
    output.push(`**${label}:** ${bodyLines.join("\n")}`);
  }
  return output.join(newline);
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
