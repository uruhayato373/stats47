/**
 * e-STATメタ情報フォーマッター
 * 責務: メタ情報の包括的な抽出・変換（純粋関数）
 *
 * @see GET_META_INFO完全ガイド
 */

import { EstatMetaInfoResponse } from "../types";
import {
  TableInfo,
  CategoryInfo,
  PrefectureInfo,
  TimeAxisInfo,
  SelectOption,
  ParsedMetaInfo,
  PrefectureMap,
  ClassObject,
  ClassItem,
  DimensionSelectOptions,
} from "../types/meta-info";
import { ESTAT_API_CONFIG } from "../config";

export class EstatMetaInfoFormatter {
  /**
   * 統計表の基本情報を抽出
   *
   * @param metaInfo - e-Stat APIのメタ情報レスポンス
   * @returns 統計表の基本情報
   * @throws {Error} メタ情報が不足している場合
   *
   * @see GET_META_INFO完全ガイド 4.2 TABLE_INF
   *
   * @example
   * ```typescript
   * const tableInfo = EstatMetaInfoFormatter.extractTableInfo(metaInfo);
   * console.log(tableInfo.title); // "都道府県，男女別人口"
   * ```
   */
  static extractTableInfo(metaInfo: EstatMetaInfoResponse): TableInfo {
    const metaData = metaInfo.GET_META_INFO?.METADATA_INF;
    if (!metaData?.TABLE_INF) {
      throw new Error("統計表情報が見つかりません");
    }

    const tableInf = metaData.TABLE_INF;

    return {
      id: tableInf["@id"] || "",
      statName: tableInf.STAT_NAME?.$ || "",
      organization: tableInf.GOV_ORG?.$ || "",
      statisticsName: tableInf.STATISTICS_NAME || "",
      title: tableInf.TITLE?.$ || "",
      cycle: tableInf.CYCLE || "",
      surveyDate: tableInf.SURVEY_DATE || "",
      openDate: tableInf.OPEN_DATE || "",
      smallArea: tableInf.SMALL_AREA || "",
      collectArea: tableInf.COLLECT_AREA || "",
      mainCategory: {
        code: tableInf.MAIN_CATEGORY?.["@no"] || "",
        name: tableInf.MAIN_CATEGORY?.$ || "",
      },
      subCategory: tableInf.SUB_CATEGORY
        ? {
            code: tableInf.SUB_CATEGORY["@no"] || "",
            name: tableInf.SUB_CATEGORY.$ || "",
          }
        : undefined,
      totalRecords: parseInt(String(tableInf.OVERALL_TOTAL_NUMBER || "0")),
      updatedDate: tableInf.UPDATED_DATE || "",
    };
  }

  /**
   * 全分類項目を抽出
   *
   * @param metaInfo - e-Stat APIのメタ情報レスポンス
   * @returns 分類項目情報の配列
   *
   * @see GET_META_INFO完全ガイド 4.3 CLASS_INF
   *
   * @example
   * ```typescript
   * const categories = EstatMetaInfoFormatter.extractCategories(metaInfo);
   * const genderCategory = categories.find(c => c.id === "cat01");
   * console.log(genderCategory?.items); // [{ code: "001", name: "総数", unit: "人" }, ...]
   * ```
   */
  static extractCategories(metaInfo: EstatMetaInfoResponse): CategoryInfo[] {
    const classObjs =
      metaInfo.GET_META_INFO?.METADATA_INF?.CLASS_INF?.CLASS_OBJ;
    if (!classObjs) {
      return [];
    }

    const categories: CategoryInfo[] = [];

    for (const classObj of classObjs) {
      if (classObj["@id"].startsWith("cat") && classObj.CLASS) {
        categories.push({
          id: classObj["@id"],
          name: classObj["@name"],
          items: Array.isArray(classObj.CLASS)
            ? classObj.CLASS.map((item) => ({
                code: item["@code"],
                name: item["@name"],
                unit: item["@unit"],
                level: item["@level"],
                parentCode: item["@parentCode"],
              }))
            : [
                {
                  code: classObj.CLASS["@code"],
                  name: classObj.CLASS["@name"],
                  unit: classObj.CLASS["@unit"],
                  level: classObj.CLASS["@level"],
                  parentCode: classObj.CLASS["@parentCode"],
                },
              ],
        });
      }
    }

    return categories;
  }

  /**
   * 都道府県コード・名称マップを生成
   *
   * @param metaInfo - e-Stat APIのメタ情報レスポンス
   * @returns 都道府県コード→名称のMap
   *
   * @see GET_META_INFO完全ガイド 6.2 都道府県コード・名称マップの作成
   *
   * @example
   * ```typescript
   * const prefMap = EstatMetaInfoFormatter.extractPrefectureMap(metaInfo);
   * console.log(prefMap.get("13000")); // "東京都"
   * ```
   */
  static extractPrefectureMap(metaInfo: EstatMetaInfoResponse): PrefectureMap {
    const areaClass = this.findClassObj(metaInfo, "area");
    if (!areaClass) {
      return new Map();
    }

    const classItems = Array.isArray(areaClass.CLASS)
      ? areaClass.CLASS.filter((item): item is ClassItem => item !== undefined)
      : areaClass.CLASS
      ? [areaClass.CLASS]
      : [];
    const prefectures = classItems.filter((item: ClassItem) => {
      const code = item["@code"];
      return code.length === 5 && code.endsWith("000") && code !== "00000";
    });

    return new Map(
      prefectures.map((item: ClassItem) => [item["@code"], item["@name"]])
    );
  }

  /**
   * 地域階層情報を抽出
   *
   * @param metaInfo - e-Stat APIのメタ情報レスポンス
   * @returns 地域情報の配列（階層構造を保持）
   *
   * @see GET_META_INFO完全ガイド 4.3 CLASS_INF area
   *
   * @example
   * ```typescript
   * const areas = EstatMetaInfoFormatter.extractAreaHierarchy(metaInfo);
   * const prefectures = areas.filter(a => a.level === 2);
   * ```
   */
  static extractAreaHierarchy(
    metaInfo: EstatMetaInfoResponse
  ): PrefectureInfo[] {
    const areaClass = this.findClassObj(metaInfo, "area");
    if (!areaClass) {
      return [];
    }

    if (!areaClass.CLASS) {
      return [];
    }

    return Array.isArray(areaClass.CLASS)
      ? areaClass.CLASS.filter(
          (item): item is ClassItem => item !== undefined
        ).map((item: ClassItem) => ({
          code: item["@code"],
          name: item["@name"],
          level: parseInt(item["@level"] || "1"),
          parentCode: item["@parentCode"],
          unit: item["@unit"],
        }))
      : [
          {
            code: areaClass.CLASS["@code"],
            name: areaClass.CLASS["@name"],
            level: parseInt(areaClass.CLASS["@level"] || "1"),
            parentCode: areaClass.CLASS["@parentCode"],
            unit: areaClass.CLASS["@unit"],
          },
        ];
  }

  /**
   * 時間軸情報を抽出
   *
   * @param metaInfo - e-Stat APIのメタ情報レスポンス
   * @returns 時間軸情報
   *
   * @see GET_META_INFO完全ガイド 6.4 時間軸情報の取得
   *
   * @example
   * ```typescript
   * const timeAxis = EstatMetaInfoFormatter.extractTimeAxis(metaInfo);
   * console.log(timeAxis.availableYears); // ["2020000000", "2015000000"]
   * ```
   */
  static extractTimeAxis(metaInfo: EstatMetaInfoResponse): TimeAxisInfo {
    const timeClass = this.findClassObj(metaInfo, "time");
    if (!timeClass) {
      return {
        availableYears: [],
        formattedYears: [],
        minYear: "",
        maxYear: "",
      };
    }

    if (!timeClass.CLASS) {
      return {
        availableYears: [],
        formattedYears: [],
        minYear: "",
        maxYear: "",
      };
    }

    const classItems = Array.isArray(timeClass.CLASS)
      ? timeClass.CLASS.filter((item): item is ClassItem => item !== undefined)
      : [timeClass.CLASS];

    const years = classItems.map((item: ClassItem) => item["@code"]).sort();
    const formattedYears = classItems
      .map((item: ClassItem) => item["@name"])
      .sort();

    return {
      availableYears: years,
      formattedYears: formattedYears,
      minYear: years[0] || "",
      maxYear: years[years.length - 1] || "",
    };
  }

  /**
   * UI用の選択肢を生成（stats-data互換のdimensions概念）
   *
   * @param metaInfo - e-Stat APIのメタ情報レスポンス
   * @returns UI用の選択肢データ（stats-dataのFormattedValue.dimensionsと同じ構造）
   *
   * @see GET_META_INFO完全ガイド 7.2 UI コンポーネント用の選択肢生成
   * @see stats-data FormattedValue.dimensions との設計統一
   *
   * @example
   * ```typescript
   * const options = EstatMetaInfoFormatter.generateSelectOptions(metaInfo);
   *
   * // 全次元を取得（stats-dataと同じ構造）
   * console.log(options.area);     // 都道府県の選択肢
   * console.log(options.time);     // 年次の選択肢
   * console.log(options.cat01);    // 分類1の選択肢
   * console.log(options.cat02);    // 分類2の選択肢（存在する場合）
   *
   * // React コンポーネントで使用
   * {options.area.map(opt => (
   *   <option key={opt.value} value={opt.value}>{opt.label}</option>
   * ))}
   * ```
   */
  static generateSelectOptions(
    metaInfo: EstatMetaInfoResponse
  ): DimensionSelectOptions {
    const classObjs =
      metaInfo.GET_META_INFO?.METADATA_INF?.CLASS_INF?.CLASS_OBJ;
    if (!classObjs) {
      return { area: [], time: [] };
    }

    // stats-dataと同じ次元IDを動的生成
    const dimensionIds = [
      "area",
      "time",
      "tab",
      ...Array.from(
        { length: 15 },
        (_, i) => `cat${String(i + 1).padStart(2, "0")}`
      ),
    ];

    // 結果オブジェクトを初期化
    const result: DimensionSelectOptions = { area: [], time: [] };

    // 全次元を処理
    for (const dimId of dimensionIds) {
      const dimClass = classObjs.find((obj) => obj["@id"] === dimId);
      if (!dimClass?.CLASS) continue;

      const options = this.convertToSelectOptions(dimClass);

      // 次元に応じて適切な場所に格納
      if (dimId === "area") {
        result.area = this.filterPrefectures(options);
      } else if (dimId === "time") {
        result.time = this.sortByDescending(options);
      } else if (dimId === "tab") {
        result.tab = options;
      } else if (dimId.startsWith("cat")) {
        // cat01-cat15を動的に設定
        (result as unknown as Record<string, SelectOption[]>)[dimId] = options;
      }
    }

    return result;
  }

  /**
   * ClassObjectをSelectOption配列に変換
   *
   * @param classObj - CLASS_OBJ
   * @returns SelectOption配列
   */
  private static convertToSelectOptions(classObj: ClassObject): SelectOption[] {
    if (!classObj.CLASS) {
      return [];
    }

    const classItems = Array.isArray(classObj.CLASS)
      ? classObj.CLASS.filter((item): item is ClassItem => item !== undefined)
      : [classObj.CLASS];

    return classItems.map((item: ClassItem) => ({
      value: item["@code"],
      label: item["@name"],
    }));
  }

  /**
   * 都道府県のみをフィルタリング
   *
   * @param options - 全地域の選択肢
   * @returns 都道府県の選択肢
   */
  private static filterPrefectures(options: SelectOption[]): SelectOption[] {
    return options.filter((opt) => {
      const code = opt.value;
      return (
        code.length === ESTAT_API_CONFIG.PREFECTURE_CODE_LENGTH &&
        code.endsWith(ESTAT_API_CONFIG.PREFECTURE_CODE_SUFFIX) &&
        code !== ESTAT_API_CONFIG.EXCLUDE_NATIONAL_CODE
      );
    });
  }

  /**
   * 選択肢を降順でソート
   *
   * @param options - 選択肢配列
   * @returns ソート済み選択肢配列
   */
  private static sortByDescending(options: SelectOption[]): SelectOption[] {
    return options.sort((a, b) => b.value.localeCompare(a.value));
  }

  /**
   * メタ情報を完全解析
   *
   * @param metaInfo - e-Stat APIのメタ情報レスポンス
   * @returns 完全解析済みメタ情報
   *
   * @see GET_META_INFO完全ガイド 6.5 メタ情報の完全解析
   *
   * @example
   * ```typescript
   * const parsed = EstatMetaInfoFormatter.parseCompleteMetaInfo(metaInfo);
   * console.log(parsed.tableInfo.title);
   * console.log(parsed.dimensions.categories.length);
   * ```
   */
  static parseCompleteMetaInfo(
    metaInfo: EstatMetaInfoResponse
  ): ParsedMetaInfo {
    const tableInfo = this.extractTableInfo(metaInfo);
    const categories = this.extractCategories(metaInfo);
    const areas = this.extractAreaHierarchy(metaInfo);
    const timeAxis = this.extractTimeAxis(metaInfo);

    return {
      tableInfo,
      dimensions: {
        categories,
        areas,
        timeAxis,
      },
    };
  }

  /**
   * CLASS_OBJを検索するヘルパーメソッド
   *
   * @param metaInfo - e-Stat APIのメタ情報レスポンス
   * @param id - 検索するCLASS_OBJのID
   * @returns 該当するCLASS_OBJまたはundefined
   */
  private static findClassObj(
    metaInfo: EstatMetaInfoResponse,
    id: string
  ): ClassObject | undefined {
    const classObjs =
      metaInfo.GET_META_INFO?.METADATA_INF?.CLASS_INF?.CLASS_OBJ;
    return classObjs?.find((obj) => obj["@id"] === id);
  }
}
