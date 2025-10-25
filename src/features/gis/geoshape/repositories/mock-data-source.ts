/**
 * Geoshapeドメイン - Mockデータソース
 * ローカルのMockデータからTopoJSONを取得
 */

import type { TopoJSONTopology } from "../types";
import { geoshapeConfig } from "../config/geoshape-config";

/**
 * MockデータソースクラS
 */
export class MockDataSource {
  /**
   * MockデータからTopoJSONを取得
   * @returns TopoJSONトポロジー
   */
  static async fetch(): Promise<TopoJSONTopology> {
    try {
      const response = await fetch(geoshapeConfig.mockDataPath);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch mock data: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      // データの妥当性チェック
      if (!data || data.type !== "Topology") {
        throw new Error("Invalid TopoJSON format in mock data");
      }

      console.log("[MockDataSource] Successfully loaded mock data");
      return data as TopoJSONTopology;
    } catch (error) {
      console.error("[MockDataSource] Failed to load mock data:", error);
      throw new Error(
        `Mock data fetch failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Mockデータが利用可能かチェック
   * @returns 利用可能ならtrue
   */
  static async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(geoshapeConfig.mockDataPath, {
        method: "HEAD",
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

