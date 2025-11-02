/**
 * Prefecture Service
 *
 * 都道府県に関するビジネスロジックを担当するサービス層。
 * 都道府県データの取得、検索、地域マッピングの生成などの機能を提供する。
 *
 * ## 主な機能
 * - 都道府県一覧の取得
 * - 都道府県コードによる検索
 * - 都道府県コードから地域ブロックへの変換
 * - 地域マッピングの生成
 *
 * @module PrefectureService
 */

import { fetchPrefectures } from "../repositories/area-repository";
import { Prefecture } from "../types/index";
import { PREFECTURE_TO_REGION_MAP, REGIONS } from "../utils/region-mapping";

/**
 * 全ての都道府県を取得
 *
 * 全国の都道府県データを一覧で取得する。
 * リポジトリ層から取得したデータをそのまま返す。
 *
 * @returns {Promise<Prefecture[]>} 都道府県データの配列
 * @throws {Error} リポジトリ層でのデータ取得に失敗した場合
 *
 * @example
 * ```ts
 * const prefectures = await listPrefectures();
 * console.log(`全国の都道府県数: ${prefectures.length}`);
 * ```
 */
export async function listPrefectures(): Promise<Prefecture[]> {
  return await fetchPrefectures();
}

/**
 * 都道府県コードで検索
 *
 * 指定された都道府県コードに一致する都道府県データを1件取得する。
 * 存在しない場合は `null` を返す（エラーをスローしない）。
 *
 * @param {string} prefCode - 都道府県コード（2桁または5桁形式）
 * @returns {Promise<Prefecture | null>} 都道府県データ。見つからない場合は `null`
 * @throws {Error} リポジトリ層でのデータ取得に失敗した場合
 *
 * @example
 * ```ts
 * // 東京都（13）を取得
 * const tokyo = await findPrefectureByCode("13000");
 * console.log(tokyo?.prefName); // "東京都"
 *
 * // 存在しないコードの場合は null
 * const notFound = await findPrefectureByCode("99999");
 * console.log(notFound); // null
 * ```
 */
export async function findPrefectureByCode(
  prefCode: string
): Promise<Prefecture | null> {
  const prefectures = await fetchPrefectures();
  return prefectures.find((p) => p.prefCode === prefCode) || null;
}

/**
 * 都道府県コードから地域ブロックキーを取得
 *
 * 指定された都道府県コードに対応する地域ブロックコードを取得する。
 * 都道府県コードは2桁または5桁形式に対応している。
 * 対応する地域が見つからない場合は "unknown" を返す。
 *
 * @param {string} prefCode - 都道府県コード（2桁または5桁形式）
 * @returns {string} 地域ブロックコード（例: "kanto", "kinki"）。見つからない場合は "unknown"
 *
 * @example
 * ```ts
 * // 東京都（13）から関東地方のコードを取得
 * const region = getRegionKeyFromPrefectureCode("13000");
 * console.log(region); // "kanto"
 *
 * // 2桁コードでも動作
 * const region2 = getRegionKeyFromPrefectureCode("13");
 * console.log(region2); // "kanto"
 * ```
 */
export function getRegionKeyFromPrefectureCode(prefCode: string): string {
  const code = prefCode.substring(0, 2);
  return PREFECTURE_TO_REGION_MAP[code] || "unknown";
}

/**
 * 都道府県データから地域マッピングを生成
 *
 * 定義済みの地域ブロック定数（`REGIONS`）から、地域コードをキーとした
 * 都道府県コード配列のマップを生成する。
 *
 * @returns {Record<string, string[]>} 地域コード → 都道府県コード配列のマップ
 *
 * @example
 * ```ts
 * const mapping = buildRegionMapping();
 * console.log(mapping["kanto"]); // ["08000", "09000", ..., "14000"]
 * console.log(mapping["kinki"]); // ["24000", "25000", ..., "30000"]
 * ```
 */
export function buildRegionMapping(): Record<string, string[]> {
  const regionMap: Record<string, string[]> = {};

  // REGIONS定数から地域構造を構築
  REGIONS.forEach((region) => {
    regionMap[region.regionCode] = region.prefectures;
  });

  return regionMap;
}

/**
 * 地域ブロック一覧を取得
 *
 * 地域ブロックコードをキーとした都道府県コード配列のマップを取得する。
 * `buildRegionMapping()` を呼び出してマッピングを生成して返す。
 *
 * @returns {Promise<Record<string, string[]>>} 地域コード → 都道府県コード配列のマップ
 *
 * @example
 * ```ts
 * const regions = await listRegions();
 * console.log(regions["hokkaido"]); // ["01000"]
 * console.log(regions["tohoku"]); // ["02000", "03000", ..., "07000"]
 * ```
 */
export async function listRegions(): Promise<Record<string, string[]>> {
  return buildRegionMapping();
}
