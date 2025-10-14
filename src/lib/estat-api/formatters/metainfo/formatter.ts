/**
 * e-STATメタ情報フォーマッター
 * 責務: データ構造の変換のみを担当（純粋関数）
 */

import { EstatMetaInfoResponse, TransformedMetadataEntry } from "../../types";

export class EstatMetaInfoFormatter {
  /**
   * メタ情報をCSV形式に変換
   *
   * @param metaInfo - e-Stat APIのメタ情報レスポンス
   * @returns CSV形式に変換されたメタデータエントリの配列
   * @throws {Error} メタ情報が不足している場合
   */
  static transformToCSVFormat(
    metaInfo: EstatMetaInfoResponse
  ): TransformedMetadataEntry[] {
    console.log("🔵 Formatter: transformToCSVFormat 開始");
    const startTime = Date.now();

    const metaData = metaInfo.GET_META_INFO?.METADATA_INF;
    if (!metaData) {
      throw new Error("メタ情報が見つかりません");
    }

    const tableInfo = metaData.TABLE_INF;
    const classInfo = metaData.CLASS_INF?.CLASS_OBJ;

    if (!tableInfo || !classInfo) {
      throw new Error("必要なメタ情報が不足しています");
    }

    const result: TransformedMetadataEntry[] = [];
    const statsDataId = tableInfo["@id"] || "";
    const statName = tableInfo.STAT_NAME?.$ || "";
    const title = tableInfo.TITLE?.$ || "";

    // カテゴリ情報を取得（cat01のみ）
    const cat01Class = classInfo.find(
      (cls: { "@id": string }) => cls["@id"] === "cat01"
    );
    if (!cat01Class?.CLASS) {
      throw new Error("cat01カテゴリが見つかりません");
    }

    const categories = Array.isArray(cat01Class.CLASS)
      ? cat01Class.CLASS
      : [cat01Class.CLASS];

    console.log(`🔵 Formatter: ${categories.length}個のカテゴリを処理中`);

    // 各カテゴリをCSV行として変換
    categories.forEach(
      (category: {
        "@code"?: string;
        "@name"?: string | undefined;
        "@unit"?: string;
      }) => {
        const itemName = category["@name"] || null;
        result.push({
          stats_data_id: statsDataId,
          stat_name: statName,
          title: title,
          cat01: category["@code"] ?? "",
          item_name: itemName,
          unit: category["@unit"] || null,
        });
      }
    );

    console.log(
      `✅ Formatter: transformToCSVFormat 完了 (${
        Date.now() - startTime
      }ms) - ${result.length}件`
    );
    return result;
  }
}
