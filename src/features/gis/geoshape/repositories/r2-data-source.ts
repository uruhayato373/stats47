/**
 * Geoshapeドメイン - R2ストレージデータソース
 * Cloudflare R2ストレージからTopoJSONを取得・保存
 */

import { buildR2Key, geoshapeConfig } from "../config/geoshape-config";
import type {
  AreaType,
  MunicipalityVersion,
  TopoJSONTopology,
} from "../types/index";

/**
 * R2ストレージからTopoJSONを取得
 * @param areaType 地域タイプ
 * @param prefCode 都道府県コード（2桁）- municipalityで必須
 * @param version 市区町村版タイプ
 * @returns TopoJSONトポロジー、存在しない場合はnull
 */
export async function fetchFromR2(
  areaType: AreaType = "prefecture",
  prefCode?: string,
  version: MunicipalityVersion = "merged"
): Promise<TopoJSONTopology | null> {
  try {
    const r2Key = buildR2Key(areaType, prefCode, version);
    console.log(`[R2] Attempting to fetch: ${r2Key}`);

    // R2バケットへのアクセスはサーバーサイド（API Route）経由で行う
    // クライアントサイドからは直接アクセスできない
    const response = await fetch(
      `/api/gis/geoshape/r2?key=${encodeURIComponent(r2Key)}`
    );

    if (response.status === 404) {
      console.log(`[R2] Data not found in R2: ${r2Key}`);
      return null;
    }

    if (!response.ok) {
      throw new Error(
        `R2 fetch failed: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    // データの妥当性チェック
    if (!data || data.type !== "Topology") {
      console.warn("[R2] Invalid TopoJSON format from R2");
      return null;
    }

    console.log(`[R2] Successfully fetched from R2: ${r2Key}`);
    return data as TopoJSONTopology;
  } catch (error) {
    console.error("[R2] Fetch error:", error);
    return null;
  }
}

/**
 * R2ストレージにTopoJSONを保存（バックグラウンド処理）
 * @param data TopoJSONトポロジー
 * @param areaType 地域タイプ
 * @param prefCode 都道府県コード（2桁）
 * @param version 市区町村版タイプ
 */
export async function saveToR2(
  data: TopoJSONTopology,
  areaType: AreaType = "prefecture",
  prefCode?: string,
  version: MunicipalityVersion = "merged"
): Promise<void> {
  try {
    const r2Key = buildR2Key(areaType, prefCode, version);
    console.log(`[R2] Saving to R2: ${r2Key}`);

    // R2への保存はAPI Route経由で行う
    const response = await fetch("/api/gis/geoshape/r2", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        key: r2Key,
        data,
        cacheMaxAge: geoshapeConfig.cacheMaxAge,
      }),
    });

    if (!response.ok) {
      throw new Error(`R2 save failed: ${response.status}`);
    }

    console.log(`[R2] Successfully saved to R2: ${r2Key}`);
  } catch (error) {
    // 保存失敗はログのみ（ユーザー体験に影響させない）
    console.error("[R2] Save error:", error);
  }
}

/**
 * R2ストレージからデータを削除
 * @param areaType 地域タイプ
 * @param prefCode 都道府県コード（2桁）
 * @param version 市区町村版タイプ
 */
export async function deleteFromR2(
  areaType: AreaType = "prefecture",
  prefCode?: string,
  version: MunicipalityVersion = "merged"
): Promise<void> {
  try {
    const r2Key = buildR2Key(areaType, prefCode, version);
    console.log(`[R2] Deleting from R2: ${r2Key}`);

    const response = await fetch(
      `/api/gis/geoshape/r2?key=${encodeURIComponent(r2Key)}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok && response.status !== 404) {
      throw new Error(`R2 delete failed: ${response.status}`);
    }

    console.log(`[R2] Successfully deleted from R2: ${r2Key}`);
  } catch (error) {
    console.error("[R2] Delete error:", error);
    throw error;
  }
}

/**
 * R2ストレージが利用可能かチェック
 * @returns 利用可能ならtrue
 */
export async function isR2Available(): Promise<boolean> {
  try {
    const response = await fetch("/api/gis/geoshape/r2/health");
    return response.ok;
  } catch {
    return false;
  }
}
