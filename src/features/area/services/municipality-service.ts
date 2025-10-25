/**
 * Municipality Service
 * 市区町村に関するビジネスロジックを担当
 */

import { AreaRepository } from "../repositories/area-repository";
import { Municipality, MunicipalityType } from "../types";

export class MunicipalityService {
  /**
   * 全ての市区町村を取得
   */
  static async listMunicipalities(): Promise<Municipality[]> {
    return await AreaRepository.getMunicipalities();
  }

  /**
   * 特定の都道府県の市区町村を取得
   */
  static async listMunicipalitiesByPrefecture(
    prefectureCode: string
  ): Promise<Municipality[]> {
    return await AreaRepository.getMunicipalitiesByPrefecture(prefectureCode);
  }

  /**
   * 市区町村コードで検索
   */
  static async findMunicipalityByCode(code: string): Promise<Municipality> {
    return await AreaRepository.getMunicipalityByCode(code);
  }

  /**
   * 市区町村名で検索
   */
  static async searchMunicipalities(query: string): Promise<Municipality[]> {
    const allMunicipalities = await AreaRepository.getMunicipalities();
    const lowerQuery = query.toLowerCase();

    return allMunicipalities.filter((muni) =>
      muni.name.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * 特定の都道府県内で市区町村名を検索
   */
  static async searchMunicipalitiesInPrefecture(
    prefectureCode: string,
    query: string
  ): Promise<Municipality[]> {
    const municipalities = await this.listMunicipalitiesByPrefecture(
      prefectureCode
    );
    const lowerQuery = query.toLowerCase();

    return municipalities.filter((muni) =>
      muni.name.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * 市区町村タイプ別にフィルタリング
   */
  static async getMunicipalitiesByType(
    type: MunicipalityType
  ): Promise<Municipality[]> {
    const allMunicipalities = await AreaRepository.getMunicipalities();
    return allMunicipalities.filter((muni) => muni.type === type);
  }

  /**
   * 特定の都道府県内で市区町村タイプ別にフィルタリング
   */
  static async getMunicipalitiesByTypeInPrefecture(
    prefectureCode: string,
    type: MunicipalityType
  ): Promise<Municipality[]> {
    const municipalities = await this.listMunicipalitiesByPrefecture(
      prefectureCode
    );
    return municipalities.filter((muni) => muni.type === type);
  }

  /**
   * 市区町村コードから市区町村名を取得
   */
  static async lookupMunicipalityName(code: string): Promise<string | null> {
    try {
      const municipality = await this.findMunicipalityByCode(code);
      return municipality.name;
    } catch {
      return null;
    }
  }

  /**
   * 市区町村の統計情報を取得
   */
  static async getMunicipalityStats(): Promise<{
    total: number;
    byType: Record<MunicipalityType, number>;
    byPrefecture: Record<string, number>;
  }> {
    const municipalities = await this.listMunicipalities();

    const stats = {
      total: municipalities.length,
      byType: {
        city: 0,
        ward: 0,
        town: 0,
        village: 0,
      } as Record<MunicipalityType, number>,
      byPrefecture: {} as Record<string, number>,
    };

    municipalities.forEach((muni) => {
      // タイプ別カウント
      stats.byType[muni.type]++;

      // 都道府県別カウント
      if (!stats.byPrefecture[muni.prefectureCode]) {
        stats.byPrefecture[muni.prefectureCode] = 0;
      }
      stats.byPrefecture[muni.prefectureCode]++;
    });

    return stats;
  }
}
