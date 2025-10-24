/**
 * Area Service
 * 地域階層構造の管理とビジネスロジックを担当
 */

import {
  AreaCode,
  AreaHierarchy,
  AreaLevel,
  AreaSearchOptions,
  AreaSearchResult,
  AreaType,
  HierarchyPath,
} from "../types";
import { MunicipalityService } from "./municipality-service";
import { PrefectureService } from "./prefecture-service";

export class AreaService {
  /**
   * 地域階層構造を構築
   */
  static async getAreaHierarchy(areaCode: string): Promise<AreaHierarchy> {
    try {
      const code = new AreaCode(areaCode);
      const level = code.getLevel();

      let areaName: string;
      let areaType: AreaType;
      let parentCode: string | undefined;
      let children: string[] | undefined;

      if (level === "prefecture") {
        const prefecture = await PrefectureService.getPrefectureByCode(
          areaCode
        );
        areaName = prefecture.prefName;
        areaType = "prefecture";
        parentCode = "00000"; // 国コード
        children = await this.getMunicipalityCodesByPrefecture(areaCode);
      } else if (level === "municipality") {
        const municipality = await MunicipalityService.getMunicipalityByCode(
          areaCode
        );
        areaName = municipality.name;
        areaType = "municipality";
        parentCode = municipality.prefCode + "000"; // 都道府県コード
        children = await this.getChildMunicipalityCodes(areaCode);
      } else {
        // 国レベル
        areaName = "日本";
        areaType = "country";
        children = await this.getPrefectureCodes();
      }

      return {
        areaCode,
        areaName,
        areaType,
        areaLevel: level,
        parentCode,
        children,
      };
    } catch (error) {
      throw new Error(`Failed to get area hierarchy: ${areaCode}`);
    }
  }

  /**
   * 階層パス（ルートから指定地域までのパス）を取得
   */
  static async getHierarchyPath(areaCode: string): Promise<HierarchyPath[]> {
    try {
      const path: HierarchyPath[] = [];
      let currentCode = areaCode;

      // ルートから指定地域までのパスを構築
      while (currentCode !== "00000") {
        const hierarchy = await this.getAreaHierarchy(currentCode);

        path.unshift({
          areaCode: currentCode,
          areaName: hierarchy.areaName,
          level: hierarchy.areaLevel,
        });

        currentCode = hierarchy.parentCode || "00000";
      }

      // ルート（国）を追加
      path.unshift({
        areaCode: "00000",
        areaName: "日本",
        level: "country",
      });

      return path;
    } catch (error) {
      throw new Error(`Failed to get hierarchy path: ${areaCode}`);
    }
  }

  /**
   * 子要素を取得
   */
  static async getChildren(areaCode: string): Promise<AreaHierarchy[]> {
    try {
      const hierarchy = await this.getAreaHierarchy(areaCode);

      if (!hierarchy.children || hierarchy.children.length === 0) {
        return [];
      }

      const children: AreaHierarchy[] = [];
      for (const childCode of hierarchy.children) {
        const childHierarchy = await this.getAreaHierarchy(childCode);
        children.push(childHierarchy);
      }

      return children;
    } catch (error) {
      throw new Error(`Failed to get children: ${areaCode}`);
    }
  }

  /**
   * 親要素を取得
   */
  static async getParent(areaCode: string): Promise<AreaHierarchy | null> {
    try {
      const hierarchy = await this.getAreaHierarchy(areaCode);

      if (!hierarchy.parentCode) {
        return null;
      }

      return await this.getAreaHierarchy(hierarchy.parentCode);
    } catch (error) {
      throw new Error(`Failed to get parent: ${areaCode}`);
    }
  }

  /**
   * 地域検索
   */
  static async search(options: AreaSearchOptions): Promise<AreaSearchResult> {
    const startTime = Date.now();

    try {
      let items: AreaHierarchy[] = [];

      // レベル指定がある場合は該当レベルのみ検索
      if (options.level) {
        if (options.level === "prefecture") {
          const prefectures = await PrefectureService.getAllPrefectures();
          items = await Promise.all(
            prefectures.map((pref) =>
              this.getAreaHierarchy(pref.prefCode + "000")
            )
          );
        } else if (options.level === "municipality") {
          const municipalities =
            await MunicipalityService.getAllMunicipalities();
          items = await Promise.all(
            municipalities.map((muni) => this.getAreaHierarchy(muni.code))
          );
        }
      } else {
        // レベル指定がない場合は都道府県と市区町村の両方を検索
        const prefectures = await PrefectureService.getAllPrefectures();
        const municipalities = await MunicipalityService.getAllMunicipalities();

        const prefectureHierarchies = await Promise.all(
          prefectures.map((pref) =>
            this.getAreaHierarchy(pref.prefCode + "000")
          )
        );

        const municipalityHierarchies = await Promise.all(
          municipalities.map((muni) => this.getAreaHierarchy(muni.code))
        );

        items = [...prefectureHierarchies, ...municipalityHierarchies];
      }

      // 検索クエリでフィルタリング
      if (options.query) {
        const query = options.query.toLowerCase();
        items = items.filter((item) =>
          item.areaName.toLowerCase().includes(query)
        );
      }

      // タイプでフィルタリング
      if (options.type) {
        items = items.filter((item) => item.areaType === options.type);
      }

      // 件数制限
      if (options.limit && options.limit > 0) {
        items = items.slice(0, options.limit);
      }

      const searchTime = Date.now() - startTime;

      return {
        items: items as any, // 型の互換性のため
        total: items.length,
        query: options.query || "",
        searchTime,
      };
    } catch (error) {
      throw new Error(`Failed to search areas: ${error}`);
    }
  }

  /**
   * 地域の統計情報を取得
   */
  static async getStatistics(): Promise<{
    totalPrefectures: number;
    totalMunicipalities: number;
    byLevel: Record<AreaLevel, number>;
    byType: Record<AreaType, number>;
  }> {
    try {
      const prefectureStats = await PrefectureService.getStatistics();
      const municipalityStats = await MunicipalityService.getStatistics();

      const byLevel: Record<AreaLevel, number> = {
        country: 1,
        region: 8, // 地域ブロック数
        prefecture: prefectureStats.total,
        municipality: municipalityStats.total,
      };

      const byType: Record<AreaType, number> = {
        country: 1,
        prefecture: prefectureStats.total,
        municipality: municipalityStats.total,
      };

      return {
        totalPrefectures: prefectureStats.total,
        totalMunicipalities: municipalityStats.total,
        byLevel,
        byType,
      };
    } catch (error) {
      throw new Error(`Failed to get area statistics: ${error}`);
    }
  }

  // ============================================================================
  // プライベートメソッド
  // ============================================================================

  /**
   * 都道府県の市区町村コード一覧を取得
   */
  private static async getMunicipalityCodesByPrefecture(
    prefCode: string
  ): Promise<string[]> {
    try {
      const municipalities =
        await MunicipalityService.getMunicipalitiesByPrefecture(prefCode);
      return municipalities.map((muni) => muni.code);
    } catch (error) {
      return [];
    }
  }

  /**
   * 子市区町村コード一覧を取得（政令指定都市の区など）
   */
  private static async getChildMunicipalityCodes(
    parentCode: string
  ): Promise<string[]> {
    try {
      const municipalities = await MunicipalityService.getAllMunicipalities();
      return municipalities
        .filter((muni) => muni.parentCode === parentCode)
        .map((muni) => muni.code);
    } catch (error) {
      return [];
    }
  }

  /**
   * 都道府県コード一覧を取得
   */
  private static async getPrefectureCodes(): Promise<string[]> {
    try {
      const prefectures = await PrefectureService.getAllPrefectures();
      return prefectures.map((pref) => pref.prefCode + "000");
    } catch (error) {
      return [];
    }
  }
}
