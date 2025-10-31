"use server";

import type { AreaType } from "@/features/area";
import { saveMetaInfo } from "@/features/estat-api/meta-info/repositories/meta-info-repository";
import { fetchMetaInfo } from "@/features/estat-api/meta-info/services/fetcher";
import { extractTableInfo } from "@/features/estat-api/meta-info/services/formatter";

/**
 * サーバーアクション: e-Statメタ情報を保存
 *
 * e-Stat APIからメタ情報を取得してデータベースに保存します。
 * area_typeはSTATISTICS_NAME_SPEC.TABULATION_CATEGORYを優先して判定し、
 * それが利用できない場合はCOLLECT_AREAの内容から自動推定されます。
 *
 * @param statsDataId - 統計表ID
 * @returns 保存結果（成功/失敗とメッセージ）
 *
 * @example
 * ```tsx
 * const result = await saveMetaInfoAction("0000010101");
 * if (result.success) {
 *   console.log(result.message);
 * }
 * ```
 */
export async function saveMetaInfoAction(
  statsDataId: string
): Promise<{ success: boolean; message: string }> {
  try {
    if (!statsDataId) {
      return { success: false, message: "統計表IDが必要です" };
    }

    // e-Stat APIからメタ情報を取得
    const metaInfoResponse = await fetchMetaInfo(statsDataId);

    // メタ情報から必要な情報を抽出
    const tableInfo = extractTableInfo(metaInfoResponse);

    // area_typeを推定（TABULATION_CATEGORYを優先、なければCOLLECT_AREAから）
    const tabulationCategory = tableInfo.tabulationCategory || "";
    const collectArea = tableInfo.collectArea || "";
    let areaType: AreaType = "national";

    // TABULATION_CATEGORYでの判定を優先
    if (tabulationCategory.includes("都道府県データ")) {
      areaType = "prefecture";
    } else if (tabulationCategory.includes("市区町村データ")) {
      areaType = "city";
    } else if (tabulationCategory.includes("全国データ")) {
      areaType = "national";
    } else {
      // フォールバック: COLLECT_AREAでの判定
      if (collectArea.includes("都道府県") || collectArea.includes("県")) {
        areaType = "prefecture";
      } else if (
        collectArea.includes("市区町村") ||
        collectArea.includes("市") ||
        collectArea.includes("区") ||
        collectArea.includes("町") ||
        collectArea.includes("村")
      ) {
        areaType = "city";
      }
    }

    // データベースに保存
    const success = await saveMetaInfo({
      stats_data_id: tableInfo.id || statsDataId,
      stat_name: tableInfo.statName || "",
      title: tableInfo.title || "",
      area_type: areaType,
      description: undefined,
    });

    if (!success) {
      return { success: false, message: "メタ情報の保存に失敗しました" };
    }

    return {
      success: true,
      message: `${statsDataId}のメタ情報を保存しました`,
    };
  } catch (error) {
    console.error("メタ情報保存エラー:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "メタ情報の保存に失敗しました",
    };
  }
}
