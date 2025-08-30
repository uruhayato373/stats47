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
      transformedData.push(baseData);
      return transformedData;
    }

    // 分類情報を処理
    CLASS_INF.CLASS_OBJ.forEach((classObj) => {
      if (classObj.CLASS) {
        const classes = Array.isArray(classObj.CLASS)
          ? classObj.CLASS
          : [classObj.CLASS];

        classes.forEach((classItem) => {
          const transformedItem: EstatTransformedData = {
            stats_data_id: statsDataId,
            stat_name: TABLE_INF.STAT_NAME.$,
            title: TABLE_INF.TITLE.$,
            cat01: classObj["@id"] === "cat01" ? classItem["@name"] : null,
            item_name: classItem["@name"],
            unit: classItem["@unit"] || null,
          };

          transformedData.push(transformedItem);
        });
      }
    });

    // データが空の場合は基本情報のみ
    if (transformedData.length === 0) {
      transformedData.push(baseData);
    }

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
