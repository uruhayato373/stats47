/**
 * Geoshapeドメイン - メインリポジトリ
 * データソースの抽象化とフォールバック戦略
 */

import { isMockEnvironment } from "../config/geoshape-config";
import type {
  FetchOptions,
  FetchResult,
  TopoJSONTopology,
} from "../types/index";
import { ExternalDataSource } from "./external-data-source";
import { MockDataSource } from "./mock-data-source";
import { R2DataSource } from "./r2-data-source";

/**
 * Geoshapeリポジトリクラス
 * 3段階フォールバック戦略でデータを取得
 */
export class GeoshapeRepository {
  private static memoryCache = new Map<string, TopoJSONTopology>();
  private static cacheTimestamps = new Map<string, number>();

  /**
   * 都道府県TopoJSONデータを取得
   * フォールバック順序: メモリキャッシュ → Mock → R2 → 外部API
   */
  static async getPrefectureTopology(
    options: FetchOptions = {}
  ): Promise<FetchResult<TopoJSONTopology>> {
    const { useCache = true, forceRefresh = false } = options;

    const cacheKey = "prefecture_low";

    // 1. メモリキャッシュチェック
    if (useCache && !forceRefresh) {
      const cached = this.getFromMemoryCache(cacheKey);
      if (cached) {
        console.log(`[GeoshapeRepository] Memory cache hit: ${cacheKey}`);
        return {
          data: cached,
          source: "mock",
          cached: true,
          fetchedAt: new Date(this.cacheTimestamps.get(cacheKey) || Date.now()),
        };
      }
    }

    // 2. Mockデータを優先（開発環境では常にMockを使用）
    try {
      console.log("[GeoshapeRepository] Loading from mock data");
      const data = await MockDataSource.fetch();
      this.setMemoryCache(cacheKey, data);

      return {
        data,
        source: "mock",
        cached: false,
        fetchedAt: new Date(),
      };
    } catch (error) {
      console.warn("[GeoshapeRepository] Mock data fetch failed:", error);
      // Mock失敗時は次のソースにフォールバック
    }

    // 3. R2ストレージから取得
    try {
      console.log("[GeoshapeRepository] Loading from R2 storage");
      const data = await R2DataSource.fetch();

      if (data) {
        this.setMemoryCache(cacheKey, data);

        return {
          data,
          source: "r2",
          cached: false,
          fetchedAt: new Date(),
        };
      }
    } catch (error) {
      console.warn("[GeoshapeRepository] R2 fetch failed:", error);
      // R2失敗時は次のソースにフォールバック
    }

    // 4. 外部APIから取得
    try {
      console.log("[GeoshapeRepository] Loading from external API");
      const data = await ExternalDataSource.fetch();

      // 取得後、R2に非同期保存（バックグラウンド）
      R2DataSource.save(data).catch((error) => {
        console.warn("[GeoshapeRepository] R2 save failed:", error);
      });

      this.setMemoryCache(cacheKey, data);

      return {
        data,
        source: "external",
        cached: false,
        fetchedAt: new Date(),
      };
    } catch (error) {
      console.error("[GeoshapeRepository] All data sources failed:", error);
      throw new Error(
        `Failed to fetch prefecture topology data: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * メモリキャッシュから取得
   */
  private static getFromMemoryCache(key: string): TopoJSONTopology | null {
    const data = this.memoryCache.get(key);
    const timestamp = this.cacheTimestamps.get(key);

    if (!data || !timestamp) {
      return null;
    }

    // キャッシュ有効期限チェック（24時間）
    const now = Date.now();
    const cacheAge = now - timestamp;
    const maxAge = 24 * 60 * 60 * 1000; // 24時間

    if (cacheAge > maxAge) {
      this.memoryCache.delete(key);
      this.cacheTimestamps.delete(key);
      return null;
    }

    return data;
  }

  /**
   * メモリキャッシュに保存
   */
  private static setMemoryCache(key: string, data: TopoJSONTopology): void {
    this.memoryCache.set(key, data);
    this.cacheTimestamps.set(key, Date.now());
  }

  /**
   * メモリキャッシュをクリア
   */
  static clearMemoryCache(): void {
    this.memoryCache.clear();
    this.cacheTimestamps.clear();
    console.log("[GeoshapeRepository] Memory cache cleared");
  }

  /**
   * キャッシュステータスを取得
   */
  static getCacheStatus(): {
    memoryCache: number;
    r2Available: boolean;
    externalAvailable: boolean;
  } {
    return {
      memoryCache: this.memoryCache.size,
      r2Available: false, // 非同期チェックが必要
      externalAvailable: false, // 非同期チェックが必要
    };
  }

  /**
   * データソースの可用性をチェック
   */
  static async checkDataSources(): Promise<{
    mock: boolean;
    r2: boolean;
    external: boolean;
  }> {
    const [r2Available, externalAvailable] = await Promise.allSettled([
      R2DataSource.isAvailable(),
      ExternalDataSource.isAvailable(),
    ]);

    return {
      mock: isMockEnvironment(),
      r2: r2Available.status === "fulfilled" && r2Available.value,
      external:
        externalAvailable.status === "fulfilled" && externalAvailable.value,
    };
  }
}
