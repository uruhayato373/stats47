/**
 * Area Repository
 * 地域データのアクセス層を担当
 * Mock環境ではローカルJSON、開発・本番環境ではR2ストレージからデータを取得
 */

import {
  AreaCodeNotFoundError,
  DataSourceError,
  MockMunicipality,
  MockPrefecturesData,
  Municipality,
  Prefecture,
} from "../types";

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
  private static municipalitiesCache: Map<string, Municipality[]> = new Map();
  private static regionsCache: Record<string, string[]> | null = null;

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
        const mockData = await import("@/data/mock/area/prefectures.json");
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

      // 地域ブロックキーを設定
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
   * 市区町村一覧を取得
   */
  static async getMunicipalities(): Promise<Municipality[]> {
    try {
      let data: { municipalities: MockMunicipality[] };

      if (USE_MOCK_DATA) {
        // Mock環境: ローカルJSONから読み込み
        const mockData = await import("@/data/mock/area/municipalities.json");
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

      // MockMunicipalityをMunicipalityに変換
      const municipalities: Municipality[] = data.municipalities.map((muni) => {
        const prefCode = muni["@parentCode"];
        const level = parseInt(muni["@level"], 10);

        return {
          code: muni["@code"],
          name: muni["@name"],
          fullName: `${muni["@name"]}`, // 完全名称は後で都道府県名と結合
          prefCode,
          parentCode: level > 1 ? prefCode : undefined,
          type: this.detectMunicipalityType(muni["@name"]),
          level,
        };
      });

      // 完全名称を設定（都道府県名を含む）
      const prefectures = await this.getPrefectures();
      const prefMap = new Map(prefectures.map((p) => [p.prefCode, p.prefName]));

      municipalities.forEach((muni) => {
        const prefName = prefMap.get(muni.prefCode);
        if (prefName) {
          muni.fullName = `${prefName}${muni.name}`;
        }
      });

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
    prefCode: string
  ): Promise<Municipality[]> {
    // キャッシュチェック
    if (this.municipalitiesCache.has(prefCode)) {
      return this.municipalitiesCache.get(prefCode)!;
    }

    const allMunicipalities = await this.getMunicipalities();
    const municipalities = allMunicipalities.filter(
      (muni) => muni.prefCode === prefCode
    );

    // キャッシュに保存
    this.municipalitiesCache.set(prefCode, municipalities);
    return municipalities;
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
        const mockData = await import("@/data/mock/area/prefectures.json");
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

      this.regionsCache = data.regions;
      return data.regions;
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
      throw new AreaCodeNotFoundError(prefCode);
    }

    return prefecture;
  }

  /**
   * 特定の地域コードで市区町村を検索
   */
  static async getMunicipalityByCode(code: string): Promise<Municipality> {
    const municipalities = await this.getMunicipalities();
    const municipality = municipalities.find((m) => m.code === code);

    if (!municipality) {
      throw new AreaCodeNotFoundError(code);
    }

    return municipality;
  }

  /**
   * キャッシュをクリア
   */
  static clearCache(): void {
    this.prefecturesCache = null;
    this.municipalitiesCache.clear();
    this.regionsCache = null;
  }

  /**
   * キャッシュ状態を取得
   */
  static getCacheStatus(): {
    prefectures: boolean;
    municipalities: number;
    regions: boolean;
  } {
    return {
      prefectures: this.prefecturesCache !== null,
      municipalities: this.municipalitiesCache.size,
      regions: this.regionsCache !== null,
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

  /**
   * 市区町村タイプを判定
   */
  private static detectMunicipalityType(
    name: string
  ): "city" | "ward" | "town" | "village" {
    if (name.includes("市")) return "city";
    if (name.includes("区")) return "ward";
    if (name.includes("町")) return "town";
    if (name.includes("村")) return "village";

    // デフォルトは市
    return "city";
  }
}
