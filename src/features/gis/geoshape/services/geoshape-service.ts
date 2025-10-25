/**
 * Geoshapeドメイン - メインサービス
 * ビジネスロジックとデータ変換
 */

import { GeoshapeRepository } from "../repositories/geoshape-repository";
import { TopojsonConverter } from "../utils/topojson-converter";
import type {
  FetchOptions,
  PrefectureFeature,
  PrefectureFeatureCollection,
} from "../types/index";

/**
 * Geoshapeサービスクラス
 * 地理データの取得と変換を提供
 */
export class GeoshapeService {
  /**
   * 都道府県のGeoJSON FeatureCollectionを取得
   * @param options 取得オプション
   * @returns GeoJSON FeatureCollection
   */
  static async getPrefectureFeatures(
    options: FetchOptions = {}
  ): Promise<PrefectureFeatureCollection> {
    try {
      console.log("[GeoshapeService] Fetching prefecture features...");

      // TopoJSONを取得
      const result = await GeoshapeRepository.getPrefectureTopology(options);

      // TopoJSONをGeoJSONに変換
      const geojson = TopojsonConverter.toGeoJSON(result.data);

      console.log(
        `[GeoshapeService] Successfully converted to GeoJSON (${geojson.features.length} features)`
      );

      return geojson as PrefectureFeatureCollection;
    } catch (error) {
      console.error(
        "[GeoshapeService] Failed to get prefecture features:",
        error
      );
      throw new Error(
        `Failed to get prefecture features: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * 特定の都道府県のFeatureを取得
   * @param prefCode 都道府県コード
   * @param options 取得オプション
   * @returns 都道府県Feature、見つからない場合はnull
   */
  static async getPrefectureFeature(
    prefCode: string,
    options: FetchOptions = {}
  ): Promise<PrefectureFeature | null> {
    try {
      const features = await this.getPrefectureFeatures(options);
      return (
        features.features.find((f) => f.properties.prefCode === prefCode) ||
        null
      );
    } catch (error) {
      console.error(
        `[GeoshapeService] Failed to get prefecture feature for ${prefCode}:`,
        error
      );
      return null;
    }
  }

  /**
   * 都道府県コードのリストを取得
   * @param options 取得オプション
   * @returns 都道府県コードの配列
   */
  static async getPrefectureCodes(
    options: FetchOptions = {}
  ): Promise<string[]> {
    try {
      const features = await this.getPrefectureFeatures(options);
      return features.features.map((f) => f.properties.prefCode);
    } catch (error) {
      console.error("[GeoshapeService] Failed to get prefecture codes:", error);
      return [];
    }
  }

  /**
   * 都道府県名のリストを取得
   * @param options 取得オプション
   * @returns 都道府県名の配列
   */
  static async getPrefectureNames(
    options: FetchOptions = {}
  ): Promise<string[]> {
    try {
      const features = await this.getPrefectureFeatures(options);
      return features.features.map((f) => f.properties.prefName);
    } catch (error) {
      console.error("[GeoshapeService] Failed to get prefecture names:", error);
      return [];
    }
  }

  /**
   * 都道府県コードと名前のマッピングを取得
   * @param options 取得オプション
   * @returns 都道府県コードと名前のマッピング
   */
  static async getPrefectureMapping(
    options: FetchOptions = {}
  ): Promise<Record<string, string>> {
    try {
      const features = await this.getPrefectureFeatures(options);
      const mapping: Record<string, string> = {};

      features.features.forEach((f) => {
        mapping[f.properties.prefCode] = f.properties.prefName;
      });

      return mapping;
    } catch (error) {
      console.error(
        "[GeoshapeService] Failed to get prefecture mapping:",
        error
      );
      return {};
    }
  }

  /**
   * データソースの可用性をチェック
   * @returns 各データソースの可用性
   */
  static async checkDataSources(): Promise<{
    mock: boolean;
    r2: boolean;
    external: boolean;
  }> {
    return GeoshapeRepository.checkDataSources();
  }

  /**
   * キャッシュをクリア
   */
  static clearCache(): void {
    GeoshapeRepository.clearMemoryCache();
  }

  /**
   * キャッシュステータスを取得
   * @returns キャッシュステータス
   */
  static getCacheStatus(): {
    memoryCache: number;
    r2Available: boolean;
    externalAvailable: boolean;
  } {
    return GeoshapeRepository.getCacheStatus();
  }
}
