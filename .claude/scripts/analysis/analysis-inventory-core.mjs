/**
 * 問いの分析で使える指標を data/metrics/*.ts から探す純関数 (analysis-inventory.mjs が使う)。
 * TS は実行せず、MetricConfig のオブジェクトを文字と括弧の深さで読み、最上位の項目だけを取る。
 * source.config.description のような入れ子の同名項目を指標の説明と取り違えないため。
 */

/** `: MetricConfig = {` の直後から、対応する `}` までの本文を返す */
export function metricObjectText(source) {
  const head = /:\s*MetricConfig\s*=\s*\{/.exec(source);
  if (!head) return null;
  const start = head.index + head[0].length;
  const end = closingBrace(source, start);
  return end < 0 ? null : source.slice(start, end);
}

/** text[start] 以降で深さ 0 の `}` の位置。文字列とコメントの中の括弧は数えない */
function closingBrace(text, start) {
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (c === '"' || c === "'" || c === "`") i = skipString(text, i);
    else if (c === "/" && text[i + 1] === "/") i = text.indexOf("\n", i) < 0 ? text.length : text.indexOf("\n", i);
    else if (c === "/" && text[i + 1] === "*") i = text.indexOf("*/", i + 2) + 1;
    else if (c === "{" || c === "[" || c === "(") depth++;
    else if (c === "}" || c === "]" || c === ")") {
      if (depth === 0) return i;
      depth--;
    }
  }
  return -1;
}

function skipString(text, i) {
  const quote = text[i];
  for (let j = i + 1; j < text.length; j++) {
    if (text[j] === "\\") j++;
    else if (text[j] === quote) return j;
  }
  return text.length;
}

/** オブジェクト本文の最上位の `key: value` を { key: 生の値の文字列 } にする (スプレッドは捨てる) */
export function topLevelProps(body) {
  const props = {};
  let i = 0;
  while (i < body.length) {
    const rest = body.slice(i);
    const m = /^[\s,]*(?:"([\w$]+)"|'([\w$]+)'|([\w$]+))\s*:/.exec(rest);
    if (!m) {
      // スプレッドやコメントなど、項目でないものは次の区切りまで読み飛ばす
      const next = nextComma(body, i);
      if (next <= i) break;
      i = next + 1;
      continue;
    }
    const key = m[1] ?? m[2] ?? m[3];
    const valueStart = i + m[0].length;
    const valueEnd = nextComma(body, valueStart);
    props[key] = body.slice(valueStart, valueEnd).trim();
    i = valueEnd + 1;
  }
  return props;
}

/** 深さ 0 の `,` (無ければ末尾) の位置 */
function nextComma(text, start) {
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (c === '"' || c === "'" || c === "`") i = skipString(text, i);
    else if (c === "/" && text[i + 1] === "/") i = text.indexOf("\n", i) < 0 ? text.length : text.indexOf("\n", i);
    else if (c === "{" || c === "[" || c === "(") depth++;
    else if (c === "}" || c === "]" || c === ")") depth--;
    else if (c === "," && depth === 0) return i;
  }
  return text.length;
}

/** 文字列リテラル (`'a' + 'b'` の連結を含む) を値にする。文字列でなければ null */
export function stringValue(raw) {
  if (raw === undefined) return null;
  const parts = [...raw.matchAll(/"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'|`((?:[^`\\]|\\.)*)`/g)];
  if (parts.length === 0 || !/^["'`]/.test(raw.trim())) return null;
  return parts.map((p) => (p[1] ?? p[2] ?? p[3]).replace(/\\(.)/g, "$1")).join("");
}

/** years ({ from, to } か { years: [...] }) と yearExclusions から、最初・最後・件数を出す */
export function parseYears(rawYears, rawExclusions) {
  if (!rawYears) return { first: null, last: null, count: 0, kind: "missing" };
  const excluded = new Set(
    [...(rawExclusions ?? "").matchAll(/years["']?\s*:\s*\[([^\]]*)\]/g)].flatMap((m) => numbers(m[1])),
  );
  const list = /years["']?\s*:\s*\[([^\]]*)\]/.exec(rawYears);
  if (list) {
    const years = numbers(list[1]).filter((y) => !excluded.has(y)).sort((a, b) => a - b);
    return { first: years[0] ?? null, last: years.at(-1) ?? null, count: years.length, kind: "list" };
  }
  const from = /from["']?\s*:\s*(\d{4})/.exec(rawYears);
  const to = /\bto["']?\s*:\s*(\d{4})/.exec(rawYears);
  if (!from || !to) return { first: null, last: null, count: 0, kind: "missing" };
  const years = [];
  for (let y = Number(from[1]); y <= Number(to[1]); y++) if (!excluded.has(y)) years.push(y);
  // range は「この間のどこかの年」で、毎年あるとは限らない。実際の年は --check-r2 で確かめる
  return { first: years[0] ?? null, last: years.at(-1) ?? null, count: years.length, kind: "range" };
}

const numbers = (text) => [...text.matchAll(/\d{4}/g)].map((m) => Number(m[0]));

/** 指標 1 件の TS 本文から一覧の 1 行を作る。MetricConfig が無ければ null */
export function parseMetric(source, file = "") {
  const body = metricObjectText(source);
  if (!body) return null;
  const p = topLevelProps(body);
  const src = p.source ? topLevelProps(p.source.replace(/^\{/, "").replace(/\}$/, "")) : {};
  // statsDataId は source 直下か、filter / config の中にある (kakei-chousa・external)
  const statsDataId = /statsDataId["']?\s*:\s*["']([^"']+)["']/.exec(p.source ?? "")?.[1] ?? null;
  const isActive = p.isActive === undefined ? null : p.isActive.trim() === "true";
  return {
    key: stringValue(p.key),
    title: stringValue(p.title),
    subtitle: stringValue(p.subtitle),
    description: stringValue(p.description),
    unit: stringValue(p.unit),
    entities: [...(p.entities ?? "").matchAll(/["'](\w+)["']/g)].map((m) => m[1]),
    years: parseYears(p.years, p.yearExclusions),
    isActive,
    source: { kind: stringValue(src.kind), statsDataId, displayName: stringValue(src.displayName) },
    file,
  };
}

/** key・title・subtitle・description のどれかが語のどれかを含むか。当たった欄を返す */
export function matchedFields(metric, terms) {
  const fields = ["key", "title", "subtitle", "description"];
  return fields.filter((f) => {
    const text = (metric[f] ?? "").toLowerCase();
    return terms.some((t) => text.includes(t.toLowerCase()));
  });
}

/** 語と粒度で絞る。level が city なら市区町村を持つ指標だけ */
export function selectMetrics(metrics, { terms, level }) {
  return metrics
    .map((m) => ({ ...m, matched: matchedFields(m, terms) }))
    .filter((m) => m.matched.length > 0)
    .filter((m) => !level || m.entities.includes(level))
    .sort((a, b) => (a.key < b.key ? -1 : 1));
}

/** R2 の cities.json / prefectures.json の行から、値のある年と年ごとの地域数を出す */
export function summarizeRows(rows) {
  const byYear = new Map();
  // 値の無い行 (秘匿・欠測) は町の数に入れない
  for (const r of (rows ?? []).filter((row) => typeof row.value === "number" && Number.isFinite(row.value))) {
    const year = String(r.yearCode ?? "").slice(0, 4);
    if (!byYear.has(year)) byYear.set(year, new Set());
    byYear.get(year).add(r.areaCode);
  }
  const years = [...byYear.keys()].sort();
  return { years, areasByYear: Object.fromEntries(years.map((y) => [y, byYear.get(y).size])) };
}
