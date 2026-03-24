import type { AreaType } from "@stats47/types";

/**
 * 政令指定都市の区表示モード
 *
 * - `"merged"`: 政令指定都市統合版（区を市に統合）
 * - `"split"`: 政令指定都市分割版（区を個別に表示）
 */
export type DesignatedCityWardMode = "merged" | "split";

/**
 * データ取得オプション
 *
 * TopoJSONデータ取得時のオプション設定。
 */
export interface GeoshapeOptions {
  /** 地域レベル */
  areaType: AreaType;
  /** 都道府県コード（5桁） */
  prefCode?: string;
  /** 政令指定都市の区表示モード（デフォルト: `"merged"`） */
  wardMode?: DesignatedCityWardMode;
}
