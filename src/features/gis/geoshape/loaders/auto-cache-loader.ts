/**
 * GeoShapeデータ自動キャッシングローダー
 *
 * 動作フロー:
 * 1. R2ストレージをチェック
 * 2. R2に存在すれば即座に返却（高速）
 * 3. R2に不在なら外部URLから取得
 * 4. 取得したデータをバックグラウンドでR2に保存
 * 5. 次回以降はR2から高速配信
 */

import { GEOSHAPE_CONFIG } from "../config/geoshape-config";
import {
  convertTopoJsonToGeoJson,
  validateTopoJson,
} from "../utils/topojson-converter";

import type { GeoShapeDataLevel, PrewarmResult } from "../types/index";

export class AutoCacheGeoShapeLoader {
  private static memoryCache = new Map<string, any>();
  private static loadingPromises = new Map<string, Promise<any>>();

  /**
   * 自動キャッシング付きデータロード
   *
   * @param level - データレベル（municipality | municipality_merged）
   * @param prefectureCode - 都道府県コード（01-47）
   * @returns GeoJSON.FeatureCollection
   */
  static async loadWithAutoCache(
    level: GeoShapeDataLevel,
    prefectureCode: string
  ): Promise<GeoJSON.FeatureCollection> {
    const cacheKey = this.getCacheKey(level, prefectureCode);

    // メモリキャッシュチェック
    if (this.memoryCache.has(cacheKey)) {
      console.log(`[AutoCache] Memory hit: ${cacheKey}`);
      return this.memoryCache.get(cacheKey);
    }

    // 同時リクエスト防止（デデュープ）
    if (this.loadingPromises.has(cacheKey)) {
      console.log(`[AutoCache] Dedup: ${cacheKey}`);
      return this.loadingPromises.get(cacheKey)!;
    }

    // ロード処理
    const loadPromise = this.executeLoad(level, prefectureCode);
    this.loadingPromises.set(cacheKey, loadPromise);

    try {
      const data = await loadPromise;
      this.memoryCache.set(cacheKey, data);
      return data;
    } finally {
      this.loadingPromises.delete(cacheKey);
    }
  }

  /**
   * 実際のロード処理（3段階フォールバック）
   */
  private static async executeLoad(
    level: GeoShapeDataLevel,
    prefectureCode: string
  ): Promise<GeoJSON.FeatureCollection> {
    const cacheKey = this.getCacheKey(level, prefectureCode);
    const startTime = performance.now();

    // Stage 1: R2ストレージから取得
    try {
      console.log(`[AutoCache] Checking R2: ${cacheKey}`);
      const r2Data = await this.loadFromR2(level, prefectureCode);

      if (r2Data) {
        const loadTime = performance.now() - startTime;
        console.log(
          `[AutoCache] ✓ R2 hit: ${cacheKey} (${loadTime.toFixed(2)}ms)`
        );
        return r2Data;
      }
    } catch (error) {
      console.log(`[AutoCache] R2 miss: ${cacheKey}`, error);
    }

    // Stage 2: 外部URLから取得
    console.log(`[AutoCache] Fetching external: ${cacheKey}`);
    const externalData = await this.loadFromExternal(level, prefectureCode);
    const loadTime = performance.now() - startTime;
    console.log(
      `[AutoCache] ✓ External loaded: ${cacheKey} (${loadTime.toFixed(2)}ms)`
    );

    // Stage 3: R2に非同期保存（ユーザーを待たせない）
    this.saveToR2InBackground(cacheKey, externalData)
      .then(() => console.log(`[AutoCache] ✓ Saved to R2: ${cacheKey}`))
      .catch((err) =>
        console.error(`[AutoCache] Save error: ${cacheKey}`, err)
      );

    return externalData;
  }

  /**
   * R2ストレージから取得
   */
  private static async loadFromR2(
    level: GeoShapeDataLevel,
    prefectureCode: string
  ): Promise<GeoJSON.FeatureCollection | null> {
    const fileName = this.getFileName(level, prefectureCode);
    const url = `${GEOSHAPE_CONFIG.r2.baseUrl}/${fileName}`;

    try {
      const response = await fetch(url, {
        // 長期キャッシュ（データは不変）
        next: { revalidate: GEOSHAPE_CONFIG.cache.cdnTTL },
        cache: "force-cache",
        signal: AbortSignal.timeout(GEOSHAPE_CONFIG.cache.timeout),
      });

      if (!response.ok) {
        return null;
      }

      const topoJson = await response.json();

      // TopoJSONの検証
      const validation = validateTopoJson(topoJson);
      if (!validation.isValid) {
        console.warn(`[R2] Invalid TopoJSON: ${validation.errors.join(", ")}`);
        return null;
      }

      return this.convertToGeoJson(topoJson);
    } catch (error) {
      console.warn("[R2] Load failed:", error);
      return null;
    }
  }

  /**
   * 外部URLから取得
   */
  private static async loadFromExternal(
    level: GeoShapeDataLevel,
    prefectureCode: string
  ): Promise<GeoJSON.FeatureCollection> {
    const fileName = this.getExternalFileName(level, prefectureCode);
    const url = `${GEOSHAPE_CONFIG.fallback.baseUrl}/${fileName}`;

    const response = await fetch(url, {
      signal: AbortSignal.timeout(GEOSHAPE_CONFIG.cache.timeout),
    });

    if (!response.ok) {
      throw new Error(
        `External fetch failed: ${response.status} ${response.statusText}`
      );
    }

    const topoJson = await response.json();

    // TopoJSONの検証
    const validation = validateTopoJson(topoJson);
    if (!validation.isValid) {
      throw new Error(
        `Invalid TopoJSON from external: ${validation.errors.join(", ")}`
      );
    }

    return this.convertToGeoJson(topoJson);
  }

  /**
   * R2にバックグラウンドで保存
   * ユーザーのレスポンスを待たせないため非同期実行
   */
  private static async saveToR2InBackground(
    cacheKey: string,
    data: GeoJSON.FeatureCollection
  ): Promise<void> {
    try {
      const response = await fetch("/api/area/geoshape/auto-cache", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: cacheKey,
          data,
          metadata: {
            cachedAt: new Date().toISOString(),
            source: "external",
            version: GEOSHAPE_CONFIG.version,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`R2 save failed: ${response.statusText}`);
      }

      const result = (await response.json()) as { size: number };
      console.log(`[AutoCache] Saved ${result.size} bytes to R2`);
    } catch (error) {
      // エラーでもユーザー体験に影響しないため、ログのみ
      console.error("[AutoCache] Background save error:", error);
    }
  }

  /**
   * プリウォーム: 全都道府県データを一括キャッシュ
   *
   * デプロイ後やメンテナンス時に実行して、
   * R2キャッシュを事前に温めておく
   */
  static async prewarmCache(
    level: GeoShapeDataLevel = "municipality"
  ): Promise<PrewarmResult> {
    const results: PrewarmResult = {
      success: 0,
      failed: 0,
      skipped: 0,
      errors: [],
    };

    console.log(`[Prewarm] Starting: ${level}`);

    for (let i = 1; i <= 47; i++) {
      const prefCode = i.toString().padStart(2, "0");
      const cacheKey = this.getCacheKey(level, prefCode);

      try {
        // R2に既に存在するかチェック
        const exists = await this.checkR2Exists(level, prefCode);

        if (exists) {
          console.log(`[Prewarm] Skip ${prefCode}: already exists`);
          results.skipped++;
          continue;
        }

        // 外部URLから取得してR2に保存
        console.log(`[Prewarm] Loading ${prefCode}...`);
        await this.loadWithAutoCache(level, prefCode);
        results.success++;

        // レート制限対策（500ms待機）
        await this.sleep(500);
      } catch (error) {
        console.error(`[Prewarm] Failed ${prefCode}:`, error);
        results.failed++;
        results.errors.push({
          prefectureCode: prefCode,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    console.log("[Prewarm] Complete:", results);
    return results;
  }

  /**
   * R2にデータが存在するかチェック
   */
  private static async checkR2Exists(
    level: GeoShapeDataLevel,
    prefectureCode: string
  ): Promise<boolean> {
    const fileName = this.getFileName(level, prefectureCode);
    const url = `${GEOSHAPE_CONFIG.r2.baseUrl}/${fileName}`;

    try {
      const response = await fetch(url, { method: "HEAD" });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * キャッシュキー生成
   */
  private static getCacheKey(
    level: GeoShapeDataLevel,
    prefectureCode: string
  ): string {
    return `${level}/${prefectureCode}`;
  }

  /**
   * ファイル名生成（R2用）
   */
  private static getFileName(
    level: GeoShapeDataLevel,
    prefectureCode: string
  ): string {
    return level === "municipality"
      ? `municipalities/${prefectureCode}_city.topojson`
      : `municipalities-merged/${prefectureCode}_city_dc.topojson`;
  }

  /**
   * ファイル名生成（外部URL用）
   */
  private static getExternalFileName(
    level: GeoShapeDataLevel,
    prefectureCode: string
  ): string {
    return level === "municipality"
      ? `${prefectureCode}_city.topojson`
      : `${prefectureCode}_city_dc.topojson`;
  }

  /**
   * TopoJSONをGeoJSONに変換
   */
  private static convertToGeoJson(topoJson: any): GeoJSON.FeatureCollection {
    return convertTopoJsonToGeoJson(topoJson);
  }

  private static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
