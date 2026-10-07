/**
 * ブログの図を指標の最新年で取り直すための純粋関数 (refresh-article-data-years.mjs が使う)。
 *
 * 図の data JSON は書いた時点の年のまま固定される (fetch-ranking-data-r2.mjs)。新しい年が R2 に入ったら、
 * 同じ指標の最新年の値で data JSON を作り直す。自動で作り直すのは `kind: "ranking"` の図で、data JSON が
 * fetch-ranking-data-r2.mjs の形 (`data: [{ rank, areaName, pref, value, areaCode }]` かタイルマップの
 * `data: [{ pref, areaName, value }]`) のものだけ。散布図・計算値・手書きの図は形がさまざまなので、
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

/** 本文 (frontmatter を含む) のうち、古い年を書いた行。書き直す箇所の目印にする。 */
export function findYearMentions(markdown, years) {
  const targets = [...new Set(years)].map((year) => `${year}年`);
  if (targets.length === 0) return [];
  return markdown
    .split(/\r?\n/)
    .map((text, i) => ({ line: i + 1, text }))
    .filter(({ text }) => targets.some((target) => text.includes(target)));
}
