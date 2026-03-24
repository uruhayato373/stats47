/**
 * GIS パッケージの設定
 *
 * 環境変数 GIS_DATA_SOURCE で地理データのソースを切り替える。
 * - "mlit": 国土数値情報 (MLIT) の TopoJSON を R2 から取得（デフォルト）
 * - "geoshape": 既存の geoshape データを使用
 */

export type GisDataSource = "mlit" | "geoshape";

/**
 * GIS データソースを取得
 *
 * 環境変数 GIS_DATA_SOURCE の値に応じて返す。
 * 未設定の場合は "mlit" を返す。
 */
export function getGisDataSource(): GisDataSource {
  if (typeof process !== "undefined" && process.env?.GIS_DATA_SOURCE === "geoshape") {
    return "geoshape";
  }
  return "mlit";
}
