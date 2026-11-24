/**
 * 市区町村の分析で最初に作る「表」と、計算の前に通す検査。純関数だけを置く。
 *
 * なぜ要るか (2026-11-05 の手作業の分析 2 問いで、同じ確認を毎回手でやった):
 *   - cities.json は政令市と区が同居していて、そのまま足すと人口が 1.56 億人になる
 *   - 指標ごとに年が違う (出荷額 2023・人口 2020・従業者 2024)
 *   - 値の無い町村は小さく人口減が大きい。残った自治体だけの結論は偏る
 *   - 標本調査の 5 年の変化は市ごとにはほぼ雑音で、順位にできない
 * 問いの選択と、定義が循環していないかの判断はここでは扱わない。人が読んで決める。
 *
 * 読み込みは analysis-frame.ts。手順は .claude/skills/content/manage-issue-ledger/SKILL.md。
 */

/** 合計の検算で許す差。合わなければ計算に進まない (二重計上や対象の取り違えの検出が目的) */
export const TOTAL_TOLERANCE = 0.01;
/** 値のある自治体がこの割合を下回ったら、対象の偏りを必ず読む */
export const COVERAGE_WARN = 0.9;
/** 連続する 2 期間の変化の相関がこれ未満なら、市ごとの変化は順位にしない */
export const RELIABILITY_MIN = 0.3;
/** 指標の年の開きがこれを超えたら知らせる (年) */
export const YEAR_SPREAD_WARN = 3;

const yearOf = (code) => String(code).slice(0, 4);

/** rows (areaCode, yearCode, value) → 地域コード → 年 → 値。値の無い行は持たない (0 に読み替えない) */
export function indexRows(rows) {
  const index = new Map();
  for (const row of rows) {
    if (typeof row.value !== "number") continue;
    const years = index.get(row.areaCode) ?? {};
    years[yearOf(row.yearCode)] = row.value;
    index.set(row.areaCode, years);
  }
  return index;
}

export function latestYear(index) {
  let latest = null;
  for (const years of index.values()) for (const y of Object.keys(years)) if (!latest || y > latest) latest = y;
  return latest;
}

export const columnOf = (alias, year) => `${alias}_${year}`;

/**
 * 公開の自治体だけの表を作る。列は `別名_年`。
 * @param entities [{ code, name }]
 * @param metrics [{ alias, rows, years? }] years を省くと最新年
 */
export function buildFrame({ entities, metrics }) {
  const columns = [];
  const indexed = metrics.map((metric) => {
    const index = indexRows(metric.rows);
    const years = metric.years?.map(String) ?? [latestYear(index)];
    for (const year of years) columns.push({ alias: metric.alias, year, column: columnOf(metric.alias, year) });
    return { ...metric, index, years };
  });
  const rows = entities.map(({ code, name }) => {
    const row = { code, name };
    for (const { alias, index, years } of indexed) {
      for (const year of years) row[columnOf(alias, year)] = index.get(code)?.[year] ?? null;
    }
    return row;
  });
  return { rows, columns };
}

/** 全行の合計・公開の自治体の合計・県の合計を比べる。県の値が無い指標は検算できないと返す */
export function checkTotal({ alias, year, rows, entities, prefectureRows }) {
  const index = indexRows(rows);
  const sumOf = (codes) => [...codes].reduce((sum, code) => sum + (index.get(code)?.[year] ?? 0), 0);
  const allRows = sumOf(index.keys());
  const entitySum = sumOf(entities.map((e) => e.code));
  const prefectures = (prefectureRows ?? []).filter((r) => yearOf(r.yearCode) === String(year) && r.areaCode !== "00000" && typeof r.value === "number");
  if (prefectures.length !== 47) {
    return { alias, year, allRows, entitySum, reference: null, ratio: null, status: "unverified", note: `県の値が ${prefectures.length} 件で検算できない` };
  }
  const reference = prefectures.reduce((sum, r) => sum + r.value, 0);
  const ratio = entitySum / reference;
  const ok = Math.abs(ratio - 1) <= TOTAL_TOLERANCE;
  return { alias, year, allRows, entitySum, reference, ratio, status: ok ? "ok" : "mismatch", note: ok ? "" : `県の合計と ${((ratio - 1) * 100).toFixed(1)}% ずれている` };
}

/** 指標の年の開き。比べる年がずれたまま結論を書かないよう、表に年を残す */
export function checkYears(frame) {
  const years = frame.columns.map((c) => Number(c.year));
  const lastByAlias = new Map();
  for (const { alias, year } of frame.columns) lastByAlias.set(alias, Math.max(lastByAlias.get(alias) ?? 0, Number(year)));
  const latest = [...lastByAlias.values()];
  const spread = Math.max(...latest) - Math.min(...latest);
  return { min: Math.min(...years), max: Math.max(...years), latestByAlias: Object.fromEntries(lastByAlias), spread, status: spread > YEAR_SPREAD_WARN ? "warn" : "ok" };
}

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted.length ? sorted[Math.floor((sorted.length - 1) / 2)] : null;
};

/** 列がそろう自治体と抜ける自治体を分け、抜けた側がどんな町かを compareColumn の中央値で示す */
export function checkCoverage(frame, { required, compareColumn }) {
  const complete = (row) => required.every((column) => typeof row[column] === "number");
  const kept = frame.rows.filter(complete);
  const dropped = frame.rows.filter((row) => !complete(row));
  const share = kept.length / frame.rows.length;
  const compare = (rows) => (compareColumn ? median(rows.map((r) => r[compareColumn]).filter((v) => typeof v === "number")) : null);
  return { total: frame.rows.length, kept: kept.length, dropped: dropped.length, share, compareColumn: compareColumn ?? null, keptMedian: compare(kept), droppedMedian: compare(dropped), status: share < COVERAGE_WARN ? "warn" : "ok", rows: kept };
}

export function correlation(xs, ys) {
  if (xs.length < 3 || xs.length !== ys.length) return null;
  const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;
  const mx = mean(xs), my = mean(ys);
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < xs.length; i++) {
    sxy += (xs[i] - mx) * (ys[i] - my);
    sxx += (xs[i] - mx) ** 2;
    syy += (ys[i] - my) ** 2;
  }
  return sxx > 0 && syy > 0 ? sxy / Math.sqrt(sxx * syy) : null;
}

/**
 * 前の期間によく増えた地域が次の期間も増えるか。相関が低ければ、変化の順位は雑音を並べているだけになる。
 * 集団の傾向 (人口が減った町の平均など) はこの検査で否定されない。
 */
export function checkReliability(frame, { alias, years }) {
  if (years.length !== 3) throw new Error(`信頼性の検査は 3 時点が要る: ${alias} (${years.join(",")})`);
  const [a, b, c] = years.map((y) => columnOf(alias, y));
  const rows = frame.rows.filter((r) => [a, b, c].every((column) => typeof r[column] === "number"));
  const r = correlation(rows.map((row) => row[b] - row[a]), rows.map((row) => row[c] - row[b]));
  const status = r === null ? "unverified" : r < RELIABILITY_MIN ? "warn" : "ok";
  return { alias, years, n: rows.length, r, status, note: status === "warn" ? "市ごとの変化は順位にしない。集団の傾向として読む" : "" };
}

/** 合計が合わないときだけ止める。ほかは読む人への知らせで、結論を読み替えるのは人の仕事 */
export function summarize({ totals, years, coverage, reliability }) {
  const blockers = totals.filter((t) => t.status === "mismatch").map((t) => `${t.alias} ${t.year}: ${t.note}`);
  const warnings = [
    ...totals.filter((t) => t.status === "unverified").map((t) => `${t.alias} ${t.year}: ${t.note}`),
    ...(years.status === "warn" ? [`指標の年が ${years.spread} 年開いている`] : []),
    ...(coverage.status === "warn" ? [`値のある自治体は ${coverage.kept} / ${coverage.total}。抜けた町の偏りを読む`] : []),
    ...reliability.filter((r) => r.status !== "ok").map((r) => `${r.alias}: ${r.status === "warn" ? `変化の信頼性 r=${r.r.toFixed(2)}。${r.note}` : "信頼性を計算できない"}`),
  ];
  return { ok: blockers.length === 0, blockers, warnings };
}
