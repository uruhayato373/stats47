/**
 * Geoshapeドメイン - Mockデータソース
 * ローカルのMockデータからTopoJSONを取得
 */

import { buildMockDataPath } from "../config/geoshape-config";

import type {
  AreaType,
  MunicipalityVersion,
  TopoJSONTopology,
} from "../types/index";

/**
 * Mockデータソースクラス
 */
export class MockDataSource {
  /**
   * MockデータからTopoJSONを取得
   * @param areaType 地域タイプ
   * @param prefCode 都道府県コード（2桁）- municipalityで必須
   * @param version 市区町村版タイプ
   * @returns TopoJSONトポロジー
   */
  static async fetch(
    areaType: AreaType = "prefecture",
    prefCode?: string,
    version: MunicipalityVersion = "merged"
  ): Promise<TopoJSONTopology> {
    const mockDataPath = buildMockDataPath(areaType, prefCode, version);

    try {
      const response = await fetch(mockDataPath);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch mock data: ${response.status} ${response.statusText}`
        );
      }

      const data = (await response.json()) as TopoJSONTopology;

      // データの妥当性チェック
      if (!data || data.type !== "Topology") {
        throw new Error("Invalid TopoJSON format in mock data");
      }

      console.log("[MockDataSource] Successfully loaded mock data");
      return data as TopoJSONTopology;
    } catch (error) {
      console.error("[MockDataSource] Failed to load mock data:", error);
      throw new Error(
        `Mock data fetch failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Mockデータが利用可能かチェック
   * @param areaType 地域タイプ
   * @param prefCode 都道府県コード（2桁）
   * @param version 市区町村版タイプ
   * @returns 利用可能ならtrue
   */
  static async isAvailable(
    areaType: AreaType = "prefecture",
    prefCode?: string,
    version: MunicipalityVersion = "merged"
  ): Promise<boolean> {
    const mockDataPath = buildMockDataPath(areaType, prefCode, version);

    try {
      const response = await fetch(mockDataPath, {
        method: "HEAD",
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
