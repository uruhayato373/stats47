/**
 * Prefecture Service
 * 都道府県に関するビジネスロジックを担当
 */

import { AreaRepository } from "../repositories/area-repository";
import { Prefecture } from "../types/index";

export class PrefectureService {
  /**
   * 全ての都道府県を取得
   */
  static async listPrefectures(): Promise<Prefecture[]> {
    return await AreaRepository.getPrefectures();
  }

  /**
   * 都道府県コードで検索
   */
  static async findPrefectureByCode(prefCode: string): Promise<Prefecture> {
    return await AreaRepository.getPrefectureByCode(prefCode);
  }

  /**
   * 都道府県名で検索
   */
  static async searchPrefectures(query: string): Promise<Prefecture[]> {
    const allPrefectures = await AreaRepository.getPrefectures();
    const lowerQuery = query.toLowerCase();

    return allPrefectures.filter((pref) =>
      pref.prefName.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * 地域ブロックで都道府県を取得
   */
  static async listPrefecturesByRegion(
    regionKey: string
  ): Promise<Prefecture[]> {
    const allPrefectures = await AreaRepository.getPrefectures();
    return allPrefectures.filter((pref) => pref.regionKey === regionKey);
  }

  /**
   * 地域ブロック一覧を取得
   */
  static async listRegions(): Promise<Record<string, string[]>> {
    return await AreaRepository.getRegions();
  }

  /**
   * 都道府県コードから都道府県名を取得
   */
  static async lookupPrefectureName(prefCode: string): Promise<string | null> {
    try {
      const prefecture = await this.findPrefectureByCode(prefCode);
      return prefecture.prefName;
    } catch {
      return null;
    }
  }
}
