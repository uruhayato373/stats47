/**
 * Prefecture Service
 * 都道府県に関するビジネスロジックを担当
 */

import { AreaRepository } from "../repositories/area-repository";
import {
  AreaCodeNotFoundError,
  AreaSearchResult,
  Prefecture,
  PrefectureSearchOptions,
} from "../types";

export class PrefectureService {
  /**
   * 全ての都道府県を取得
   */
  static async getAllPrefectures(): Promise<Prefecture[]> {
    return await AreaRepository.getPrefectures();
  }

  /**
   * 都道府県コードで検索
   */
  static async getPrefectureByCode(prefCode: string): Promise<Prefecture> {
    try {
      return await AreaRepository.getPrefectureByCode(prefCode);
    } catch (error) {
      if (error instanceof AreaCodeNotFoundError) {
        throw error;
      }
      throw new Error(`Failed to get prefecture by code: ${prefCode}`);
    }
  }

  /**
   * 都道府県名で検索
   */
  static async search(
    options: PrefectureSearchOptions
  ): Promise<AreaSearchResult> {
    const startTime = Date.now();

    try {
      const allPrefectures = await AreaRepository.getPrefectures();
      let filteredPrefectures = allPrefectures;

      // 検索クエリでフィルタリング
      if (options.query) {
        const query = options.query.toLowerCase();
        filteredPrefectures = filteredPrefectures.filter((pref) =>
          pref.prefName.toLowerCase().includes(query)
        );
      }

      // 地域ブロックでフィルタリング
      if (options.regionKey) {
        filteredPrefectures = filteredPrefectures.filter(
          (pref) => pref.regionKey === options.regionKey
        );
      }

      // 件数制限
      if (options.limit && options.limit > 0) {
        filteredPrefectures = filteredPrefectures.slice(0, options.limit);
      }

      const searchTime = Date.now() - startTime;

      return {
        items: filteredPrefectures,
        total: filteredPrefectures.length,
        query: options.query || "",
        searchTime,
      };
    } catch (error) {
      throw new Error(`Failed to search prefectures: ${error}`);
    }
  }

  /**
   * 地域ブロック別に都道府県を取得
   */
  static async getPrefecturesByRegion(
    regionKey: string
  ): Promise<Prefecture[]> {
    try {
      const allPrefectures = await AreaRepository.getPrefectures();
      return allPrefectures.filter((pref) => pref.regionKey === regionKey);
    } catch (error) {
      throw new Error(`Failed to get prefectures by region: ${regionKey}`);
    }
  }

  /**
   * 地域ブロック一覧を取得
   */
  static async getRegions(): Promise<Record<string, string[]>> {
    try {
      return await AreaRepository.getRegions();
    } catch (error) {
      throw new Error(`Failed to get regions`);
    }
  }

  /**
   * 都道府県の存在チェック
   */
  static async exists(prefCode: string): Promise<boolean> {
    try {
      await this.getPrefectureByCode(prefCode);
      return true;
    } catch (error) {
      if (error instanceof AreaCodeNotFoundError) {
        return false;
      }
      throw error;
    }
  }

  /**
   * 都道府県の統計情報を取得
   */
  static async getStatistics(): Promise<{
    total: number;
    byRegion: Record<string, number>;
  }> {
    try {
      const prefectures = await this.getAllPrefectures();
      const regions = await this.getRegions();

      const byRegion: Record<string, number> = {};
      Object.keys(regions).forEach((regionKey) => {
        byRegion[regionKey] = prefectures.filter(
          (pref) => pref.regionKey === regionKey
        ).length;
      });

      return {
        total: prefectures.length,
        byRegion,
      };
    } catch (error) {
      throw new Error(`Failed to get prefecture statistics: ${error}`);
    }
  }
}
