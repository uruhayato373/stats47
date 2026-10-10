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

/** 台帳の行が数える地域。県 (既定) か市区町村 (現行の市区町村マスタにあるコードだけ)。 */
export type EstatAvailabilityLevel = 'prefecture' | 'city';

export interface EstatAvailabilityEntry {
  query: EstatAvailabilityQuery;
  /** 市区町村の値を数えた行だけ 'city' を持つ (無ければ県) */
  level?: 'city';
  /** この条件を取り直した日時 (ISO) */
  fetchedAt: string;
  /** 年 (4 桁) → 値のある都道府県 (level が city なら市区町村) の数 (同じ地域の重複行は 1 と数える)。値が 1 つも無い年は載せない */
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

/** 取り出し条件を 1 本の文字列にする (キーの順は固定)。同じ条件の metric は同じ台帳の行を使う。市区町村は別の行。 */
export function availabilityQueryKey(
  query: EstatAvailabilityQuery,
  level: EstatAvailabilityLevel = 'prefecture',
): string {
  const key = JSON.stringify(
    QUERY_KEYS.filter((k) => query[k] !== undefined).map((k) => [k, query[k]]),
  );
  return level === 'city' ? `city:${key}` : key;
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
  /** yearExclusions に書いた年。判断済みなので差分に数えない */
  excludedYears?: readonly number[];
}): YearAvailabilityDiff {
  const { configYears, ledgerYears } = params;
  const configured = new Set([...configYears, ...(params.excludedYears ?? [])]);
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

// ---- 台帳から years を決める (第 2 段) ----

/** 移行時に当時の `years` から引き継いだだけの除外の理由。誰かが判断したら具体的な理由に書き換える。 */
export const YEAR_EXCLUSION_INHERITED =
  '2026-10 の移行時に当時の years から引き継いだ除外 (まだ判断していない。根拠が無ければ外して年を戻す)';

/** 全県の値がある年 (その条件で最も多く値が出た年の県の数に届く年)。 */
export function fullLedgerYears(ledgerYears: Readonly<Record<string, number>>): number[] {
  const full = Math.max(0, ...Object.values(ledgerYears));
  return Object.entries(ledgerYears)
    .filter(([, count]) => full > 0 && count === full)
    .map(([year]) => Number(year))
    .sort((a, b) => a - b);
}

/** 2 年以上の一定間隔 (5 年おきなど) で並べた設定か。最後の 1 年 (最新年の追加) は間隔に数えない。 */
function isRegularlySpaced(configYears: readonly number[]): boolean {
  if (configYears.length < 3) return false;
  const steps = configYears.slice(1).map((year, i) => year - configYears[i]!).slice(0, -1);
  return steps.length >= 2 && steps.every((step) => step === steps[0]) && steps[0]! > 1;
}

/**
 * 移行 (2026-10) で除外として引き継ぐ年。意図して外した可能性がある年だけを残し、穴は埋める。
 * - 複数年の設定で、最初の年より前の全県の年 (基準の切り替えで外した可能性がある)
 * - 一定間隔の設定で、間に挟まった全県の年 (5 年おきに揃えた可能性がある)
 * 1 年だけの設定の古い年は引き継がない (`metric-config-standards.md`「years は最新年だけに絞らない」で既に誤りと決まっている)。
 */
export function inheritedExclusionYears(
  configYears: readonly number[],
  ledgerYears: Readonly<Record<string, number>>,
): number[] {
  // e-Stat に無い年は設定の形 (最初の年・間隔) の根拠にしない。人口増減率は 5 年おきの国勢調査年を
  // 設定していたが、今の取り出し条件にはその年が無く 2021 年以降だけがある (5 年おきの意図は残っていない)
  const sorted = configYears.filter((year) => (ledgerYears[String(year)] ?? 0) > 0).sort((a, b) => a - b);
  if (sorted.length <= 1) return [];
  const configured = new Set(sorted);
  const first = sorted[0]!;
  const last = sorted[sorted.length - 1]!;
  const spaced = isRegularlySpaced(sorted);
  return fullLedgerYears(ledgerYears).filter(
    (year) => !configured.has(year) && (year < first || (spaced && year < last)),
  );
}

export interface ResolvedLedgerYears {
  /** 新しい years (昇順) */
  years: number[];
  /** 足した年 (全県の値があり、除外されていない) */
  added: number[];
  /** 外した年 (除外に書かれた年と、removeMissing のときは 1 県も値が無い年) */
  removed: number[];
}

/**
 * metric の years を台帳から決める。sync-estat-years.ts と、その --check が使う唯一の規則。
 * - 全県の値がある年は、除外されていなければ入れる
 * - 除外に書かれた年は外す
 * - 1 県も値が無い年は removeMissing のときだけ外す (補完元から入れる年は外さない)。台帳を取り直したときの
 *   e-Stat の一時的な欠けで配信中の年を消さないよう、週次の自動同期では外さず報告 (e-Stat に無い年) に出す
 * - 一部の県だけ値がある年は今の years のまま (足しも外しもしない。載せるかは人が決める)
 */
export function resolveLedgerYears(params: {
  configYears: readonly number[];
  ledgerYears: Readonly<Record<string, number>>;
  excludedYears?: readonly number[];
  suppliedYears?: readonly number[];
  removeMissing?: boolean;
}): ResolvedLedgerYears {
  const { configYears, ledgerYears } = params;
  const excluded = new Set(params.excludedYears ?? []);
  const supplied = new Set(params.suppliedYears ?? []);
  const next = new Set<number>();
  for (const year of configYears) {
    const missing = !supplied.has(year) && (ledgerYears[String(year)] ?? 0) === 0;
    const keep = supplied.has(year) || (!excluded.has(year) && !(params.removeMissing && missing));
    if (keep) next.add(year);
  }
  for (const year of fullLedgerYears(ledgerYears)) if (!excluded.has(year)) next.add(year);
  const before = new Set(configYears);
  const years = [...next].sort((a, b) => a - b);
  return {
    years,
    added: years.filter((year) => !before.has(year)),
    removed: [...before].filter((year) => !next.has(year)).sort((a, b) => a - b),
  };
}
