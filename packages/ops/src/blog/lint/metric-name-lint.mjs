/**
 * metric-name-lint — 指標の呼び名と比較の基準年を、本文と図の data JSON で照合する
 * (BLOG-METRIC-NAME-GATE-01、2026-10-26 追加)。どちらも warning (意味の最終判断は blog-critic)。
 *
 * ① 上位概念での呼び替え (lintHypernymMetricNames)
 *   事象: 図「スルメイカ漁獲量」の値を本文が「イカ類」と書いていた (fishery-species-prefecture-specialty の critic が BLOCK)。
 *   判定: 文に「<カタカナ/ひらがな>類」があり、同じ文が図の値 (data JSON の value / x / y) を語っていて、
 *   その図の名前 (title / label / readerLabel) が「<語>」を含むのに「<語>類」を含まないとき。
 *   値が一致しない文は対象外 (別の指標を語っている可能性があるため)。記事のどれかの図が「<語>類」を
 *   名前に持つなら、その語は図の指標名なので対象外 (例: 漁獲量「マグロ類」と支出「まぐろ」の散布図)。
 *   漢字の「〜類」は判定しない。
 *
 * ② 基準年が時系列の極値に当たる比較 (lintExtremeBaseYear)
 *   事象: 「2015 年と比べて寡占は強まった」の 2015 年が 2013〜2018 年で最も低い年で、幅の中の変動を
 *   傾向と書いていた (同 critic、MAJOR)。
 *   判定: 文に「N年と比べ / N年に比べ / N年と比較 / N年比」があり、記事の時系列 (data JSON の
 *   series[].data / data の {year,value}) のどれかで N が最初・最後でない年の最大値か最小値に当たるとき。
 *   記事のどこかで N 年が極値であることを書いている (「N年のピーク」「ピークの N 年」「底だった N 年」など、
 *   N 年と極値の語が同じ文に並ぶ) なら、読者は極値と知っているので除外する。1 文に同じ年が複数の系列で
 *   当たっても警告は 1 件にまとめる。
 */

const SPECIFIC_NUMBER_MIN = 10;
const MIN_SERIES_POINTS = 4;
const EXTREME_WORD_RE = /ピーク|底|最高|最低|最多|最少|最大|最小|頂点|最も(?:低|高|多|少|大き|小さ)/;
const COMPARE_RE =
  /(?<![\d,.])((?:19|20)\d{2})\s*年度?\s*(?:と比べ|に比べ|と比較|比)/g;

function toKatakana(s) {
  return s.replace(/[ぁ-ゖ]/g, (c) =>
    String.fromCharCode(c.charCodeAt(0) + 0x60)
  );
}

/** 地の文を文単位に分ける (frontmatter・コード・画像・タグ・表・見出し・引用を除く) */
export function proseSentences(content) {
  let t = content.replace(/^---[\s\S]*?\n---\n/, '');
  t = t.replace(/```[\s\S]*?```/g, '');
  t = t.replace(/!\[[^\]]*\]\([^)]*\)/g, '');
  t = t.replace(/<[^>]+>[\s\S]*?<\/[^>]+>/g, '');
  t = t.replace(/<[^>]+>/g, '');
  t = t
    .split('\n')
    .filter((l) => !/^\s*\|/.test(l) && !/^\s*>/.test(l) && !/^\s*#{1,6}\s/.test(l))
    .join('\n');
  t = t.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
  return t
    .split(/(?<=[。！？])|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function chartNames(json, source) {
  const names = [];
  for (const o of [json, source]) {
    if (!o || typeof o !== 'object' || Array.isArray(o)) continue;
    for (const k of ['title', 'label', 'readerLabel', 'xLabel', 'yLabel']) {
      if (typeof o[k] === 'string' && o[k].trim()) names.push(o[k]);
    }
  }
  return names;
}

/** data JSON から値 (value / x / y) を集める */
function chartValues(json) {
  const out = [];
  const visit = (node, depth) => {
    if (depth > 6 || node == null) return;
    if (Array.isArray(node)) {
      for (const n of node) visit(n, depth + 1);
      return;
    }
    if (typeof node !== 'object') return;
    for (const k of ['value', 'x', 'y']) {
      if (typeof node[k] === 'number' && Number.isFinite(node[k])) out.push(node[k]);
    }
    for (const k of ['data', 'points', 'series', 'items', 'rows']) {
      if (node[k] != null) visit(node[k], depth + 1);
    }
  };
  visit(json, 0);
  return out;
}

/** 文中の数値 (年・月・日・順位を除く) を {value, decimals, text} で返す */
function sentenceNumbers(sentence) {
  const out = [];
  for (const m of sentence.matchAll(/(?<![\d.])(\d[\d,]*(?:\.\d+)?)(?![\d,])(?!\s*(?:年|月|日|位|県|か所))/g)) {
    const text = m[1];
    const value = Number(text.replace(/,/g, ''));
    if (!Number.isFinite(value)) continue;
    const decimals = text.includes('.') ? text.split('.')[1].length : 0;
    if (decimals === 0 && value < SPECIFIC_NUMBER_MIN) continue;
    out.push({ value, decimals, text });
  }
  return out;
}

function matchesValue(num, values) {
  const f = 10 ** num.decimals;
  return values.some((v) => Math.round(v * f) / f === num.value);
}

/**
 * @param {string} content article.md 全文
 * @param {{base:string, json:any, source:any}[]} charts 本文が参照する図
 * @returns {{warnings:string[], hits:{sentence:string,term:string,chart:string,number:string}[]}}
 */
export function lintHypernymMetricNames(content, charts) {
  const prepared = charts
    .map((c) => ({
      base: c.base,
      names: chartNames(c.json, c.source),
      values: chartValues(c.json),
    }))
    .filter((c) => c.names.length && c.values.length);
  const allNames = charts
    .flatMap((c) => chartNames(c.json, c.source))
    .map(toKatakana);
  const hits = [];
  for (const sentence of proseSentences(content)) {
    for (const m of sentence.matchAll(/([ァ-ヶー]{2,}|[ぁ-ゖ]{2,})類/g)) {
      const word = toKatakana(m[1]);
      const term = `${word}類`;
      if (allNames.some((n) => n.includes(term))) continue;
      for (const c of prepared) {
        const kataNames = c.names.map(toKatakana);
        if (!kataNames.some((n) => n.includes(word))) continue;
        if (kataNames.some((n) => n.includes(term))) continue;
        const num = sentenceNumbers(sentence).find((n) => matchesValue(n, c.values));
        if (!num) continue;
        hits.push({ sentence, term: m[0], chart: c.names[0], number: num.text });
      }
    }
  }
  const warnings = hits.map(
    (h) =>
      `指標の呼び名: 本文「${h.term}」が図「${h.chart}」の値 ${h.number} を語っている — ` +
      `図の指標は「${h.term}」全体ではない。図と同じ名前で書く (文: ${h.sentence.slice(0, 60)})`
  );
  return { warnings, hits };
}

/** data JSON から {year,value} の時系列を集める */
export function extractSeries(json, chartLabel) {
  const out = [];
  const toSeries = (arr, label) => {
    if (!Array.isArray(arr)) return;
    const pts = arr
      .filter(
        (p) =>
          p &&
          typeof p === 'object' &&
          /^(?:19|20)\d{2}$/.test(String(p.year ?? '')) &&
          typeof p.value === 'number' &&
          Number.isFinite(p.value)
      )
      .map((p) => ({ year: Number(p.year), value: p.value }));
    const years = new Set(pts.map((p) => p.year));
    if (years.size < MIN_SERIES_POINTS || years.size !== pts.length) return;
    out.push({ label, points: pts.sort((a, b) => a.year - b.year) });
  };
  if (!json || typeof json !== 'object') return out;
  if (Array.isArray(json.series)) {
    for (const s of json.series) {
      toSeries(s?.data, s?.label ?? s?.name ?? chartLabel);
    }
  }
  toSeries(json.data, chartLabel);
  return out;
}

/**
 * @param {string} content article.md 全文
 * @param {{base:string, json:any, source:any}[]} charts 本文が参照する図
 * @returns {{warnings:string[], hits:{sentence:string,year:number,series:string,kind:string}[]}}
 */
export function lintExtremeBaseYear(content, charts) {
  const series = charts.flatMap((c) =>
    extractSeries(c.json, chartNames(c.json, c.source)[0] ?? c.base)
  );
  const hits = [];
  if (!series.length) return { warnings: [], hits };
  const sentences = proseSentences(content);
  const disclosedYears = new Set(
    sentences
      .filter((s) => EXTREME_WORD_RE.test(s))
      .flatMap((s) =>
        [...s.matchAll(/(?<![\d,.])((?:19|20)\d{2})(?=\s*年)/g)].map((m) => Number(m[1]))
      )
  );
  for (const sentence of sentences) {
    for (const m of sentence.matchAll(COMPARE_RE)) {
      const year = Number(m[1]);
      if (disclosedYears.has(year)) continue;
      if (hits.some((h) => h.sentence === sentence && h.year === year)) continue;
      for (const s of series) {
        const idx = s.points.findIndex((p) => p.year === year);
        if (idx <= 0 || idx >= s.points.length - 1) continue;
        const values = s.points.map((p) => p.value);
        const v = s.points[idx].value;
        const kind =
          v === Math.min(...values) ? '最低' : v === Math.max(...values) ? '最高' : '';
        if (!kind) continue;
        hits.push({ sentence, year, series: s.label, kind });
        break;
      }
    }
  }
  const warnings = hits.map(
    (h) =>
      `比較の基準年: ${h.year}年は「${h.series}」の期間内で${h.kind}の年 — ` +
      `極値と比べると幅の中の変動が傾向に見える。期間の始点・平均と比べるか、極値であることを書く (文: ${h.sentence.slice(0, 60)})`
  );
  return { warnings, hits };
}
