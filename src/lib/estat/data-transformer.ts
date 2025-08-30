import { EstatMetaInfoResponse } from "@/types/estat";

export interface EstatTransformedData {
  stats_data_id: string;
  stat_name: string;
  title: string;
  cat01: string | null;
  item_name: string | null;
  unit: string | null;
}

export class EstatDataTransformer {
  // e-Stat APIレスポンスをCSV形式に変換
  static transformToCSVFormat(
    metadata: EstatMetaInfoResponse
  ): EstatTransformedData[] {
    const { TABLE_INF, CLASS_INF } = metadata.GET_META_INFO.METADATA_INF;
    const statsDataId = metadata.GET_META_INFO.PARAMETER.STATS_DATA_ID;

    console.log("🔍 データ変換開始:", {
      statsDataId,
      statName: TABLE_INF.STAT_NAME.$,
      title: TABLE_INF.TITLE.$,
      classObjCount: CLASS_INF?.CLASS_OBJ?.length || 0,
    });

    const transformedData: EstatTransformedData[] = [];

    // 基本情報を抽出
    const baseData: EstatTransformedData = {
      stats_data_id: statsDataId,
      stat_name: TABLE_INF.STAT_NAME.$,
      title: TABLE_INF.TITLE.$,
      cat01: null,
      item_name: null,
      unit: null,
    };

    // 分類情報がない場合は基本情報のみ
    if (!CLASS_INF?.CLASS_OBJ || CLASS_INF.CLASS_OBJ.length === 0) {
      console.log("⚠️ 分類情報なし - 基本情報のみ");
      transformedData.push(baseData);
      return transformedData;
    }

    // 分類情報を処理
    CLASS_INF.CLASS_OBJ.forEach((classObj, classObjIndex) => {
      console.log(`📊 分類オブジェクト ${classObjIndex + 1}:`, {
        id: classObj["@id"],
        name: classObj["@name"],
        classCount: Array.isArray(classObj.CLASS) ? classObj.CLASS.length : 1,
      });

      if (classObj.CLASS) {
        const classes = Array.isArray(classObj.CLASS)
          ? classObj.CLASS
          : [classObj.CLASS];

        classes.forEach((classItem, classIndex) => {
          // cat01の値を正しく設定
          let cat01Value: string | null = null;
          let itemNameValue: string | null = null;

          // CLASS_OBJの@idが"cat01"の場合のみcat01に設定
          if (classObj["@id"] === "cat01") {
            cat01Value = classItem["@name"] || null;
            itemNameValue = classItem["@name"] || null;
            console.log(`✅ cat01分類: ${cat01Value}`);
          } else {
            // cat01以外の分類はitem_nameに設定
            itemNameValue = classItem["@name"] || null;
            console.log(`📝 その他分類 (${classObj["@id"]}): ${itemNameValue}`);
          }

          const transformedItem: EstatTransformedData = {
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

    // データが空の場合は基本情報のみ
    if (transformedData.length === 0) {
      console.log("⚠️ 変換結果が空 - 基本情報のみ");
      transformedData.push(baseData);
    }

    console.log(`🎯 変換完了: ${transformedData.length}件のデータ`);

    return transformedData;
  }

  // 複数のメタ情報を一括変換
  static transformMultipleToCSVFormat(
    metadataList: EstatMetaInfoResponse[]
  ): EstatTransformedData[] {
    return metadataList.flatMap((metadata) =>
      this.transformToCSVFormat(metadata)
    );
  }
}
