/**
 * Geoshapeドメイン - 外部APIデータソース
 * Geoshapeリポジトリ（https://geoshape.ex.nii.ac.jp）からデータを取得
 */

import { buildGeoshapeExternalUrl } from "../config/geoshape-config";
import type { TopoJSONTopology } from "../types";

/**
 * 外部APIデータソースクラス
 */
export class ExternalDataSource {
  /**
   * Geoshape外部APIからTopoJSONを取得
   * @returns TopoJSONトポロジー
   */
  static async fetch(): Promise<TopoJSONTopology> {
    const url = buildGeoshapeExternalUrl();

    try {
      console.log(`[ExternalDataSource] Fetching from: ${url}`);

      const response = await fetch(url, {
        headers: {
          "User-Agent": "stats47-app/1.0",
        },
        // タイムアウト設定（10秒）
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        throw new Error(
          `HTTP error! status: ${response.status} ${response.statusText}`
        );
      }

      const data = (await response.json()) as TopoJSONTopology;

      // データの妥当性チェック
      if (!data || data.type !== "Topology") {
        throw new Error("Invalid TopoJSON format from external API");
      }

      console.log("[ExternalDataSource] Successfully fetched data");
      return data as TopoJSONTopology;
    } catch (error) {
      console.error("[ExternalDataSource] Failed to fetch:", error);

      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("External API request timeout");
      }

      throw new Error(
        `External API fetch failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * 外部APIが利用可能かチェック
   * @returns 利用可能ならtrue
   */
  static async isAvailable(): Promise<boolean> {
    const url = buildGeoshapeExternalUrl();

    try {
      const response = await fetch(url, {
        method: "HEAD",
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
