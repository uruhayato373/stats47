/**
 * 47 都道府県データセット。単一指標・単一基準年で 47 県を保持する。
 * 欠損・秘匿・非該当は 0 にせず null + 理由で保持する (仕様 §共通仕様)。異年次結合は別データセットにする。
 */
import type { SourceRow } from "./sources";
import { PREFECTURE_CODES5, toCode5 } from "./prefectures";

export type MissingReason = "missing" | "confidential" | "na";

export interface PrefectureDatum {
  readonly code5: string;
  /** 実測値。欠損・秘匿・非該当は null。 */
  readonly value: number | null;
  /** value が null の理由 (欠損=missing / 秘匿=confidential / 非該当=na)。 */
  readonly missing?: MissingReason;
}

export interface Dataset {
  readonly indicator: string;
  readonly unit: string;
  /** 基準年 (4 桁)。 */
  readonly year: string;
  /** e-Stat カテゴリ (17 分類・任意)。xlsx のカテゴリ別グループシートで使う。 */
  readonly category?: string;
  readonly source: SourceRow;
  /** 架空サンプルなら true (実データ商品は false)。生成物の注記に反映する。 */
  readonly isSample: boolean;
  /** 47 県ぶん (PREFECTURE_CODES5 と同じ並び)。 */
  readonly values: readonly PrefectureDatum[];
}

export interface DatasetInput {
  readonly indicator: string;
  readonly unit: string;
  readonly year: string;
  readonly source: SourceRow;
  /** 既定 false (実データ)。架空サンプルのみ true。 */
  readonly isSample?: boolean;
  readonly values: readonly { code: string | number; value: number | null; missing?: MissingReason }[];
}

/**
 * 任意の入力行を 47 県へ正規化する。
 * - コードは 5 桁へ正規化して結合。
 * - 入力に無い県は value=null / missing="missing" で補う (0 で埋めない)。
 */
export function normalizeDataset(input: DatasetInput): Dataset {
  const byCode = new Map<string, { value: number | null; missing?: MissingReason }>();
  for (const row of input.values) {
    const code5 = toCode5(row.code);
    byCode.set(code5, { value: row.value, missing: row.missing });
  }
  const values: PrefectureDatum[] = PREFECTURE_CODES5.map((code5) => {
    const hit = byCode.get(code5);
    if (!hit) return { code5, value: null, missing: "missing" };
    if (hit.value === null && !hit.missing) return { code5, value: null, missing: "missing" };
    return hit.missing ? { code5, value: hit.value, missing: hit.missing } : { code5, value: hit.value };
  });
  return {
    indicator: input.indicator,
    unit: input.unit,
    year: input.year,
    source: input.source,
    isSample: input.isSample ?? false,
    values,
  };
}
