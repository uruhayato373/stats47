/**
 * ブログ本文の `<data-source>` タグ (図ごとの出典) と、データから導出した出典の食い違いを数える純関数。
 *
 * 入力はどれも読み取っただけの値 (本文・図の source.json・snapshot の記事ごとの `sources`) で、
 * ここでは取得も書き込みもしない。CLI は `.claude/scripts/blog/audit-data-source-mismatch.mjs`。
 *
 * 「導出した出典」は 2 段で作る。
 *   1. 図の source.json が出典を直接持つ項目 (displaySources / sourceName / url / statsDataId)
 *   2. snapshot の記事ごとの `sources` (exporter が全図の source.json と指標のマスタから導出して焼いたもの。
 *      記事末尾の DataSourceList と同じ元)
 * 図 1 枚ごとの指標 → 調査の導出 (rankingKey → 調査名) は TS の指標マスタが要るので、ここでは行わない。
 * そのため食い違いの単位は「図のタグ 1 つ」だが、照らす先は記事全体の導出出典になる。
 */

/** `<data-source ...></data-source>` を 1 つずつ読む。直前の図 (`![](data/<base>.svg)`) が数行内にあれば base を付ける */
export function extractDataSourceTags(markdown) {
  const lines = markdown.split("\n");
  const tags = [];
  lines.forEach((line, index) => {
    for (const m of line.matchAll(/<data-source\b([^>]*)>/g)) {
      const attr = (name) => m[1].match(new RegExp(`\\b${name}="([^"]*)"`))?.[1];
      let figureBase = null;
      for (let j = index - 1; j >= Math.max(0, index - 4); j--) {
        const img = lines[j].match(/!\[[^\]]*\]\(data\/([^)]+?)\.(?:svg|png)(?:[?#][^)]*)?\)/);
        if (img) {
          figureBase = img[1];
          break;
        }
        if (lines[j].trim() !== "") break;
      }
      tags.push({ line: index + 1, label: attr("label") ?? "", url: attr("url") ?? "", year: attr("year") ?? "", figureBase });
    }
  });
  return tags;
}

/** 比較用に URL をそろえる (http→https・末尾のスラッシュ・フラグメントを無視) */
export function normalizeUrl(url) {
  if (typeof url !== "string" || url.trim() === "") return "";
  return url.trim().replace(/^http:\/\//i, "https://").replace(/#.*$/, "").replace(/\/+$/, "");
}

/** 比較用にラベルをそろえる: 先頭の「e-Stat」・括弧書き・かぎ括弧・空白を落とす */
export function normalizeLabel(label) {
  if (typeof label !== "string") return "";
  return label
    .replace(/^e-?Stat[\s　]*/i, "")
    .replace(/[（(][^）)]*[）)]/g, "")
    .replace(/[「」『』\s　]/g, "");
}

const asArray = (v) => (Array.isArray(v) ? v : []);

/** 図の source.json が直接持つ出典 (ラベルと URL)。無ければ空 */
export function figureSourceReferences(sourceJson) {
  const labels = [];
  const urls = [];
  if (!sourceJson || typeof sourceJson !== "object") return { labels, urls };
  for (const d of asArray(sourceJson.displaySources)) {
    if (typeof d?.label === "string") labels.push(d.label);
    if (typeof d?.url === "string") urls.push(d.url);
  }
  if (typeof sourceJson.sourceName === "string") labels.push(sourceJson.sourceName);
  if (typeof sourceJson.url === "string") urls.push(sourceJson.url);
  return { labels, urls };
}

/** snapshot の記事ごとの `sources` (調査・統計表) から、ラベルと URL を集める */
export function articleSourceReferences(sources) {
  const labels = [];
  const urls = [];
  for (const s of asArray(sources)) {
    if (typeof s?.label === "string") labels.push(s.label);
    if (typeof s?.url === "string") urls.push(s.url);
    for (const t of asArray(s?.tables)) {
      if (typeof t?.label === "string") labels.push(t.label);
      if (typeof t?.url === "string") urls.push(t.url);
    }
  }
  return { labels, urls };
}

/** 名前が同じ出典を指すとみなす、共通する連続部分の最短の長さ (「国土地理院」の 5 字は同じ機関、「社会生活」の 4 字は別の調査) */
const MIN_COMMON_LENGTH = 5;

/** 2 つの文字列に共通する連続部分の最長の長さ */
function longestCommonRun(a, b) {
  let best = 0;
  let prev = new Array(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i++) {
    const cur = new Array(b.length + 1).fill(0);
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        cur[j] = prev[j - 1] + 1;
        if (cur[j] > best) best = cur[j];
      }
    }
    prev = cur;
  }
  return best;
}

function labelMatches(tagLabel, derivedLabels) {
  const tag = normalizeLabel(tagLabel);
  if (tag.length === 0) return false;
  return derivedLabels.some((d) => {
    const n = normalizeLabel(d);
    if (n.length === 0) return false;
    if (tag.includes(n) || n.includes(tag)) return true;
    return longestCommonRun(tag, n) >= MIN_COMMON_LENGTH;
  });
}

/**
 * タグ 1 つを導出した出典と照らす。
 * @param {{label: string, url: string}} tag
 * @param {{labels: string[], urls: string[]}} figureRefs 図の source.json が直接持つ出典
 * @param {{labels: string[], urls: string[]}} articleRefs 記事ごとに導出された出典
 * @returns {string[]} 食い違いの種類 (空なら一致)。
 *   NO_DERIVED_SOURCE = 照らす先が無い (図にも記事にも出典を導出できない)
 *   LABEL_MISMATCH = タグの名前が導出した名前のどれとも合わない
 *   URL_MISMATCH = タグの URL が導出した URL のどれとも合わない
 */
export function compareTagToDerived(tag, figureRefs, articleRefs) {
  const labels = [...figureRefs.labels, ...articleRefs.labels];
  const urls = [...figureRefs.urls, ...articleRefs.urls].map(normalizeUrl).filter(Boolean);
  if (labels.length === 0 && urls.length === 0) return ["NO_DERIVED_SOURCE"];
  const problems = [];
  if (tag.label && labels.length > 0 && !labelMatches(tag.label, labels)) problems.push("LABEL_MISMATCH");
  const tagUrl = normalizeUrl(tag.url);
  if (tagUrl && urls.length > 0 && !urls.includes(tagUrl)) problems.push("URL_MISMATCH");
  return problems;
}

/**
 * 同時 2 本までの上限を 1 ホストごとに掛けて、URL の到達を確かめる (HEAD で 200 以外はリンク切れ)。
 * `head(url)` は状態コード (数) か、通信失敗で 0 を返す関数を渡す。
 * @returns {Promise<Map<string, number>>} URL → 状態コード
 */
export async function checkUrlsPerHost(urls, head, perHost = 2) {
  const byHost = new Map();
  for (const url of new Set(urls)) {
    let host;
    try {
      host = new URL(url).host;
    } catch {
      continue;
    }
    if (!byHost.has(host)) byHost.set(host, []);
    byHost.get(host).push(url);
  }
  const result = new Map();
  await Promise.all(
    [...byHost.values()].map(async (queue) => {
      const pending = [...queue];
      await Promise.all(
        Array.from({ length: Math.min(perHost, pending.length) }, async () => {
          while (pending.length > 0) {
            const url = pending.shift();
            result.set(url, await head(url));
          }
        }),
      );
    }),
  );
  return result;
}
