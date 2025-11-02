/**
 * City Service
 *
 * 市区町村に関するビジネスロジックを担当するサービス層。
 * 市区町村データの取得、検索、統計情報の生成などの機能を提供する。
 *
 * ## 主な機能
 * - 市区町村一覧の取得（全件、都道府県別）
 * - 市区町村コード・名称による検索
 * - 市区町村名の逆引き（コード→名称）
 * - 市区町村の統計情報生成
 *
 * @module CityService
 */

import { fetchCities } from "../repositories/area-repository";
import { City } from "../types/index";

/**
 * 全ての市区町村を取得
 *
 * 全国の市区町村データを一覧で取得する。
 * リポジトリ層から取得したデータをそのまま返す。
 *
 * @returns {Promise<City[]>} 市区町村データの配列
 * @throws {Error} リポジトリ層でのデータ取得に失敗した場合
 *
 * @example
 * ```ts
 * const cities = await listMunicipalities();
 * console.log(`全国の市区町村数: ${cities.length}`);
 * ```
 */
export async function listMunicipalities(): Promise<City[]> {
  return await fetchCities();
}

/**
 * 特定の都道府県の市区町村を取得
 *
 * 指定された都道府県コードに該当する市区町村のみをフィルタリングして返す。
 *
 * @param {string} prefectureCode - 都道府県コード（2桁または5桁形式）
 * @returns {Promise<City[]>} 該当都道府県の市区町村データの配列
 * @throws {Error} リポジトリ層でのデータ取得に失敗した場合
 *
 * @example
 * ```ts
 * // 東京都（13）の市区町村を取得
 * const tokyoCities = await listMunicipalitiesByPrefecture("13000");
 * console.log(`東京都の市区町村数: ${tokyoCities.length}`);
 * ```
 */
export async function listMunicipalitiesByPrefecture(
  prefectureCode: string
): Promise<City[]> {
  const allCities = await fetchCities();
  return allCities.filter((city) => city.prefCode === prefectureCode);
}

/**
 * 市区町村コードで検索
 *
 * 指定された市区町村コードに一致する市区町村データを1件取得する。
 * 存在しない場合はエラーをスローする。
 *
 * @param {string} code - 市区町村コード（5桁形式）
 * @returns {Promise<City>} 市区町村データ
 * @throws {Error} 指定されたコードの市区町村が見つからない場合
 * @throws {Error} リポジトリ層でのデータ取得に失敗した場合
 *
 * @example
 * ```ts
 * // 渋谷区（13113）を取得
 * const shibuya = await findMunicipalityByCode("13113");
 * console.log(shibuya.cityName); // "渋谷区"
 * ```
 */
export async function findMunicipalityByCode(code: string): Promise<City> {
  const cities = await fetchCities();
  const city = cities.find((c) => c.cityCode === code);

  if (!city) {
    throw new Error(`City not found: ${code}`);
  }

  return city;
}

/**
 * 市区町村名で検索
 *
 * 市区町村名に指定された文字列が部分一致する市区町村を検索する。
 * 大文字小文字を区別せず、部分一致で検索を行う。
 *
 * @param {string} query - 検索クエリ（市区町村名の一部）
 * @returns {Promise<City[]>} 検索結果に一致する市区町村データの配列
 * @throws {Error} リポジトリ層でのデータ取得に失敗した場合
 *
 * @example
 * ```ts
 * // "市" を含む市区町村を検索
 * const cities = await searchMunicipalities("市");
 * console.log(`"市"を含む市区町村数: ${cities.length}`);
 * ```
 */
export async function searchMunicipalities(query: string): Promise<City[]> {
  const allMunicipalities = await fetchCities();
  const lowerQuery = query.toLowerCase();

  return allMunicipalities.filter((city) =>
    city.cityName.toLowerCase().includes(lowerQuery)
  );
}

/**
 * 特定の都道府県内で市区町村名を検索
 *
 * 指定された都道府県内の市区町村のみを対象に、市区町村名で部分一致検索を行う。
 * 大文字小文字を区別せず、部分一致で検索を行う。
 *
 * @param {string} prefectureCode - 都道府県コード（2桁または5桁形式）
 * @param {string} query - 検索クエリ（市区町村名の一部）
 * @returns {Promise<City[]>} 検索結果に一致する市区町村データの配列
 * @throws {Error} リポジトリ層でのデータ取得に失敗した場合
 *
 * @example
 * ```ts
 * // 東京都内で"区"を含む市区町村を検索
 * const wards = await searchMunicipalitiesInPrefecture("13000", "区");
 * console.log(`東京都内の"区": ${wards.length}件`);
 * ```
 */
export async function searchMunicipalitiesInPrefecture(
  prefectureCode: string,
  query: string
): Promise<City[]> {
  const municipalities = await listMunicipalitiesByPrefecture(prefectureCode);
  const lowerQuery = query.toLowerCase();

  return municipalities.filter((city) =>
    city.cityName.toLowerCase().includes(lowerQuery)
  );
}

/**
 * 市区町村コードから市区町村名を取得
 *
 * 指定された市区町村コードに対応する市区町村名を逆引きする。
 * コードが存在しない場合は `null` を返す（エラーをスローしない）。
 *
 * @param {string} code - 市区町村コード（5桁形式）
 * @returns {Promise<string | null>} 市区町村名。見つからない場合は `null`
 * @throws {Error} リポジトリ層でのデータ取得に失敗した場合
 *
 * @example
 * ```ts
 * // 渋谷区の名前を取得
 * const name = await lookupMunicipalityName("13113");
 * console.log(name); // "渋谷区"
 *
 * // 存在しないコードの場合は null
 * const notFound = await lookupMunicipalityName("99999");
 * console.log(notFound); // null
 * ```
 */
export async function lookupMunicipalityName(
  code: string
): Promise<string | null> {
  try {
    const city = await findMunicipalityByCode(code);
    return city.cityName;
  } catch {
    return null;
  }
}

/**
 * 市区町村の統計情報を構築
 *
 * 全国の市区町村データから統計情報を生成する。
 * 全件数と都道府県別の市区町村数を集計する。
 *
 * @returns {Promise<Object>} 統計情報オブジェクト
 * @returns {Promise<number>} total - 全国の市区町村総数
 * @returns {Promise<Record<string, number>>} byPrefecture - 都道府県コードをキーとした市区町村数のマップ
 * @throws {Error} リポジトリ層でのデータ取得に失敗した場合
 *
 * @example
 * ```ts
 * const stats = await buildMunicipalityStats();
 * console.log(`全国の市区町村数: ${stats.total}`);
 * console.log(`東京都の市区町村数: ${stats.byPrefecture["13000"]}`);
 * ```
 */
export async function buildMunicipalityStats(): Promise<{
  total: number;
  byPrefecture: Record<string, number>;
}> {
  const cities = await fetchCities();

  const stats = {
    total: cities.length,
    byPrefecture: {} as Record<string, number>,
  };

  cities.forEach((city) => {
    // 都道府県別カウント
    if (!stats.byPrefecture[city.prefCode]) {
      stats.byPrefecture[city.prefCode] = 0;
    }
    stats.byPrefecture[city.prefCode]++;
  });

  return stats;
}
