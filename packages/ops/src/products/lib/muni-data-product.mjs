/** 市区町村データ商品の純粋な組み立て部分 (入出力は build-muni-data-product.mjs)。 */

export const CSV_HEADER = ['自治体コード', '都道府県', '自治体名', '年', '値', '単位', '注記'];
const NOTE_SEPARATOR = '; ';

/** "北海道 札幌市 中央区" → { pref: "北海道", name: "札幌市 中央区" } */
export function splitAreaName(areaName) {
  const [pref, ...rest] = areaName.split(' ');
  if (!pref || !rest.length) throw new Error(`地域名を分けられない: ${areaName}`);
  return { pref, name: rest.join(' ') };
}

const noteForMissing = (key, source, symbols) => {
  if (source) {
    if (source.value != null) return null;
    const symbol = symbols?.get(key);
    return symbol ? `元データ記号 ${symbol.mark}${symbol.meaning ? ` (${symbol.meaning})` : ''}` : '元データ空欄 (記号未確認)';
  }
  return '元データに行なし';
};

/** 対象の地域 × 全年の行を作る。値は元データのまま、無い組み合わせも行として残す。 */
export function buildRows({ cityRows, areas, spec, symbols = null }) {
  const byKey = new Map(cityRows.map((row) => [`${row.areaCode}|${row.yearCode}`, row]));
  const years = [...new Set(cityRows.map((row) => row.yearCode))].sort();
  const rows = [];
  for (const area of areas) {
    const { pref, name } = splitAreaName(area.cityName);
    for (const year of years) {
      const key = `${area.cityCode}|${year}`;
      const source = byKey.get(key) ?? null;
      const yearNumber = Number(year);
      const notes = [
        noteForMissing(key, source, symbols),
        spec.yearNotes?.[year],
        ...(spec.rowNotes ?? [])
          .filter((n) => n.codes.includes(area.cityCode) && yearNumber <= n.toYear)
          .map((n) => n.note),
        ...(spec.knownIssues ?? [])
          .filter((n) => n.code === area.cityCode && n.year === yearNumber)
          .map((n) => n.note),
      ].filter(Boolean);
      rows.push({
        code: area.cityCode,
        pref,
        name,
        year,
        value: source?.value ?? null,
        unit: spec.unit,
        note: notes.join(NOTE_SEPARATOR),
      });
    }
  }
  return rows;
}

/**
 * 県別の値と自治体の合計を県×年で比べ、差を説明で分類する。
 * unexplained が残るときは呼び元が止める。空欄は秘匿の可能性があるので、残差から値を逆算しない。
 */
export function reconcile({ rows, prefRows, spec }) {
  const prefValue = new Map(prefRows.map((row) => [`${row.areaCode.slice(0, 2)}|${row.yearCode}`, row.value]));
  const groups = new Map();
  for (const row of rows) {
    const key = `${row.code.slice(0, 2)}|${row.year}`;
    const group = groups.get(key) ?? { prefCode: row.code.slice(0, 2), year: row.year, sum: 0, blanks: 0 };
    if (row.value == null) group.blanks += 1;
    else group.sum += row.value;
    groups.set(key, group);
  }
  const tolerance = spec.roundingTolerance ?? 0;
  const issues = (spec.knownIssues ?? []).filter((n) => n.expectPrefDiff != null);
  const byPrefYear = [...groups.entries()].map(([key, group]) => {
    const pref = prefValue.get(key);
    if (pref == null) throw new Error(`県別の値が無い: ${key}`);
    const diff = pref - group.sum;
    const year = Number(group.year);
    const issue = issues.find((n) => n.code.slice(0, 2) === group.prefCode && n.year === year);
    const merger = (spec.crossPrefMergers ?? []).find(
      (m) => m.prefs.includes(group.prefCode) && year <= m.toYear && Math.abs(diff) <= m.maxDiff,
    );
    let kind = 'unexplained';
    if (issue) kind = issue.expectPrefDiff === diff ? 'source-inconsistency' : 'unexplained';
    else if (group.blanks > 0 && diff >= -tolerance) kind = 'blank';
    else if (group.blanks === 0 && Math.abs(diff) <= tolerance) kind = 'rounding';
    else if (merger) kind = 'cross-pref';
    return { ...group, pref, diff, kind };
  });
  const yearKeys = [...new Set(byPrefYear.map((r) => r.year))].sort();
  const byYear = yearKeys.map((year) => {
    const list = byPrefYear.filter((r) => r.year === year);
    const count = (kind) => list.filter((r) => r.kind === kind).length;
    const prefTotal = list.reduce((s, r) => s + r.pref, 0);
    const muniTotal = list.reduce((s, r) => s + r.sum, 0);
    return {
      year,
      prefTotal,
      muniTotal,
      diff: prefTotal - muniTotal,
      diffPct: (((prefTotal - muniTotal) / prefTotal) * 100).toFixed(2),
      blanks: list.reduce((s, r) => s + r.blanks, 0),
      prefsBlank: count('blank'),
      prefsRounding: count('rounding'),
      prefsCrossPref: count('cross-pref'),
      prefsSourceIssue: count('source-inconsistency'),
      prefsUnexplained: count('unexplained'),
    };
  });
  return { byPrefYear, byYear, unexplained: byPrefYear.filter((r) => r.kind === 'unexplained') };
}

const csvCell = (value) => {
  const text = value == null ? '' : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

export function toCsv(header, records, { bom = false } = {}) {
  const lines = [header, ...records].map((cells) => cells.map(csvCell).join(','));
  return `${bom ? '﻿' : ''}${lines.join('\r\n')}\r\n`;
}

export const rowCells = (r) => [r.code, r.pref, r.name, r.year, r.value, r.unit, r.note];

/** e-Stat の VALUE 配列から、元の文字列 (記号を含む) を 地域|年 で引ける形にする。 */
export function parseEstatValues({ values, notes, yearOf }) {
  const meaning = new Map((Array.isArray(notes) ? notes : notes ? [notes] : []).map((n) => [n['@char'], n.$]));
  const symbols = new Map();
  const numbers = new Map();
  for (const item of values) {
    const key = `${item['@area']}|${yearOf(item['@time'])}`;
    const raw = item.$;
    const parsed = Number(raw);
    if (raw !== '' && Number.isFinite(parsed)) numbers.set(key, parsed);
    else symbols.set(key, { mark: raw, meaning: meaning.get(raw) ?? '' });
  }
  return { symbols, numbers };
}

/** 国勢調査の 5 桁コードを商品の自治体コードへ送る。送れないものは null。 */
export function boundaryCodeMap(areas, overrides = {}) {
  const map = new Map();
  for (const area of areas) {
    if (area.level === '2') map.set(area.cityCode, area.cityCode);
    else map.set(area.cityCode, area.prefCode);
  }
  for (const [from, to] of Object.entries(overrides)) map.set(from, to);
  return map;
}

/** 国勢調査の自治体一覧と現在の一覧のコード突合。 */
export function compareBoundaryAreas({ census, areas, overrides = {} }) {
  const municipalities = areas.filter((a) => a.level === '2');
  const map = boundaryCodeMap(areas, overrides);
  const unmapped = census.filter((c) => !map.has(c.code));
  const reached = new Set(census.map((c) => map.get(c.code)).filter(Boolean));
  const notReached = municipalities.filter((a) => !reached.has(a.cityCode)).map((a) => a.cityCode);
  const byCode = new Map(municipalities.map((a) => [a.cityCode, splitAreaName(a.cityName)]));
  const renamed = census.flatMap((c) => {
    const master = byCode.get(c.code);
    return master && master.name !== c.name ? [{ code: c.code, census: c.name, current: master.name }] : [];
  });
  const remapped = census.filter((c) => overrides[c.code]).map((c) => ({ code: c.code, name: c.name, to: overrides[c.code] }));
  return { unmapped, notReached, renamed, remapped };
}
