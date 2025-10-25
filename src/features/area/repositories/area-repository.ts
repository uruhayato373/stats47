/**
 * Area Repository
 * 都道府県データのアクセス層を担当
 * Mock環境ではローカルJSON、開発・本番環境ではR2ストレージからデータを取得
 */

import {
  DataSourceError,
  MockMunicipalitiesData,
  MockPrefecturesData,
  Municipality,
  Prefecture,
} from "../types/index";

// ============================================================================
// 設定
// ============================================================================

const R2_BASE_URL = process.env.R2_AREA_DATA_URL || "";
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

// ============================================================================
// Area Repository
// ============================================================================

export class AreaRepository {
  // メモリキャッシュ
  private static prefecturesCache: Prefecture[] | null = null;
  private static regionsCache: Record<string, string[]> | null = null;
  private static municipalitiesCache: Municipality[] | null = null;

  /**
   * 都道府県一覧を取得
   */
  static async getPrefectures(): Promise<Prefecture[]> {
    if (this.prefecturesCache) {
      return this.prefecturesCache;
    }

    try {
      let data: MockPrefecturesData;

      if (USE_MOCK_DATA) {
        // Mock環境: ローカルJSONから読み込み
        const mockData = require("@/data/mock/area/prefectures.json");
        data = mockData.default || mockData;
      } else {
        // 開発・本番環境: R2ストレージから取得
        if (!R2_BASE_URL) {
          throw new Error("R2_AREA_DATA_URL is not configured");
        }

        const response = await fetch(`${R2_BASE_URL}/area/prefectures.json`);
        if (!response.ok) {
          throw new Error(`Failed to fetch prefectures: ${response.status}`);
        }
        data = await response.json();
      }

      const prefectures: Prefecture[] = data.prefectures.map((pref) => ({
        ...pref,
        regionKey: this.getRegionKeyFromPrefectureCode(pref.prefCode),
      }));

      this.prefecturesCache = prefectures;
      return prefectures;
    } catch (error) {
      const source = USE_MOCK_DATA ? "mock JSON" : "R2 storage";
      throw new DataSourceError(source, error as Error);
    }
  }

  /**
   * 地域ブロックマップを取得
   */
  static async getRegions(): Promise<Record<string, string[]>> {
    if (this.regionsCache) {
      return this.regionsCache;
    }

    try {
      let data: MockPrefecturesData;

      if (USE_MOCK_DATA) {
        const mockData = require("@/data/mock/area/prefectures.json");
        data = mockData.default || mockData;
      } else {
        if (!R2_BASE_URL) {
          throw new Error("R2_AREA_DATA_URL is not configured");
        }

        const response = await fetch(`${R2_BASE_URL}/area/prefectures.json`);
        if (!response.ok) {
          throw new Error(`Failed to fetch regions: ${response.status}`);
        }
        data = await response.json();
      }

      this.regionsCache = data.regions as unknown as Record<string, string[]>;
      return data.regions as unknown as Record<string, string[]>;
    } catch (error) {
      const source = USE_MOCK_DATA ? "mock JSON" : "R2 storage";
      throw new DataSourceError(source, error as Error);
    }
  }

  /**
   * 特定の地域コードで都道府県を検索
   */
  static async getPrefectureByCode(prefCode: string): Promise<Prefecture> {
    const prefectures = await this.getPrefectures();
    const prefecture = prefectures.find((p) => p.prefCode === prefCode);

    if (!prefecture) {
      throw new Error(`Prefecture not found: ${prefCode}`);
    }

    return prefecture;
  }

  /**
   * 市区町村一覧を取得
   */
  static async getMunicipalities(): Promise<Municipality[]> {
    if (this.municipalitiesCache) {
      return this.municipalitiesCache;
    }

    try {
      let data: MockMunicipalitiesData;

      if (USE_MOCK_DATA) {
        // Mock環境: ローカルJSONから読み込み
        const mockData = require("@/data/mock/area/municipalities.json");
        data = mockData.default || mockData;
      } else {
        // 開発・本番環境: R2ストレージから取得
        if (!R2_BASE_URL) {
          throw new Error("R2_AREA_DATA_URL is not configured");
        }

        const response = await fetch(`${R2_BASE_URL}/area/municipalities.json`);
        if (!response.ok) {
          throw new Error(`Failed to fetch municipalities: ${response.status}`);
        }
        data = await response.json();
      }

      const municipalities: Municipality[] = data.municipalities.map(
        (muni) => ({
          ...muni,
          prefectureName: this.getPrefectureNameByCode(muni.prefectureCode),
        })
      );

      this.municipalitiesCache = municipalities;
      return municipalities;
    } catch (error) {
      const source = USE_MOCK_DATA ? "mock JSON" : "R2 storage";
      throw new DataSourceError(source, error as Error);
    }
  }

  /**
   * 特定の都道府県の市区町村を取得
   */
  static async getMunicipalitiesByPrefecture(
    prefectureCode: string
  ): Promise<Municipality[]> {
    const allMunicipalities = await this.getMunicipalities();
    return allMunicipalities.filter(
      (muni) => muni.prefectureCode === prefectureCode
    );
  }

  /**
   * 特定の市区町村コードで市区町村を検索
   */
  static async getMunicipalityByCode(code: string): Promise<Municipality> {
    const municipalities = await this.getMunicipalities();
    const municipality = municipalities.find((m) => m.code === code);

    if (!municipality) {
      throw new Error(`Municipality not found: ${code}`);
    }

    return municipality;
  }

  /**
   * 都道府県コードから都道府県名を取得（内部用）
   */
  private static getPrefectureNameByCode(prefectureCode: string): string {
    // 都道府県データがキャッシュされている場合は使用
    if (this.prefecturesCache) {
      const prefecture = this.prefecturesCache.find(
        (p) => p.prefCode === prefectureCode
      );
      return prefecture?.prefName || "";
    }
    return "";
  }

  /**
   * キャッシュをクリア
   */
  static clearCache(): void {
    this.prefecturesCache = null;
    this.regionsCache = null;
    this.municipalitiesCache = null;
  }

  /**
   * キャッシュ状態を取得
   */
  static getCacheStatus(): {
    prefectures: boolean;
    regions: boolean;
    municipalities: boolean;
  } {
    return {
      prefectures: this.prefecturesCache !== null,
      regions: this.regionsCache !== null,
      municipalities: this.municipalitiesCache !== null,
    };
  }

  // ============================================================================
  // プライベートメソッド
  // ============================================================================

  /**
   * 都道府県コードから地域ブロックキーを取得
   */
  private static getRegionKeyFromPrefectureCode(prefCode: string): string {
    const regionMap: Record<string, string> = {
      "01": "hokkaido", // 北海道
      "02": "tohoku", // 青森
      "03": "tohoku", // 岩手
      "04": "tohoku", // 宮城
      "05": "tohoku", // 秋田
      "06": "tohoku", // 山形
      "07": "tohoku", // 福島
      "08": "kanto", // 茨城
      "09": "kanto", // 栃木
      "10": "kanto", // 群馬
      "11": "kanto", // 埼玉
      "12": "kanto", // 千葉
      "13": "kanto", // 東京
      "14": "kanto", // 神奈川
      "15": "chubu", // 新潟
      "16": "chubu", // 富山
      "17": "chubu", // 石川
      "18": "chubu", // 福井
      "19": "chubu", // 山梨
      "20": "chubu", // 長野
      "21": "chubu", // 岐阜
      "22": "chubu", // 静岡
      "23": "chubu", // 愛知
      "24": "kinki", // 三重
      "25": "kinki", // 滋賀
      "26": "kinki", // 京都
      "27": "kinki", // 大阪
      "28": "kinki", // 兵庫
      "29": "kinki", // 奈良
      "30": "kinki", // 和歌山
      "31": "chugoku", // 鳥取
      "32": "chugoku", // 島根
      "33": "chugoku", // 岡山
      "34": "chugoku", // 広島
      "35": "chugoku", // 山口
      "36": "shikoku", // 徳島
      "37": "shikoku", // 香川
      "38": "shikoku", // 愛媛
      "39": "shikoku", // 高知
      "40": "kyushu", // 福岡
      "41": "kyushu", // 佐賀
      "42": "kyushu", // 長崎
      "43": "kyushu", // 熊本
      "44": "kyushu", // 大分
      "45": "kyushu", // 宮崎
      "46": "kyushu", // 鹿児島
      "47": "kyushu", // 沖縄
    };

    return regionMap[prefCode] || "unknown";
  }
}
