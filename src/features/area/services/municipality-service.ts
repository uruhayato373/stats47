/**
 * Municipality Service
 * 市区町村に関するビジネスロジックを担当
 */

import { AreaRepository } from "../repositories/area-repository";
import {
  AreaCodeNotFoundError,
  AreaSearchResult,
  Municipality,
  MunicipalitySearchOptions,
  MunicipalityType,
} from "../types";

export class MunicipalityService {
  /**
   * 全ての市区町村を取得
   */
  static async getAllMunicipalities(): Promise<Municipality[]> {
    return await AreaRepository.getMunicipalities();
  }

  /**
   * 市区町村コードで検索
   */
  static async getMunicipalityByCode(code: string): Promise<Municipality> {
    try {
      return await AreaRepository.getMunicipalityByCode(code);
    } catch (error) {
      if (error instanceof AreaCodeNotFoundError) {
        throw error;
      }
      throw new Error(`Failed to get municipality by code: ${code}`);
    }
  }

  /**
   * 特定の都道府県の市区町村を取得
   */
  static async getMunicipalitiesByPrefecture(
    prefCode: string
  ): Promise<Municipality[]> {
    try {
      return await AreaRepository.getMunicipalitiesByPrefecture(prefCode);
    } catch (error) {
      throw new Error(
        `Failed to get municipalities by prefecture: ${prefCode}`
      );
    }
  }

  /**
   * 市区町村名で検索
   */
  static async search(
    options: MunicipalitySearchOptions
  ): Promise<AreaSearchResult> {
    const startTime = Date.now();

    try {
      let municipalities: Municipality[];

      // 都道府県指定がある場合はその都道府県の市区町村のみを取得
      if (options.prefCode) {
        municipalities = await this.getMunicipalitiesByPrefecture(
          options.prefCode
        );
      } else {
        municipalities = await this.getAllMunicipalities();
      }

      let filteredMunicipalities = municipalities;

      // 検索クエリでフィルタリング
      if (options.query) {
        const query = options.query.toLowerCase();
        filteredMunicipalities = filteredMunicipalities.filter(
          (muni) =>
            muni.name.toLowerCase().includes(query) ||
            muni.fullName.toLowerCase().includes(query)
        );
      }

      // 市区町村タイプでフィルタリング
      if (options.type) {
        filteredMunicipalities = filteredMunicipalities.filter(
          (muni) => muni.type === options.type
        );
      }

      // 階層レベルでフィルタリング
      if (options.level !== undefined) {
        filteredMunicipalities = filteredMunicipalities.filter(
          (muni) => muni.level === options.level
        );
      }

      // 件数制限
      if (options.limit && options.limit > 0) {
        filteredMunicipalities = filteredMunicipalities.slice(0, options.limit);
      }

      const searchTime = Date.now() - startTime;

      return {
        items: filteredMunicipalities,
        total: filteredMunicipalities.length,
        query: options.query || "",
        searchTime,
      };
    } catch (error) {
      throw new Error(`Failed to search municipalities: ${error}`);
    }
  }

  /**
   * 市区町村タイプ別に取得
   */
  static async getMunicipalitiesByType(
    type: MunicipalityType
  ): Promise<Municipality[]> {
    try {
      const allMunicipalities = await this.getAllMunicipalities();
      return allMunicipalities.filter((muni) => muni.type === type);
    } catch (error) {
      throw new Error(`Failed to get municipalities by type: ${type}`);
    }
  }

  /**
   * 階層レベル別に取得
   */
  static async getMunicipalitiesByLevel(
    level: number
  ): Promise<Municipality[]> {
    try {
      const allMunicipalities = await this.getAllMunicipalities();
      return allMunicipalities.filter((muni) => muni.level === level);
    } catch (error) {
      throw new Error(`Failed to get municipalities by level: ${level}`);
    }
  }

  /**
   * 市区町村の存在チェック
   */
  static async exists(code: string): Promise<boolean> {
    try {
      await this.getMunicipalityByCode(code);
      return true;
    } catch (error) {
      if (error instanceof AreaCodeNotFoundError) {
        return false;
      }
      throw error;
    }
  }

  /**
   * 市区町村の統計情報を取得
   */
  static async getStatistics(): Promise<{
    total: number;
    byType: Record<MunicipalityType, number>;
    byLevel: Record<number, number>;
    byPrefecture: Record<string, number>;
  }> {
    try {
      const municipalities = await this.getAllMunicipalities();

      const byType: Record<MunicipalityType, number> = {
        city: 0,
        ward: 0,
        town: 0,
        village: 0,
      };

      const byLevel: Record<number, number> = {};
      const byPrefecture: Record<string, number> = {};

      municipalities.forEach((muni) => {
        // タイプ別集計
        byType[muni.type]++;

        // レベル別集計
        byLevel[muni.level] = (byLevel[muni.level] || 0) + 1;

        // 都道府県別集計
        byPrefecture[muni.prefCode] = (byPrefecture[muni.prefCode] || 0) + 1;
      });

      return {
        total: municipalities.length,
        byType,
        byLevel,
        byPrefecture,
      };
    } catch (error) {
      throw new Error(`Failed to get municipality statistics: ${error}`);
    }
  }

  /**
   * 特定の都道府県の市区町村統計を取得
   */
  static async getPrefectureStatistics(prefCode: string): Promise<{
    total: number;
    byType: Record<MunicipalityType, number>;
    byLevel: Record<number, number>;
  }> {
    try {
      const municipalities = await this.getMunicipalitiesByPrefecture(prefCode);

      const byType: Record<MunicipalityType, number> = {
        city: 0,
        ward: 0,
        town: 0,
        village: 0,
      };

      const byLevel: Record<number, number> = {};

      municipalities.forEach((muni) => {
        byType[muni.type]++;
        byLevel[muni.level] = (byLevel[muni.level] || 0) + 1;
      });

      return {
        total: municipalities.length,
        byType,
        byLevel,
      };
    } catch (error) {
      throw new Error(
        `Failed to get prefecture municipality statistics: ${prefCode}`
      );
    }
  }

  /**
   * 政令指定都市の区を取得
   */
  static async getWardsByCity(cityCode: string): Promise<Municipality[]> {
    try {
      const allMunicipalities = await this.getAllMunicipalities();
      return allMunicipalities.filter(
        (muni) => muni.type === "ward" && muni.parentCode === cityCode
      );
    } catch (error) {
      throw new Error(`Failed to get wards by city: ${cityCode}`);
    }
  }
}
