import { EstatMetaInfoResponse, EstatMetaCategoryData } from "@/types/estat";

export class EstatDataTransformer {
  // メタデータからカテゴリ情報を抽出するヘルパー関数
  private static extractCategoryInfo(
    itemName: string,
    cat01Code: string
  ): string {
    if (!itemName || !cat01Code) {
      return itemName || "";
    }

    // cat01コード + "_" で始まる場合、その部分を除外
    const prefix = `${cat01Code}_`;
    if (itemName.startsWith(prefix)) {
      return itemName.substring(prefix.length);
    }

    // パターンが一致しない場合は元の文字列を返す
    return itemName;
  }

  // メタデータからカテゴリ情報を抽出してCSV形式に変換
  static extractCategoriesFromMetadata(
    metadata: EstatMetaInfoResponse
  ): EstatMetaCategoryData[] {
    const { TABLE_INF, CLASS_INF } = metadata.GET_META_INFO.METADATA_INF;
    const statsDataId = metadata.GET_META_INFO.PARAMETER.STATS_DATA_ID;

    console.log("🔍 カテゴリ情報抽出開始:", {
      statsDataId,
      statName: TABLE_INF.STAT_NAME.$,
      title: TABLE_INF.TITLE.$,
      classObjCount: CLASS_INF?.CLASS_OBJ?.length || 0,
    });

    const transformedData: EstatMetaCategoryData[] = [];

    // 基本情報の行を最初に追加
    const baseData: EstatMetaCategoryData = {
      stats_data_id: statsDataId,
      stat_name: TABLE_INF.STAT_NAME.$,
      title: TABLE_INF.TITLE.$,
      cat01: null,
      item_name: null,
      unit: null,
    };
    transformedData.push(baseData);

    // 分類情報がない場合は基本情報のみ
    if (!CLASS_INF?.CLASS_OBJ || CLASS_INF.CLASS_OBJ.length === 0) {
      console.log("⚠️ 分類情報なし - 基本情報のみ");
      return transformedData;
    }

    // 全カテゴリを処理
    CLASS_INF.CLASS_OBJ.forEach((classObj, classObjIndex) => {
      console.log(`📊 分類オブジェクト ${classObjIndex + 1}:`, {
        id: classObj["@id"],
        name: classObj["@name"],
        classCount: Array.isArray(classObj.CLASS) ? classObj.CLASS.length : 1,
      });

      // cat01分類のみを処理（地域情報などを除外）
      if (classObj["@id"] !== "cat01") {
        console.log(`⏭️ ${classObj["@id"]}分類をスキップ（cat01以外）`);
        return;
      }

      if (classObj.CLASS) {
        const classes = Array.isArray(classObj.CLASS)
          ? classObj.CLASS
          : [classObj.CLASS];

        classes.forEach((classItem, classIndex) => {
          // カテゴリコードとアイテム名の値を設定
          let cat01Value: string | null = null;
          let itemNameValue: string | null = null;

          // cat01分類のみ処理
          cat01Value = classItem["@code"] || null;
          const rawItemName = classItem["@name"] || null;

          // メタデータからカテゴリ情報を抽出
          if (cat01Value && rawItemName) {
            itemNameValue = this.extractCategoryInfo(rawItemName, cat01Value);
          } else {
            itemNameValue = rawItemName;
          }

          console.log(
            `✅ ${classObj["@id"]}分類: code=${cat01Value}, original_name=${rawItemName}, extracted_name=${itemNameValue}`
          );

          const transformedItem: EstatMetaCategoryData = {
            stats_data_id: statsDataId,
            stat_name: TABLE_INF.STAT_NAME.$,
            title: TABLE_INF.TITLE.$,
            cat01: cat01Value,
            item_name: itemNameValue,
            unit: classItem["@unit"] || null,
          };

          console.log(`🔄 変換されたアイテム ${classIndex + 1}:`, {
            cat01: transformedItem.cat01,
            item_name: transformedItem.item_name,
            unit: transformedItem.unit,
          });

          transformedData.push(transformedItem);
        });
      }
    });

    console.log(`🎯 カテゴリ情報抽出完了: ${transformedData.length}件のデータ`);

    return transformedData;
  }

  // 複数のメタデータからカテゴリ情報を一括抽出
  static extractCategoriesFromMultipleMetadata(
    metadataList: EstatMetaInfoResponse[]
  ): EstatMetaCategoryData[] {
    return metadataList.flatMap((metadata) =>
      this.extractCategoriesFromMetadata(metadata)
    );
  }

  // 後方互換性のため残す（非推奨）
  static transformToCSVFormat(
    metadata: EstatMetaInfoResponse
  ): EstatMetaCategoryData[] {
    console.warn(
      "⚠️ transformToCSVFormatは非推奨です。extractCategoriesFromMetadataを使用してください。"
    );
    return this.extractCategoriesFromMetadata(metadata);
  }

  // 後方互換性のため残す（非推奨）
  static transformMultipleToCSVFormat(
    metadataList: EstatMetaInfoResponse[]
  ): EstatMetaCategoryData[] {
    console.warn(
      "⚠️ transformMultipleToCSVFormatは非推奨です。extractCategoriesFromMultipleMetadataを使用してください。"
    );
    return this.extractCategoriesFromMultipleMetadata(metadataList);
  }
}
