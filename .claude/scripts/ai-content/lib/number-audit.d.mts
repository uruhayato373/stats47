/**
 * number-audit.mjs の型宣言 (実体の隣に置く)。
 *
 * ★なぜ要るか: 書籍側 (packages/product-factory の ai-content-composer.ts) が、
 *   ai-content の監査と**まったく同じ判定**を使うためにこの .mjs を import する。
 *   ロジックを TS 側へ書き写すと「サイトでは通るが書籍では落ちる」二重基準が生まれるので、
 *   実装は 1 つに保ち型だけここで与える。**.mjs の signature を変えたらこの宣言も直す。**
 *   (実体が .mjs なのは pre-commit / 日次 cron が `node` で直接実行するため)
 */

export interface AuditValueRow {
  areaName?: string;
  areaCode?: string;
  value: number;
  rank?: number;
}

/** buildValueContext の返り値 (呼び出し側で使う分だけ宣言)。 */
export interface AuditValueContext {
  min: number;
  max: number;
  count: number;
}

export interface AuditOutOfRange {
  raw: string;
  value: number;
}

export const MIN_AUDITED_VALUE: number;
export const REL_TOLERANCE: number;
export const STRICT_TOLERANCE: number;
export const APPROX_TOLERANCE: number;

export function buildValueContext(input: {
  values: readonly AuditValueRow[];
  unit?: string;
  yearCode?: string;
}): AuditValueContext | null;

export function findOutOfRangeNumbers(
  text: string,
  ctx: AuditValueContext | null,
  tol?: number,
): AuditOutOfRange[];
