/**
 * 指標の時系列 (取れる全年) を R2 の観測値 `app/stats/<metric>/values.json` から作る。
 *
 * - 年は 4 桁に正規化する (`extractYearCode`・`.claude/rules/estat-api.md`)。4 桁にできない年は落として理由を残す。
 * - 単位は `@stats47/data-configs` の単位の正典 (`classifyUnitComparability`) で、比較表の単位にそろえる。
 *   同じ単位ならそのまま、換算できる単位なら換算し、比べられない単位の年は落として理由を残す (1 倍で通さない)。
 * - 欠測は 0 にしない (value=null + 理由)。
 * - 年の定義が変わった指標 (暦年と年度の混在・別の統計表で補った年) は注記を付ける。
 * 純粋関数 (`parseTimeSeries`) と取得 (`fetchMetricTimeSeries`) を分け、テストは純粋関数に当てる。
 */
import { statsR2Key } from "@stats47/r2-storage/keys";
import { classifyUnitComparability } from "@stats47/data-configs/unit";
import { extractYearCode } from "@stats47/estat-api/api";
import { SITE } from "@stats47/data-configs";
import type { Dataset, PrefectureDatum } from "./dataset";
import { PREFECTURE_CODES5, toCode5 } from "./prefectures";
import { fetchJsonWithRetry } from "./load-ranking-values";

const R2_BASE = process.env.R2_PUBLIC_FETCH_URL ?? SITE.r2PublicBaseUrl;

/** R2 `app/stats/<metric>/values.json` の行。 */
export interface StatsValueRow {
  readonly areaCode: string;
  readonly yearCode: string;
  readonly yearName?: string;
  readonly value: number | null;
  readonly unit?: string;
}

export interface StatsValuesPayload {
  readonly metricKey?: string;
  readonly rows: readonly StatsValueRow[];
  readonly meta?: {
    readonly recipe?: {
      readonly ops?: {
        readonly supplements?: readonly {
          readonly years?: readonly number[];
          readonly estatParams?: { readonly statsDataId?: string };
        }[];
      };
    };
  };
}

export type YearBasis = "暦年" | "年度" | "不明";

export interface SeriesYear {
  /** 4 桁の年。 */
  readonly year: string;
  readonly basis: YearBasis;
  /** 47 県ぶん (PREFECTURE_CODES5 と同じ並び)。 */
  readonly values: readonly PrefectureDatum[];
}

export interface DroppedYear {
  readonly year: string;
  readonly reason: string;
}

export interface MetricTimeSeries {
  readonly rankingKey: string;
  readonly indicator: string;
  /** 比較表と同じ単位。 */
  readonly unit: string;
  readonly category?: string;
  /** 古い年から。 */
  readonly years: readonly SeriesYear[];
  /** 買い手に見せる注記 (年の定義・補完・換算・欠測)。 */
  readonly notes: readonly string[];
  /** 取り込まなかった年とその理由 (報告用)。 */
  readonly dropped: readonly DroppedYear[];
}

export interface SeriesBase {
  readonly rankingKey: string;
  readonly indicator: string;
  readonly unit: string;
  readonly category?: string;
}

const PREFECTURE_SET: ReadonlySet<string> = new Set(PREFECTURE_CODES5);

function basisOf(yearName: string | undefined): YearBasis {
  if (!yearName) return "不明";
  if (yearName.endsWith("年度")) return "年度";
  if (yearName.endsWith("年")) return "暦年";
  return "不明";
}

function normalizeAreaCode(code: string): string {
  return /^\d{2}$/.test(code) ? toCode5(code) : code;
}

/** 連続する同じ値の年を「a〜b」にまとめる (年は昇順)。 */
function rangesOf(years: readonly string[]): string {
  const out: string[] = [];
  let start = 0;
  for (let i = 1; i <= years.length; i += 1) {
    if (i === years.length || Number(years[i]) !== Number(years[i - 1]) + 1) {
      out.push(start === i - 1 ? years[start] : `${years[start]}〜${years[i - 1]}`);
      start = i;
    }
  }
  return out.join("、");
}

/** 年ごとの「暦年／年度」の並びを、変わり目が分かる文にする。1 種類なら null。 */
function basisNote(years: readonly SeriesYear[]): string | null {
  const known = years.filter((y) => y.basis !== "不明");
  if (new Set(known.map((y) => y.basis)).size < 2) return null;
  const runs: { basis: YearBasis; years: string[] }[] = [];
  for (const y of known) {
    const last = runs[runs.length - 1];
    if (last && last.basis === y.basis) last.years.push(y.year);
    else runs.push({ basis: y.basis, years: [y.year] });
  }
  return `年の定義が途中で変わっています（${runs.map((r) => `${r.years[0]}〜${r.years[r.years.length - 1]}年は${r.basis}`).join("、")}）。年をまたぐ比較では暦年と年度のずれに注意してください。`;
}

/**
 * R2 の観測値を指標の時系列にする (純粋関数)。
 * @param base 比較表 (Dataset) の指標名・単位。時系列の単位はこれにそろえる。
 */
export function parseTimeSeries(payload: StatsValuesPayload, base: SeriesBase): MetricTimeSeries {
  const dropped: DroppedYear[] = [];
  const notes: string[] = [];
  const converted = new Set<string>();

  // 年 → 県コード → { value, conflict }
  const byYear = new Map<string, { basis: YearBasis; cells: Map<string, { value: number | null; conflict: boolean }> }>();
  const unitDropped = new Map<string, Set<string>>();
  let conflicts = 0;

  for (const row of payload.rows) {
    const code5 = normalizeAreaCode(row.areaCode);
    if (!PREFECTURE_SET.has(code5)) continue; // 全国・市区町村などは入れない
    const year = extractYearCode(row.yearCode);
    if (!/^\d{4}$/.test(year)) {
      if (!dropped.some((d) => d.year === row.yearCode)) dropped.push({ year: row.yearCode, reason: "年を 4 桁にできない" });
      continue;
    }

    let value = row.value;
    const rowUnit = row.unit ?? "";
    if (value !== null && rowUnit !== "" && rowUnit !== base.unit) {
      const verdict = classifyUnitComparability(rowUnit, base.unit);
      if (verdict.verdict === "incomparable") {
        const set = unitDropped.get(year) ?? new Set<string>();
        set.add(`${rowUnit}→${base.unit}(${verdict.reason})`);
        unitDropped.set(year, set);
        continue;
      }
      if (verdict.verdict === "convertible") {
        value *= verdict.factor;
        converted.add(`${rowUnit}→${base.unit}`);
      }
    }

    const slot = byYear.get(year) ?? { basis: basisOf(row.yearName), cells: new Map() };
    byYear.set(year, slot);
    const prev = slot.cells.get(code5);
    if (prev === undefined) slot.cells.set(code5, { value, conflict: false });
    else if (prev.value !== value) {
      slot.cells.set(code5, { value: null, conflict: true });
      conflicts += 1;
    }
  }

  for (const [year, reasons] of unitDropped) {
    if (!byYear.has(year)) dropped.push({ year, reason: `単位が比べられない: ${[...reasons].join(" / ")}` });
  }

  const years: SeriesYear[] = [...byYear.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([year, slot]) => ({
      year,
      basis: slot.basis,
      values: PREFECTURE_CODES5.map((code5): PrefectureDatum => {
        const cell = slot.cells.get(code5);
        if (cell === undefined || cell.value === null) return { code5, value: null, missing: "missing" };
        return { code5, value: cell.value };
      }),
    }));

  const basis = basisNote(years);
  if (basis) notes.push(basis);

  const supplements = payload.meta?.recipe?.ops?.supplements ?? [];
  for (const s of supplements) {
    const ys = (s.years ?? []).map(String).filter((y) => years.some((x) => x.year === y)).sort();
    if (ys.length === 0) continue;
    const table = s.estatParams?.statsDataId ? `（statsDataId ${s.estatParams.statsDataId}）` : "";
    notes.push(`${rangesOf(ys)}年は、他の年とは別の統計表${table}の値で補っています。前の年との比較では定義の違いに注意してください。`);
  }

  if (converted.size > 0) notes.push(`単位が異なる年は、単位の定義に従って「${base.unit}」へ換算しています（${[...converted].join("、")}）。`);
  if (conflicts > 0) notes.push(`同じ年・同じ県に異なる値が重複していた ${conflicts} 件は、どちらも採らず空欄にしています。`);

  const gaps = years
    .map((y) => ({ year: y.year, n: y.values.filter((v) => v.value === null).length }))
    .filter((y) => y.n > 0 && y.n < PREFECTURE_CODES5.length);
  if (gaps.length > 0) {
    notes.push(`欠測のある年: ${gaps.map((g) => `${g.year}年（${g.n}県）`).join("、")}。欠測は 0 にせず空欄にしています。`);
  }
  for (const d of dropped) notes.push(`${d.year} は取り込んでいません（${d.reason}）。`);

  return { ...base, years, notes, dropped };
}

/** R2 から 1 指標の時系列を取る。取れなければ例外 (黙って飛ばさない)。 */
export async function fetchMetricTimeSeries(
  base: SeriesBase,
  deps: { fetchImpl?: typeof fetch; sleep?: (ms: number) => Promise<void> } = {},
): Promise<MetricTimeSeries> {
  const payload = await fetchJsonWithRetry<StatsValuesPayload>(`${R2_BASE}/${statsR2Key(base.rankingKey, "prefecture")}`, base.rankingKey, deps);
  return parseTimeSeries(payload, base);
}

/** 比較表 (Dataset) と同じ指標の時系列を、並列で取る。順序は datasets のまま。 */
export async function fetchSeriesForDatasets(
  datasets: readonly Dataset[],
  opts: { concurrency?: number; onProgress?: (done: number, total: number) => void; fetchSeries?: typeof fetchMetricTimeSeries } = {},
): Promise<MetricTimeSeries[]> {
  const fetchSeries = opts.fetchSeries ?? fetchMetricTimeSeries;
  const out: MetricTimeSeries[] = new Array(datasets.length);
  let next = 0;
  let done = 0;
  async function worker(): Promise<void> {
    for (;;) {
      const i = next++;
      if (i >= datasets.length) return;
      const ds = datasets[i];
      if (!ds.rankingKey) throw new Error(`時系列を取れない: 指標キーの無い指標 ${ds.indicator}`);
      out[i] = await fetchSeries({ rankingKey: ds.rankingKey, indicator: ds.indicator, unit: ds.unit, category: ds.category });
      done += 1;
      opts.onProgress?.(done, datasets.length);
    }
  }
  await Promise.all(Array.from({ length: Math.min(opts.concurrency ?? 8, datasets.length) }, () => worker()));
  return out;
}

export interface SeriesMismatch {
  readonly rankingKey: string;
  readonly reason: string;
}

export interface SeriesComparison {
  readonly mismatch: SeriesMismatch | null;
  /**
   * 比較表の値が時系列の値を丸めたものだったときの小数の桁数 (全県で同じ値か、丸めると同じ値のとき)。
   * 丸めがなければ null。R2 の ranking と stats で丸めの有無が違う指標がある (例 584.8 と 584.83)。
   */
  readonly roundedDecimals: number | null;
}

/** 小数点以下の桁数 (指数表記でない通常の数)。 */
function decimalsOf(v: number): number {
  const text = String(v);
  const dot = text.indexOf(".");
  return dot < 0 ? 0 : text.length - dot - 1;
}

/**
 * 時系列と比較表 (Dataset) が同じ値を指していることを確かめる (純粋関数)。
 * 比較表の基準年の値が時系列に無い・1 県でも違う場合は不一致。パックの中で表と推移が食い違うのを止める。
 * 比較表の値が時系列の値を小数第 n 位に丸めたものと一致する場合は、不一致にせず roundedDecimals で知らせる
 * (時系列の注記に書く。丸めを黙って同じ値と見なさない)。
 */
export function compareSeriesWithDataset(series: MetricTimeSeries, ds: Dataset): SeriesComparison {
  const hit = series.years.find((y) => y.year === ds.year);
  if (!hit) return { mismatch: { rankingKey: series.rankingKey, reason: `比較表の基準年 ${ds.year} が時系列に無い` }, roundedDecimals: null };
  let rounded: number | null = null;
  for (let i = 0; i < ds.values.length; i += 1) {
    const a = ds.values[i].value;
    const b = hit.values[i]?.value ?? null;
    if (a === null && b === null) continue;
    if (a === null || b === null) {
      return { mismatch: { rankingKey: series.rankingKey, reason: `${ds.year} 年の ${ds.values[i].code5} が違う (比較表 ${String(a)} / 時系列 ${String(b)})` }, roundedDecimals: null };
    }
    if (Math.abs(a - b) <= Math.abs(a) * 1e-9) continue;
    const d = decimalsOf(a);
    const half = 0.5 * 10 ** -d;
    if (decimalsOf(b) > d && Math.abs(a - b) <= half + half * 1e-9) {
      rounded = Math.max(rounded ?? 0, d);
      continue;
    }
    return { mismatch: { rankingKey: series.rankingKey, reason: `${ds.year} 年の ${ds.values[i].code5} が違う (比較表 ${String(a)} / 時系列 ${String(b)})` }, roundedDecimals: null };
  }
  return { mismatch: null, roundedDecimals: rounded };
}

/** 丸めの注記を足した時系列。 */
export function withRoundingNote(series: MetricTimeSeries, ds: Dataset, decimals: number): MetricTimeSeries {
  const place = decimals === 0 ? "整数" : `小数第 ${decimals} 位`;
  return { ...series, notes: [...series.notes, `比較表（${ds.year}年）の値は${place}までに丸めています。時系列は丸める前の値です。`] };
}

/** 後方互換の短縮 (不一致だけを返す)。 */
export function checkSeriesAgainstDataset(series: MetricTimeSeries, ds: Dataset): SeriesMismatch | null {
  return compareSeriesWithDataset(series, ds).mismatch;
}
