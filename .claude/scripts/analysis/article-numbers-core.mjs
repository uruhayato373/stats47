/**
 * 記事本文の数値を分析の summary JSON と照合する純関数 (check-article-numbers.mjs が使う)。
 * 警告の道具: 一致しない数値は「summary に根拠が無い」候補で、誤りとは限らない (外部の値・派生の比など)。
 */

const CONTEXT_CHARS = 20;
const MAX_PATHS = 5;
const SMALL_INTEGER_MAX = 9;
const YEAR_MIN = 1900;
const YEAR_MAX = 2100;

/** 単位の読み (長いものを先に)。本文の値 = summary の値 × factor の候補 */
const UNITS = [
  ["百万円", [1, 100, 0.01, 1e-6]],
  ["億円", [1, 0.01, 1e-4, 1e-8]],
  ["万円", [1, 100, 1e4, 1e-4]],
  ["千円", [1, 1e-3]],
  ["円", [1, 1e4, 1e6, 1e8]],
  ["万人", [1, 1e-4]],
  ["千人", [1, 1e-3]],
  ["ポイント", [1, 100]],
  ["pt", [1, 100]],
  ["%", [1, 100]],
  ["割", [0.1, 10]],
  ["倍", [1]],
];
/** 量ではなく数え方の単位。小さな整数とあわせて除外する */
const COUNTERS = ["段", "つ", "番目", "等分", "分の", "章", "節", "項目", "点目", "位"];
/** 日付の部品。数値として照合しない */
const DATE_PARTS = /^(?:月|日|時点)/;

const normalize = (text) =>
  text
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[％]/g, "%")
    .replace(/[．]/g, ".")
    .replace(/[，]/g, ",")
    .replace(/[−–]/g, "-");

/** 照合しない部分 (frontmatter の題名以外・コード・画像・リンク先・HTML・見出しの番号) を落とす */
export function proseOf(markdown) {
  let text = normalize(markdown);
  const fm = /^---\n([\s\S]*?)\n---\n/.exec(text);
  if (fm) {
    const kept = fm[1]
      .split("\n")
      .filter((l) => /^(?:title|subtitle|description):/.test(l))
      .map((l) => l.replace(/^\w+:\s*/, ""));
    text = `${kept.join("\n")}\n${text.slice(fm[0].length)}`;
  }
  return text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\]\([^)]*\)/g, "]")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/^(#{1,6}\s*)(?:第?\d+(?:[.．)）章]|\s))+/gm, "$1");
}

const NUMBER = /(?<![\d.,\w])(-?)(\d{1,3}(?:,\d{3})+|\d+)(\.\d+)?/g;
const RANGE_SEP = /^\s*[〜~～-]\s*/;

function unitAt(text, at) {
  const rest = text.slice(at);
  for (const [unit] of UNITS) if (rest.startsWith(unit)) return unit;
  // 知らない単位は数え方の漢字 1 字 (町・人・所・回・県など) だけを読む。助詞は単位にしない
  return /^(?:市区町村|\p{Script=Han})/u.exec(rest)?.[0] ?? "";
}

/** 本文から照合対象の数値を抜き出す。年 4 桁・日付・見出しの番号・小さな整数の数え方・「1万人あたり」の分母を除く */
export function extractNumbers(markdown) {
  const text = proseOf(markdown);
  const raw = [...text.matchAll(NUMBER)].map((m) => {
    const end = m.index + m[0].length;
    const decimals = m[3] ? m[3].length - 1 : 0;
    const value = Number(`${m[1]}${m[2].replaceAll(",", "")}${m[3] ?? ""}`);
    return { text: m[0], value, decimals, start: m.index, end, unit: unitAt(text, end), hasComma: m[2].includes(",") };
  });
  // 「76〜86%」の前の値は後ろの値の単位を借りる
  for (let i = 0; i < raw.length - 1; i++) {
    const between = text.slice(raw[i].end, raw[i + 1].start);
    if (RANGE_SEP.test(between) && between.trim().length <= 1) raw[i].unit = raw[i + 1].unit;
  }
  return raw
    .filter((n) => !isExcluded(n, text))
    .map((n) => ({ text: `${n.text}${n.unit}`, value: n.value, decimals: n.decimals, unit: n.unit, context: contextOf(text, n.start, n.end) }));
}

function isExcluded(n, text) {
  const after = text.slice(n.end);
  const isInteger = n.decimals === 0;
  if (isInteger && !n.hasComma && n.value >= YEAR_MIN && n.value <= YEAR_MAX && (/^年/.test(after) || n.unit === "" || /^[〜~～-]/.test(after) || /^\)/.test(after)))
    return true;
  if (DATE_PARTS.test(after)) return true;
  if (isInteger && n.value <= SMALL_INTEGER_MAX && !UNITS.some(([u]) => u === n.unit)) return true;
  if (isInteger && COUNTERS.some((c) => after.startsWith(c))) return true;
  // 「人口1万人あたり」「10万人当たり」の分母は結論の数値ではない
  if (/^[^\s\d、。]{0,3}(?:あたり|当たり)/.test(after) && /^1(?:0+)?$/.test(String(n.value))) return true;
  return false;
}

function contextOf(text, start, end) {
  const half = Math.floor(CONTEXT_CHARS / 2);
  return text.slice(Math.max(0, start - half), end + half).replace(/\s+/g, " ").trim();
}

/** 入れ子をたどって summary の全数値を { path, value } で返す */
export function flattenNumbers(value, path = "") {
  if (typeof value === "number" && Number.isFinite(value)) return [{ path: path || "$", value }];
  if (value === null || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([k, v]) => flattenNumbers(v, path ? `${path}.${k}` : k));
}

const factorsOf = (unit) => UNITS.find(([u]) => u === unit)?.[1] ?? [1];

/** 本文の桁で四捨五入したとき一致するか (浮動小数の誤差を許す) */
export function roundsTo(candidate, value, decimals) {
  const half = 0.5 * 10 ** -decimals;
  return Math.abs(candidate - value) <= half + 1e-9 * Math.max(1, Math.abs(value));
}

/** 数値 1 件が summary のどの値に当たるか。当たった path を返す */
export function matchNumber(number, summaryValues) {
  const factors = factorsOf(number.unit);
  const hits = (fs) => summaryValues.filter(({ value }) => fs.some((f) => roundsTo(value * f, number.value, number.decimals)));
  // 単位の素直な読み (先頭の factor。% はそのまま・割は ×10%) の一致を先に並べる。換算でしか当たらない一致は偶然の可能性が高い
  const [canonical, ...others] = factors;
  const direct = hits([canonical]);
  const converted = hits(others).filter((h) => !direct.includes(h));
  return { paths: [...direct, ...converted].map(({ path }) => path), isDirect: direct.length > 0 };
}

/** 本文と summary を照合し、matched / unmatched / ratio を返す */
export function checkArticleNumbers(markdown, summary) {
  const values = flattenNumbers(summary);
  const matched = [];
  const unmatched = [];
  for (const n of extractNumbers(markdown)) {
    const { paths, isDirect } = matchNumber(n, values);
    // candidates が多い一致 (小さな値の %) は偶然当たった可能性がある。審査役は paths の意味を確かめる
    if (paths.length > 0) matched.push({ text: n.text, context: n.context, isDirect, candidates: paths.length, paths: paths.slice(0, MAX_PATHS) });
    else unmatched.push({ text: n.text, context: n.context });
  }
  const total = matched.length + unmatched.length;
  return { total, matched, unmatched, ratio: total === 0 ? null : Number((matched.length / total).toFixed(3)) };
}
