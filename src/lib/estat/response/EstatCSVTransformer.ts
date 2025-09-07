import { EstatMetaCategoryData } from "@/types/estat/formatted";

/**
 * e-STAT CSV変換クラス
 * メタデータのCSV形式変換を担当
 */
export class EstatCSVTransformer {
  /**
   * メタデータをCSV形式に変換
   */
  static transformToCSVFormat(
    metaInfo: Record<string, unknown>,
    statsDataId: string
  ): EstatMetaCategoryData[] {
    const result: EstatMetaCategoryData[] = [];

    // 基本情報を取得
    const getMetaInfo = metaInfo.GET_META_INFO as
      | Record<string, unknown>
      | undefined;
    const tableInf = getMetaInfo?.TABLE_INF as
      | Record<string, unknown>
      | undefined;
    const statName =
      (tableInf?.STAT_NAME as Record<string, string> | undefined)?.["$"] || "";
    const title =
      (tableInf?.TITLE as Record<string, string> | undefined)?.["$"] || "";

    // カテゴリ情報を処理
    const classInf = getMetaInfo?.CLASS_INF as
      | Record<string, unknown>
      | undefined;
    const classObjList = (classInf?.CLASS_OBJ as unknown[]) || [];

    for (const classObj of classObjList) {
      const classObjTyped = classObj as Record<string, unknown>;
      if (classObjTyped["@id"] === "cat01") {
        const classes = Array.isArray(classObjTyped.CLASS)
          ? classObjTyped.CLASS
          : [classObjTyped.CLASS];

        for (const cls of classes) {
          const clsTyped = cls as Record<string, unknown>;
          if (clsTyped && clsTyped["@code"] && clsTyped["@name"]) {
            const code = clsTyped["@code"] as string;
            const fullName = clsTyped["@name"] as string;
            const unit = (clsTyped["@unit"] as string) || null;

            // item_nameからcat01のコードを除去
            const itemName = this.extractItemName(fullName, code);

            result.push({
              stats_data_id: statsDataId,
              stat_name: statName,
              title: title,
              cat01: code,
              item_name: itemName,
              unit: unit,
            });
          }
        }
      }
    }

    return result;
  }

  /**
   * item_nameからcat01のコードを除去する
   */
  private static extractItemName(fullName: string, code: string): string {
    // パターン1: "A1101_総人口" → "総人口"
    if (fullName.includes("_")) {
      const parts = fullName.split("_");
      if (parts[0] === code && parts.length > 1) {
        return parts.slice(1).join("_");
      }
    }

    // パターン2: "A1101総人口" → "総人口"
    if (fullName.startsWith(code)) {
      return fullName.substring(code.length);
    }

    // パターン3: その他の場合は元の名前を返す
    return fullName;
  }
}
