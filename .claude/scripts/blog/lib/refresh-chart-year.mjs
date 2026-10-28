/**
 * ブログの図を指標の最新年で取り直すための純粋関数 (refresh-article-data-years.mjs が使う)。
 *
 * 図の data JSON は書いた時点の年のまま固定される (fetch-ranking-data-r2.mjs)。新しい年が R2 に入ったら、
 * 同じ指標の最新年の値で data JSON を作り直す。自動で作り直すのは `kind: "ranking"` の図で、data JSON が
 * fetch-ranking-data-r2.mjs の形 (`data: [{ rank, areaName, pref, value, areaCode }]` かタイルマップの
 * `data: [{ pref, areaName, value }]`) と、2 指標の散布図 (下の planScatterRefresh。今の点が R2 の値と
 * 一致することを確かめてから取り直す)。それ以外の計算値・手書きの図は形がさまざまなので、
 * 理由を付けて手作業に回す (推測で作り直すと値を捏造しうる)。
 *
 * 作り直した data JSON は、行の並び (value 降順・rank 振り直し) と行の項目を fetch-ranking-data-r2.mjs と
 * そろえ、見出し・配色などの表示用の項目はそのまま残す。
 */

/** fetch-ranking-data-r2.mjs が行に書く項目。これ以外の項目を持つ行は自動で作り直さない。 */
const RANKING_ROW_FIELDS = new Set(["rank", "areaName", "pref", "value", "areaCode", "unit", "label"]);

const FOUR_DIGIT_YEAR = /^\d{4}$/;

const yearOf = (yearCode) => String(yearCode).slice(0, 4);

/** values.json の partitions のうち最新年のもの。無ければ null。 */
export function latestPartition(values) {
  const parts = (values?.partitions ?? []).filter((p) => Array.isArray(p?.values) && p.values.length > 0);
  if (parts.length === 0) return null;
  return parts.slice().sort((a, b) => yearOf(a.yearCode).localeCompare(yearOf(b.yearCode))).at(-1);
}

function isRankingShaped(data) {
  if (!data || typeof data !== "object" || Array.isArray(data) || !Array.isArray(data.data) || data.data.length === 0) {
    return false;
  }
  return data.data.every(
    (row) =>
      row &&
      typeof row === "object" &&
      typeof row.value === "number" &&
      Object.keys(row).every((key) => RANKING_ROW_FIELDS.has(key)),
  );
}

/**
 * 1 枚の図を取り直すかどうか。
 *
 * @returns {{ status: "refresh" | "current" | "pinned" | "unsupported" | "no-data", reason?: string, fromYear?: string, toYear?: string }}
 */
export function planChartRefresh({ source, data, latestYear }) {
  if (!source || typeof source !== "object") return { status: "unsupported", reason: "source.json が無い" };
  if (typeof source.yearPinnedReason === "string" && source.yearPinnedReason.trim()) {
    return { status: "pinned", reason: source.yearPinnedReason.trim() };
  }
  if (source.kind !== "ranking") return { status: "unsupported", reason: `kind "${source.kind}" は自動で取り直さない` };
  const fromYear = source.year == null ? "" : String(source.year);
  if (!source.rankingKey || !FOUR_DIGIT_YEAR.test(fromYear)) {
    return { status: "unsupported", reason: "rankingKey か 4 桁の year が無い" };
  }
  if (!latestYear) return { status: "no-data", reason: `R2 に ${source.rankingKey} の値が無い` };
  const toYear = yearOf(latestYear);
  if (toYear <= fromYear) return { status: "current", fromYear, toYear };
  if (!isRankingShaped(data)) {
    return { status: "unsupported", reason: "data JSON が fetch-ranking-data-r2.mjs の形ではない", fromYear, toYear };
  }
  return { status: "refresh", fromYear, toYear };
}

const replaceYear = (text, fromYear, toYear) =>
  typeof text === "string" ? text.split(`${fromYear}年`).join(`${toYear}年`) : text;

/**
 * 最新年の partition から data JSON を作り直す。行の項目は元の行と同じにする。
 * 見出し・副題の「YYYY年」は新しい年に置き換え、それ以外の年が見出しに残る場合は notes に出す。
 */
export function rebuildChartData(data, partition, { fromYear, toYear }) {
  const fields = Object.keys(data.data[0]);
  const template = data.data[0];
  const sorted = partition.values
    .filter((v) => typeof v.value === "number" && Number.isFinite(v.value))
    .slice()
    .sort((a, b) => b.value - a.value);
  const rows = sorted.map((v, i) => {
    const full = {
      rank: i + 1,
      areaName: v.areaName,
      pref: v.areaName,
      value: v.value,
      areaCode: v.areaCode,
      unit: template.unit,
      label: template.label,
    };
    return Object.fromEntries(fields.map((field) => [field, full[field]]));
  });
  const next = { ...data, data: rows };
  if ("year" in data) next.year = typeof data.year === "number" ? Number(toYear) : toYear;
  for (const field of ["title", "subtitle"]) {
    if (field in data) next[field] = replaceYear(data[field], fromYear, toYear);
  }
  const notes = [];
  for (const field of ["title", "subtitle"]) {
    // 「2016〜2018年」のような範囲は先頭の年に「年」が付かないので、19xx / 20xx をすべて拾う
    const other = String(next[field] ?? "").match(/(?<!\d)(?:19|20)\d{2}(?!\d)/g)?.filter((y) => y !== toYear) ?? [];
    if (other.length > 0) notes.push(`${field} に別の年 (${[...new Set(other)].join("・")}年) が残る`);
  }
  return { data: next, notes };
}

/** source.json の年を新しい年にし、取り直した元の年を残す。 */
export function rebuildSource(source, { fromYear, toYear }, fetchedAt) {
  return {
    ...source,
    year: typeof source.year === "number" ? Number(toYear) : toYear,
    fetchedAt,
    refreshedFromYear: fromYear,
  };
}

/** 年を作り直す欄。ほかの欄に元の年が残っていれば、作り直せないので手作業に回す。 */
const REBUILT_SOURCE_FIELDS = new Set(["year", "refreshedFromYear", "fetchedAt"]);

/**
 * 取り直したあとの source.json で、元の年の値が残っている欄 (例: `coverage`・`supplementary.tunaCorrelation`)。
 * 補足の集計値は図の data から作れないので自動では直さず、ここで列挙して手作業に出す
 * (2026-10-08 に bonito-catch-prefecture で 2015 年の値が残った。BLOG-REFRESH-STALE-SOURCE-FIELDS-01)。
 */
export function findStaleSourceFields(source, fromYear, skipFields = REBUILT_SOURCE_FIELDS) {
  const year = String(fromYear);
  const pattern = new RegExp(`(?<!\\d)${year}(?!\\d)`);
  const stale = [];
  const walk = (node, at) => {
    if (typeof node === "string" ? pattern.test(node) : typeof node === "number" && String(node) === year) {
      stale.push(at);
      return;
    }
    if (node && typeof node === "object") {
      for (const [key, value] of Object.entries(node)) {
        if (!at && skipFields.has(key)) continue;
        walk(value, at ? `${at}.${key}` : key);
      }
    }
  };
  walk(source, "");
  return stale;
}

/** 本文 (frontmatter を含む) のうち、古い年を書いた行。書き直す箇所の目印にする。 */
export function findYearMentions(markdown, years) {
  const targets = [...new Set(years)].map((year) => `${year}年`);
  if (targets.length === 0) return [];
  return markdown
    .split(/\r?\n/)
    .map((text, i) => ({ line: i + 1, text }))
    .filter(({ text }) => targets.some((target) => text.includes(target)));
}

// ─── 散布図 (2 指標を県で結んだ図) ───────────────────────────────────────────
//
// 散布図は x・y の 2 指標を、それぞれの年の values.json から県で結んだもの。source.json の書き方は kind ごとに違う
// (`scatter` の xKey/yKey、`derived-scatter` の rankingKeys、`calculated` の inputs[]、`ranking-join` の
// x/yRankingKey、`composite` の x/yMetric)。どの書き方でも、軸の指標と今の年を「今の点が R2 のどの指標・年の値と
// 一致するか」で確かめてから取り直す。一致しない図 (計算で作った値・別の指標) は手作業に回す (推測で作り直さない)。
//
// 取り直す年は両軸の最新の共通年。共通年が無いとき、または共通年へそろえると今より古い年へ戻る軸があるときは
// 軸ごとの最新年を使い、両方の年を見出しに出す (BLOG-REFRESH-DERIVED-SCATTER-01)。

/** 散布図として扱う kind。 */
export const SCATTER_SOURCE_KINDS = new Set(["scatter", "derived-scatter", "calculated", "ranking-join", "composite"]);

/** 散布図の点に許す項目。これ以外の項目を持つ点の図は自動で作り直さない。 */
const SCATTER_POINT_LABEL_FIELDS = ["label", "pref", "areaName", "name"];
const SCATTER_POINT_FIELDS = new Set([...SCATTER_POINT_LABEL_FIELDS, "code", "areaCode", "x", "y"]);

/** 値が一致したとみなす点の割合。丸めた値の図も通り、別の指標・年は通らない。 */
const AXIS_MATCH_MIN_RATE = 0.95;

const PREFECTURE_AREA_CODE = /^(0[1-9]|[1-3]\d|4[0-7])000$/;

const isScatterShaped = (data) =>
  Boolean(data) &&
  typeof data === "object" &&
  !Array.isArray(data) &&
  Array.isArray(data.points) &&
  data.points.length > 0 &&
  data.points.every(
    (p) =>
      p &&
      typeof p === "object" &&
      Number.isFinite(p.x) &&
      Number.isFinite(p.y) &&
      SCATTER_POINT_LABEL_FIELDS.some((f) => typeof p[f] === "string" && p[f]) &&
      Object.keys(p).every((k) => SCATTER_POINT_FIELDS.has(k)),
  );

/** 県名の照合キー。図には「東京」のように都府県を落とした名前もあるので落としてそろえる (北海道はそのまま)。 */
const prefKey = (name) => (name === "北海道" ? name : String(name).replace(/[都府県]$/u, ""));

const pointName = (p) => prefKey(SCATTER_POINT_LABEL_FIELDS.map((f) => p[f]).find((v) => typeof v === "string" && v));

/** 軸の表示ラベルとして source.json に書かれることがある、指標ではない語。 */
const NON_METRIC_AXIS_WORDS = new Set(["calculated", "derived", "computed", "manual"]);

/** 1 つの rankingKey として読める文字列か (「a + b」「a|b」のような連結と、calculated 等の語は軸にしない)。 */
const asKey = (value) =>
  typeof value === "string" && /^[a-z0-9][a-z0-9-]*$/.test(value.trim()) && !NON_METRIC_AXIS_WORDS.has(value.trim())
    ? value.trim()
    : null;

/**
 * source.json から x・y の指標の候補を読む。[x, y] の順の候補で、向きは値の照合で確かめる。
 * 同じ指標の 2 つの年を比べる図は `sameKey: true` を返す。
 */
export function scatterAxisKeys(source) {
  if (!source || typeof source !== "object") return null;
  const pairs = [
    [source.xKey, source.yKey],
    [source.xRankingKey, source.yRankingKey],
    [source.xMetric?.rankingKey, source.yMetric?.rankingKey],
    Array.isArray(source.rankingKeys) && source.rankingKeys.length === 2 ? source.rankingKeys : [],
  ];
  for (const [x, y] of pairs) {
    if (asKey(x) && asKey(y)) return { x: asKey(x), y: asKey(y), sameKey: asKey(x) === asKey(y) };
  }
  if (source.kind === "calculated" && Array.isArray(source.inputs)) {
    const keys = source.inputs.map((input) => asKey(input?.rankingKey)).filter(Boolean);
    const distinct = [...new Set(keys)];
    if (distinct.length === 1 && keys.length === 2) return { x: distinct[0], y: distinct[0], sameKey: true };
    if (distinct.length === 2) return { x: distinct[0], y: distinct[1], sameKey: false };
    // 入力が 3 つ以上なら、`years` に年を書いた 2 指標を軸とみなす (書き手が軸の年をここに書いている)
    const yearKeys = source.years && typeof source.years === "object" ? Object.keys(source.years).filter(asKey) : [];
    if (yearKeys.length === 2) return { x: yearKeys[0], y: yearKeys[1], sameKey: false };
  }
  return null;
}

/** values.json の都道府県の値を { 県名 → 値 } にした partition の一覧 (年の古い順)。 */
export function prefecturePartitions(values) {
  return (values?.partitions ?? [])
    .map((p) => ({
      year: yearOf(p.yearCode),
      byName: new Map(
        (p.values ?? [])
          .filter((v) => PREFECTURE_AREA_CODE.test(String(v.areaCode)) && Number.isFinite(v.value))
          .map((v) => [prefKey(v.areaName), { value: v.value, areaCode: String(v.areaCode), areaName: v.areaName }]),
      ),
    }))
    .filter((p) => FOUR_DIGIT_YEAR.test(p.year) && p.byName.size > 0)
    .sort((a, b) => a.year.localeCompare(b.year));
}

const decimalsOf = (n) => {
  const s = String(n);
  if (/e/i.test(s)) return 0;
  return s.includes(".") ? s.split(".")[1].length : 0;
};

/** 図の値 shown が R2 の値 actual と同じか。図は R2 の値を丸めて描くことがあるので、図の値の桁で丸めて比べる。 */
const sameValue = (shown, actual) => Number(actual.toFixed(decimalsOf(shown))) === shown;

function axisMatchRate(points, axis, partition) {
  let hit = 0;
  for (const p of points) {
    const v = partition.byName.get(pointName(p));
    if (v && sameValue(p[axis], v.value)) hit++;
  }
  return hit / points.length;
}

/** 点の軸が一致する年 (一致率の最も高い年。同率なら新しい年)。一致しなければ null。 */
function matchAxisYear(points, axis, partitions) {
  let best = null;
  for (const partition of partitions) {
    const rate = axisMatchRate(points, axis, partition);
    if (rate >= AXIS_MATCH_MIN_RATE && (!best || rate >= best.rate)) best = { year: partition.year, rate };
  }
  return best;
}

/** 両軸の取り直し先の年。共通年があればその最新、無ければ軸ごとの最新年。 */
export function targetScatterYears(xPartitions, yPartitions) {
  const yYears = new Set(yPartitions.map((p) => p.year));
  const common = xPartitions.map((p) => p.year).filter((y) => yYears.has(y));
  if (common.length > 0) return { x: common.at(-1), y: common.at(-1), common: true };
  return { x: xPartitions.at(-1)?.year ?? null, y: yPartitions.at(-1)?.year ?? null, common: false };
}

/**
 * 散布図を取り直すかどうか。`valuesByKey` は rankingKey → values.json (R2 に無ければ null か未設定)。
 *
 * @returns {{ status: "refresh" | "current" | "pinned" | "unsupported" | "no-data", reason?: string,
 *   fromYear?: string, toYear?: string, axes?: { x: { key: string, fromYear: string, toYear: string }, y: { key: string, fromYear: string, toYear: string } } }}
 */
export function planScatterRefresh({ source, data, valuesByKey }) {
  if (!source || typeof source !== "object") return { status: "unsupported", reason: "source.json が無い" };
  if (typeof source.yearPinnedReason === "string" && source.yearPinnedReason.trim()) {
    return { status: "pinned", reason: source.yearPinnedReason.trim() };
  }
  if (!SCATTER_SOURCE_KINDS.has(source.kind)) return { status: "unsupported", reason: `kind "${source.kind}" は散布図ではない` };
  const keys = scatterAxisKeys(source);
  if (!keys) return { status: "unsupported", reason: "source.json から x・y の指標を特定できない" };
  if (keys.sameKey) {
    return {
      status: "unsupported",
      reason: "同じ指標の 2 つの年を比べる図は、比べる年の選び方が本文の主題なので自動で取り直さない (yearPinnedReason を書くか手作業)",
    };
  }
  if (!isScatterShaped(data)) return { status: "unsupported", reason: "data JSON が散布図の形 (points: [{label, x, y}]) ではない" };
  const xParts = prefecturePartitions(valuesByKey?.[keys.x]);
  const yParts = prefecturePartitions(valuesByKey?.[keys.y]);
  const missing = [
    [keys.x, xParts],
    [keys.y, yParts],
  ].flatMap(([key, parts]) => (parts.length === 0 ? [key] : []));
  if (missing.length > 0) return { status: "no-data", reason: `R2 に ${missing.join("・")} の値が無い` };

  // どちらの指標が x か、今の図がどの年かを、点の値と R2 の値の一致で確かめる
  const orient = (xKey, yKey, xp, yp) => {
    const x = matchAxisYear(data.points, "x", xp);
    const y = matchAxisYear(data.points, "y", yp);
    return x && y ? { x: { key: xKey, fromYear: x.year, parts: xp }, y: { key: yKey, fromYear: y.year, parts: yp } } : null;
  };
  const oriented = orient(keys.x, keys.y, xParts, yParts) ?? orient(keys.y, keys.x, yParts, xParts);
  if (!oriented) {
    return { status: "unsupported", reason: `点の値が ${keys.x}・${keys.y} のどの年の値とも一致しない (計算で作った軸か、別の指標)` };
  }
  // 共通年へそろえると今より古い年へ戻る軸があるなら、そろえずに軸ごとの最新年を使う
  // (取り直しで図を古くしない。両軸の年は見出しに出す)
  let target = targetScatterYears(oriented.x.parts, oriented.y.parts);
  let reason;
  if (target.x < oriented.x.fromYear || target.y < oriented.y.fromYear) {
    reason = `両軸の共通の最新年 ${target.x} 年へそろえると今より古い年に戻るので、軸ごとの最新年を使う`;
    target = { x: oriented.x.parts.at(-1).year, y: oriented.y.parts.at(-1).year, common: false };
  }
  const axes = {
    x: { key: oriented.x.key, fromYear: oriented.x.fromYear, toYear: target.x },
    y: { key: oriented.y.key, fromYear: oriented.y.fromYear, toYear: target.y },
  };
  const label = (a, b) => (a === b ? a : `x:${a}/y:${b}`);
  const fromYear = label(axes.x.fromYear, axes.y.fromYear);
  const toYear = label(axes.x.toYear, axes.y.toYear);
  const status = axes.x.fromYear === axes.x.toYear && axes.y.fromYear === axes.y.toYear ? "current" : "refresh";
  return { status, ...(reason ? { reason } : {}), fromYear, toYear, axes };
}

/** Pearson の相関係数。点が 3 未満か、どちらかの軸の分散が 0 なら null。 */
export function pearsonR(points) {
  const n = points.length;
  if (n < 3) return null;
  const mx = points.reduce((s, p) => s + p.x, 0) / n;
  const my = points.reduce((s, p) => s + p.y, 0) / n;
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (const p of points) {
    sxy += (p.x - mx) * (p.y - my);
    sxx += (p.x - mx) ** 2;
    syy += (p.y - my) ** 2;
  }
  return sxx > 0 && syy > 0 ? sxy / Math.sqrt(sxx * syy) : null;
}

/** 「YYYY年」を 年 → 新しい年 の対応で 1 回で置き換える (2022→2023・2023→2024 の連鎖置換を起こさない)。 */
const replaceYears = (text, map) =>
  typeof text === "string" ? text.replace(/(?<!\d)((?:19|20)\d{2})年/g, (m, y) => (map.has(y) ? `${map.get(y)}年` : m)) : text;

/**
 * 取り直し先の年の値で散布図の点を作り直す。点の項目は元の点と同じにし、値は元の図の桁に丸める。
 * 両方の年に値がそろう県だけを描き、欠けた県は `excluded` に返す。
 */
export function rebuildScatterData(data, plan, valuesByKey) {
  const { x, y } = plan.axes;
  const xPart = prefecturePartitions(valuesByKey[x.key]).find((p) => p.year === x.toYear);
  const yPart = prefecturePartitions(valuesByKey[y.key]).find((p) => p.year === y.toYear);
  const template = data.points[0];
  const fields = Object.keys(template);
  const xDecimals = Math.max(...data.points.map((p) => decimalsOf(p.x)));
  const yDecimals = Math.max(...data.points.map((p) => decimalsOf(p.y)));
  const templateCode = template.code ?? template.areaCode;
  const codeWidth = typeof templateCode === "string" ? templateCode.length : 5;
  const codeOf = (name) => (xPart.byName.get(name) ?? yPart.byName.get(name)).areaCode;
  const names = [...new Set([...xPart.byName.keys(), ...yPart.byName.keys()])].sort((a, b) => codeOf(a).localeCompare(codeOf(b)));
  // 元の図が「東京」のような短い名前なら短い名前で、「東京都」なら正式名で書く
  const rawName = (p) => SCATTER_POINT_LABEL_FIELDS.map((f) => p[f]).find((v) => typeof v === "string" && v);
  const sampleName = data.points.map(rawName).find((n) => n !== "北海道");
  const useShortName = sampleName !== undefined && prefKey(sampleName) === sampleName;
  const points = [];
  const excluded = [];
  for (const key of names) {
    const xv = xPart.byName.get(key);
    const yv = yPart.byName.get(key);
    const name = useShortName ? key : (xv ?? yv).areaName;
    if (!xv || !yv) {
      excluded.push((xv ?? yv).areaName);
      continue;
    }
    const code = xv.areaCode.slice(0, codeWidth);
    const full = {
      label: name,
      pref: name,
      areaName: name,
      name,
      code,
      areaCode: code,
      x: Number(xv.value.toFixed(xDecimals)),
      y: Number(yv.value.toFixed(yDecimals)),
    };
    points.push(Object.fromEntries(fields.map((f) => [f, full[f]])));
  }
  const next = { ...data, points };
  // x と y の元の年が同じで行き先が分かれる場合は、見出しの年をどちらへ置き換えるか決められないので触らない
  if (!(x.fromYear === y.fromYear && x.toYear !== y.toYear)) {
    const yearMap = new Map([
      [x.fromYear, x.toYear],
      [y.fromYear, y.toYear],
    ]);
    for (const field of ["title", "subtitle"]) if (field in data) next[field] = replaceYears(data[field], yearMap);
  }
  if ("xLabel" in data) next.xLabel = replaceYears(data.xLabel, new Map([[x.fromYear, x.toYear]]));
  if ("yLabel" in data) next.yLabel = replaceYears(data.yLabel, new Map([[y.fromYear, y.toYear]]));
  if ("expectedPointCount" in data) next.expectedPointCount = points.length;

  const notes = [];
  const newYears = new Set([x.toYear, y.toYear]);
  for (const field of ["title", "subtitle", "xLabel", "yLabel"]) {
    const other = String(next[field] ?? "").match(/(?<!\d)(?:19|20)\d{2}(?!\d)/g)?.filter((yr) => !newYears.has(yr)) ?? [];
    if (other.length > 0) notes.push(`${field} に別の年 (${[...new Set(other)].join("・")}年) が残る`);
  }
  // どちらの年の図かを見出しから読めるようにする (見出しに取り直した年が無ければ知らせる)
  const heading = `${next.title ?? ""} ${next.subtitle ?? ""}`;
  const missingYears = [...newYears].filter((yr) => !heading.includes(`${yr}年`));
  if (missingYears.length > 0) notes.push(`見出しに ${missingYears.join("・")}年 が無い (軸の年を見出しに書く)`);
  if (excluded.length > 0) notes.push(`${excluded.join("・")} は取り直した年に x・y のどちらかの値が無いので描かない`);
  return { data: next, notes, excluded, pearsonR: pearsonR(points) };
}

/** 散布図の取り直しで作り直す source.json の欄 (ここに古い年が残っても手作業に出さない)。 */
export const REBUILT_SCATTER_SOURCE_FIELDS = new Set([
  ...REBUILT_SOURCE_FIELDS,
  "years",
  "pearsonR",
  "pointCount",
  "excludedAreas",
  "exclusionReason",
  "expectedPointCount",
]);

/**
 * 散布図の source.json の年・相関係数・除外県を作り直す。元の年は refreshedFromYear に残す。
 * 計算式 (formula) などの文章は作り直さない (古い年の残りは findStaleSourceFields で手作業に出す)。
 */
export function rebuildScatterSource(source, plan, { excluded, pearsonR: r, pointCount }, fetchedAt) {
  const { x, y } = plan.axes;
  const next = { ...source, year: plan.toYear };
  if (source.years && typeof source.years === "object") {
    next.years = { ...source.years, [x.key]: x.toYear, [y.key]: y.toYear };
  }
  if (Array.isArray(source.inputs)) {
    next.inputs = source.inputs.map((input) => {
      if (input?.rankingKey === x.key && String(input.year) === x.fromYear) return { ...input, year: x.toYear };
      if (input?.rankingKey === y.key && String(input.year) === y.fromYear) return { ...input, year: y.toYear };
      return input;
    });
  }
  next.pearsonR = r;
  next.pointCount = pointCount;
  if (excluded.length > 0) {
    next.excludedAreas = excluded;
    next.exclusionReason = `取り直した年 (x ${x.toYear}年・y ${y.toYear}年) に x・y のどちらかの値が無い都道府県のため。`;
    next.expectedPointCount = pointCount;
  } else {
    delete next.excludedAreas;
    delete next.exclusionReason;
    if ("expectedPointCount" in next) next.expectedPointCount = pointCount;
  }
  next.fetchedAt = fetchedAt;
  next.refreshedFromYear = plan.fromYear;
  return next;
}
