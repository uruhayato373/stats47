/**
 * e-Stat の実在年の台帳 (`data/estat/availability/tables/<statsDataId>.json`) の型と、
 * metric config の `years` と台帳を突き合わせる純粋関数。
 *
 * ## なぜ台帳を持つか
 *
 * `years` 1 つに「e-Stat にある年 (事実)」と「見せないと決めた年 (判断)」が混ざり、両者を区別できなかった。
 * D1 時代の取り込みで欠けた年が 2026-05 の移行で `years` に固定され、取り込み (`page-data-batch.ts` の
 * `inYearRange`) が設定にない年を捨てるので、穴が直らないまま残っていた (2026-10-07 時点で
 * 有効な e-Stat 指標 1,535 件中 652 件)。台帳は「取り込みが全年を許したら何年に何県の値が出るか」を
 * e-Stat から測った事実だけを持つ。経緯と段取り: `.claude/todo/backlog.md` ESTAT-YEAR-AVAILABILITY-01。
 *
 * 第 1 段 (今) は台帳と差分の報告だけで、取り込みの挙動は変えない。
 */
import type { EstatSource, YearSpec } from './types';

/** 台帳に載せる取り出し条件。取り込みが e-Stat に投げる形を決めるキーだけを持つ (表示用の名前・単位換算は持たない)。 */
export type EstatAvailabilityQuery = Omit<
  EstatSource,
  'kind' | 'statsDataId' | 'valueScale' | 'displayName' | 'url'
>;

export interface EstatAvailabilityEntry {
  query: EstatAvailabilityQuery;
  /** この条件を取り直した日時 (ISO) */
  fetchedAt: string;
  /** 年 (4 桁) → 値のある都道府県の数 (同じ県の重複行は 1 と数える)。値が 1 県も無い年は載せない */
  years?: Record<string, number>;
  /** e-Stat が返した行数 */
  rawRows?: number;
  /** 取得上限で行が切れた (この条件の数は信用できない) */
  truncated?: boolean;
  /** 同じ県・年に 2 行以上ある (軸の絞り忘れ。取り込みの形状ゲートが書き込みを止める形なので、差分は比べない) */
  duplicateRows?: boolean;
  /** 取得に失敗した理由。失敗した条件は years を持たない */
  error?: string;
}

export interface EstatAvailabilityTable {
  statsDataId: string;
  statName: string;
  title: string;
  /** e-Stat の表の更新日 (TABLE_INF.UPDATED_DATE)。変わった表だけ取り直す */
  updatedDate: string;
  queries: EstatAvailabilityEntry[];
}

const QUERY_KEYS = [
  'cdCat01',
  'cdCat02',
  'cdCat03',
  'cdCat04',
  'cdCat05',
  'cdTab',
  'tabCombination',
  'axisSum',
  'axisRatio',
  'areaAxis',
  'timeScope',
] as const satisfies readonly (keyof EstatAvailabilityQuery)[];

/** 取り込みの e-Stat 条件から台帳の取り出し条件を作る。未指定のキーは持たない。 */
export function availabilityQueryOf(source: EstatSource): EstatAvailabilityQuery {
  const query: Record<string, unknown> = {};
  for (const key of QUERY_KEYS) {
    const value = source[key];
    if (value !== undefined && value !== '') query[key] = value;
  }
  return query as EstatAvailabilityQuery;
}

/** 取り出し条件を 1 本の文字列にする (キーの順は固定)。同じ条件の metric は同じ台帳の行を使う。 */
export function availabilityQueryKey(query: EstatAvailabilityQuery): string {
  return JSON.stringify(
    QUERY_KEYS.filter((key) => query[key] !== undefined).map((key) => [key, query[key]]),
  );
}

/** `years` を 4 桁の年の昇順の配列にする。`'all'` は許可リストが無いので null。 */
export function expandYearSpec(spec: YearSpec): number[] | null {
  if (spec === 'all') return null;
  // フルタイムコード (例 2009100000) が混ざる config があるので 4 桁へ寄せる (inYearRange と同じ)
  const to4 = (n: number): number => (n > 9999 ? Number(String(n).slice(0, 4)) : n);
  if ('years' in spec) return [...new Set(spec.years.map(to4))].sort((a, b) => a - b);
  const out: number[] = [];
  for (let y = to4(spec.from); y <= to4(spec.to); y++) out.push(y);
  return out;
}

export interface YearAvailabilityDiff {
  /** 設定の最初と最後の年のあいだで、全県の値があるのに設定にない年 (取り込み忘れ) */
  missingInside: number[];
  /** 設定の最後の年より後で、全県の値がある年 (新しい年が出ている) */
  newer: number[];
  /** 設定の最初の年より前で、全県の値がある年 */
  older: number[];
  /** 設定にあるのに e-Stat に 1 県も値が無い年 (補完元の年は除く) */
  notInEstat: number[];
  /** 一部の県だけ値がある年 → 県の数。上の分類には入れない */
  partial: Record<string, number>;
}

/**
 * 設定の年と台帳を比べる。「全県」はその条件で最も多く値が出た年の県の数とする
 * (港湾・漁業のように 47 県がそろわない統計があるため 47 に固定しない)。
 */
export function diffYearAvailability(params: {
  configYears: readonly number[];
  ledgerYears: Readonly<Record<string, number>>;
  /** supplementalSources で別の表から補う年。e-Stat の主の表に無くてよい */
  suppliedYears?: readonly number[];
}): YearAvailabilityDiff {
  const { configYears, ledgerYears } = params;
  const configured = new Set(configYears);
  const supplied = new Set(params.suppliedYears ?? []);
  const full = Math.max(0, ...Object.values(ledgerYears));
  const first = Math.min(...configYears);
  const last = Math.max(...configYears);

  const diff: YearAvailabilityDiff = {
    missingInside: [],
    newer: [],
    older: [],
    notInEstat: [],
    partial: {},
  };
  for (const [yearCode, count] of Object.entries(ledgerYears).sort(([a], [b]) => a.localeCompare(b))) {
    const year = Number(yearCode);
    if (count < full) {
      diff.partial[yearCode] = count;
      continue;
    }
    if (configured.has(year)) continue;
    if (year > last) diff.newer.push(year);
    else if (year < first) diff.older.push(year);
    else diff.missingInside.push(year);
  }
  for (const year of configYears) {
    if (!supplied.has(year) && !ledgerYears[String(year)]) diff.notInEstat.push(year);
  }
  return diff;
}

/** [2009, 2010, 2011, 2024] → "2009–2011, 2024" (報告用) */
export function formatYearList(years: readonly number[]): string {
  const sorted = [...new Set(years)].sort((a, b) => a - b);
  const parts: string[] = [];
  for (let i = 0; i < sorted.length; i++) {
    let j = i;
    while (j + 1 < sorted.length && sorted[j + 1] === sorted[j]! + 1) j++;
    parts.push(i === j ? String(sorted[i]) : `${sorted[i]}–${sorted[j]}`);
    i = j;
  }
  return parts.join(', ');
}
