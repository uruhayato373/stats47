import { EstatStatsDataResponse, EstatValue } from "@/types/estat";

/**
 * e-STAT APIレスポンスのデータ整形ユーティリティ
 */
export class EstatDataFormatter {
  /**
   * カテゴリ情報を見やすい形に整形
   * @param response e-STAT APIレスポンス
   * @returns 整形されたカテゴリ情報
   */
  static formatCategories(
    response: EstatStatsDataResponse
  ): FormattedCategory[] {
    const classInfo = response.GET_STATS_DATA.STATISTICAL_DATA.CLASS_INF;
    if (!classInfo?.CLASS_OBJ) return [];

    const categories: FormattedCategory[] = [];

    classInfo.CLASS_OBJ.forEach((classObj) => {
      // カテゴリ情報（cat01-cat15）のみを処理
      if (classObj["@id"].startsWith("cat")) {
        const categoryId = classObj["@id"];
        const categoryName = classObj["@name"];

        if (classObj.CLASS) {
          const classes = Array.isArray(classObj.CLASS)
            ? classObj.CLASS
            : [classObj.CLASS];

          classes.forEach((cls) => {
            categories.push({
              categoryId,
              categoryName,
              code: cls["@code"],
              name: this.cleanCategoryName(cls["@name"], cls["@code"]),
              originalName: cls["@name"],
              level: parseInt(cls["@level"]) || 1,
              unit: cls["@unit"] || null,
              parentCode: cls["@parentCode"] || null,
            });
          });
        }
      }
    });

    return categories.sort((a, b) => {
      if (a.categoryId !== b.categoryId) {
        return a.categoryId.localeCompare(b.categoryId);
      }
      return a.level - b.level || a.code.localeCompare(b.code);
    });
  }

  /**
   * 地域情報を見やすい形に整形
   * @param response e-STAT APIレスポンス
   * @returns 整形された地域情報
   */
  static formatAreas(response: EstatStatsDataResponse): FormattedArea[] {
    const classInfo = response.GET_STATS_DATA.STATISTICAL_DATA.CLASS_INF;
    if (!classInfo?.CLASS_OBJ) return [];

    const areaClassObj = classInfo.CLASS_OBJ.find(
      (obj) => obj["@id"] === "area"
    );
    if (!areaClassObj?.CLASS) return [];

    const areaClasses = Array.isArray(areaClassObj.CLASS)
      ? areaClassObj.CLASS
      : [areaClassObj.CLASS];

    return areaClasses
      .map((areaClass) => {
        const code = areaClass["@code"];
        const name = areaClass["@name"];
        const level = parseInt(areaClass["@level"]) || 1;

        return {
          code,
          name,
          displayName: this.formatAreaDisplay(name, code),
          level,
          parentCode: areaClass["@parentCode"] || null,
          areaType: this.getAreaType(code, name),
          sortOrder: this.getAreaSortOrder(code, level)
        };
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  /**
   * 年度・時間軸情報を見やすい形に整形
   * @param response e-STAT APIレスポンス
   * @returns 整形された年度情報
   */
  static formatYears(response: EstatStatsDataResponse): FormattedYear[] {
    const classInfo = response.GET_STATS_DATA.STATISTICAL_DATA.CLASS_INF;
    if (!classInfo?.CLASS_OBJ) return [];

    const timeClassObj = classInfo.CLASS_OBJ.find(
      (obj) => obj["@id"] === "time"
    );
    if (!timeClassObj?.CLASS) return [];

    const timeClasses = Array.isArray(timeClassObj.CLASS)
      ? timeClassObj.CLASS
      : [timeClassObj.CLASS];

    return timeClasses
      .map((timeClass) => {
        const code = timeClass["@code"];
        const name = timeClass["@name"];

        return {
          code,
          name,
          displayName: this.formatYearDisplay(name, code),
          year: this.extractYear(name, code),
          period: this.extractPeriod(name, code),
          sortOrder: this.getYearSortOrder(code),
        };
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  /**
   * 値データを見やすい形に整形
   * @param response e-STAT APIレスポンス
   * @param categoryMap カテゴリマップ（オプション）
   * @param yearMap 年度マップ（オプション）
   * @param areaMap 地域マップ（オプション）
   * @returns 整形された値データ
   */
  static formatValues(
    response: EstatStatsDataResponse,
    categoryMap?: Map<string, FormattedCategory>,
    yearMap?: Map<string, FormattedYear>,
    areaMap?: Map<string, FormattedArea>
  ): FormattedValue[] {
    const dataInfo = response.GET_STATS_DATA.STATISTICAL_DATA.DATA_INF;
    if (!dataInfo?.VALUE) return [];

    const values = Array.isArray(dataInfo.VALUE)
      ? dataInfo.VALUE
      : [dataInfo.VALUE];

    return values.map((value) => {
      const formattedValue: FormattedValue = {
        rawValue: value.$,
        numericValue: this.parseNumericValue(value.$),
        displayValue: this.formatDisplayValue(value.$),
        unit: value["@unit"] || null,
        categories: {},
        timeCode: value["@time"] || null,
        areaCode: value["@area"] || null,
      };

      // カテゴリコードの整理
      for (let i = 1; i <= 15; i++) {
        const catKey = `@cat${i
          .toString()
          .padStart(2, "0")}` as keyof EstatValue;
        const catCode = value[catKey] as string;
        if (catCode) {
          const categoryInfo = categoryMap?.get(catCode);
          formattedValue.categories[`cat${i.toString().padStart(2, "0")}`] = {
            code: catCode,
            name: categoryInfo?.name || catCode,
            originalName: categoryInfo?.originalName || catCode,
          };
        }
      }

      // 時間軸情報の追加
      if (formattedValue.timeCode && yearMap) {
        const yearInfo = yearMap.get(formattedValue.timeCode);
        if (yearInfo) {
          formattedValue.yearInfo = {
            code: yearInfo.code,
            name: yearInfo.name,
            displayName: yearInfo.displayName,
            year: yearInfo.year,
            period: yearInfo.period,
          };
        }
      }

      // 地域情報の追加
      if (formattedValue.areaCode && areaMap) {
        const areaInfo = areaMap.get(formattedValue.areaCode);
        if (areaInfo) {
          formattedValue.areaInfo = {
            code: areaInfo.code,
            name: areaInfo.name,
            displayName: areaInfo.displayName,
            level: areaInfo.level,
            areaType: areaInfo.areaType,
            parentCode: areaInfo.parentCode
          };
        }
      }

      return formattedValue;
    });
  }

  /**
   * 完全な整形データを生成
   * @param response e-STAT APIレスポンス
   * @returns すべてのデータが整形されたオブジェクト
   */
  static formatAll(response: EstatStatsDataResponse): FormattedEstatData {
    const categories = this.formatCategories(response);
    const areas = this.formatAreas(response);
    const years = this.formatYears(response);

    // マップを作成してパフォーマンスを向上
    const categoryMap = new Map(categories.map((cat) => [cat.code, cat]));
    const areaMap = new Map(areas.map((area) => [area.code, area]));
    const yearMap = new Map(years.map((year) => [year.code, year]));

    const values = this.formatValues(response, categoryMap, yearMap, areaMap);

    return {
      tableInfo: {
        title: response.GET_STATS_DATA.STATISTICAL_DATA.TABLE_INF.TITLE.$,
        statName:
          response.GET_STATS_DATA.STATISTICAL_DATA.TABLE_INF.STAT_NAME.$,
        govOrg: response.GET_STATS_DATA.STATISTICAL_DATA.TABLE_INF.GOV_ORG.$,
        surveyDate:
          response.GET_STATS_DATA.STATISTICAL_DATA.TABLE_INF.SURVEY_DATE,
        openDate: response.GET_STATS_DATA.STATISTICAL_DATA.TABLE_INF.OPEN_DATE,
      },
      categories,
      areas,
      years,
      values,
      summary: {
        categoryCount: categories.length,
        areaCount: areas.length,
        yearCount: years.length,
        valueCount: values.length,
        totalNumber:
          response.GET_STATS_DATA.STATISTICAL_DATA.RESULT_INF.TOTAL_NUMBER,
      },
    };
  }

  // プライベートヘルパーメソッド

  /**
   * カテゴリ名をクリーンアップ（プレフィックス除去など）
   */
  private static cleanCategoryName(name: string, code: string): string {
    if (!name || !code) return name || "";

    // コード + "_" で始まる場合、その部分を除外
    const prefix = `${code}_`;
    if (name.startsWith(prefix)) {
      return name.substring(prefix.length);
    }

    return name;
  }

  /**
   * 年度の表示名を整形
   */
  private static formatYearDisplay(name: string, code: string): string {
    // 年度パターンの検出と整形
    if (name.includes("年度")) {
      return name;
    }
    if (name.includes("年") && !name.includes("年度")) {
      return name.replace("年", "年度");
    }
    if (/^\d{4}$/.test(code)) {
      return `${code}年度`;
    }
    return name;
  }

  /**
   * 年度を抽出
   */
  private static extractYear(name: string, code: string): number | null {
    // コードから年度を抽出
    const codeMatch = code.match(/(\d{4})/);
    if (codeMatch) {
      return parseInt(codeMatch[1]);
    }

    // 名前から年度を抽出
    const nameMatch = name.match(/(\d{4})/);
    if (nameMatch) {
      return parseInt(nameMatch[1]);
    }

    return null;
  }

  /**
   * 期間情報を抽出
   */
  private static extractPeriod(name: string, code: string): string | null {
    if (name.includes("月")) {
      const monthMatch = name.match(/(\d{1,2})月/);
      if (monthMatch) {
        return `${monthMatch[1]}月`;
      }
    }
    if (name.includes("四半期")) {
      const quarterMatch = name.match(/第?([1-4])四半期/);
      if (quarterMatch) {
        return `第${quarterMatch[1]}四半期`;
      }
    }
    return null;
  }

  /**
   * 年度のソート順序を取得
   */
  private static getYearSortOrder(code: string): number {
    const yearMatch = code.match(/(\d{4})/);
    if (yearMatch) {
      const year = parseInt(yearMatch[1]);
      // 月がある場合は月も考慮
      const monthMatch = code.match(/(\d{2})$/);
      if (monthMatch) {
        const month = parseInt(monthMatch[1]);
        return year * 100 + month;
      }
      return year * 100;
    }
    return 0;
  }

  /**
   * 地域の表示名を整形
   */
  private static formatAreaDisplay(name: string, code: string): string {
    // 数字のプレフィックスを除去
    const cleanName = name.replace(/^[\d-]+\s*/, '');
    
    // 地域コードが5桁の場合は都道府県、それ以上は市区町村として処理
    if (code.length === 2 && cleanName) {
      return cleanName;
    }
    
    return cleanName || name;
  }

  /**
   * 地域のタイプを判定
   */
  private static getAreaType(code: string, name: string): 'country' | 'region' | 'prefecture' | 'city' | 'other' {
    if (code === '00000' || name.includes('全国')) {
      return 'country';
    }
    if (code.length === 2) {
      return 'prefecture';
    }
    if (code.length === 5) {
      return 'city';
    }
    if (name.includes('地方') || name.includes('ブロック')) {
      return 'region';
    }
    return 'other';
  }

  /**
   * 地域のソート順序を取得
   */
  private static getAreaSortOrder(code: string, level: number): number {
    // 全国は最初
    if (code === '00000') {
      return 0;
    }
    
    // レベル × 100000 + コード番号でソート
    const codeNum = parseInt(code) || 0;
    return level * 100000 + codeNum;
  }

  /**
   * 数値を解析
   */
  private static parseNumericValue(value: string): number | null {
    if (!value || value === "-" || value === "…" || value === "X") {
      return null;
    }

    const parsed = parseFloat(value.replace(/,/g, ""));
    return isNaN(parsed) ? null : parsed;
  }

  /**
   * 表示用の値を整形
   */
  private static formatDisplayValue(value: string): string {
    if (!value || value === "-" || value === "…" || value === "X") {
      return value || "-";
    }

    const numericValue = this.parseNumericValue(value);
    if (numericValue !== null) {
      // 数値をカンマ区切りで表示
      return numericValue.toLocaleString("ja-JP");
    }

    return value;
  }
}

// 型定義

/**
 * 整形されたカテゴリ情報
 */
export interface FormattedCategory {
  categoryId: string; // cat01, cat02 など
  categoryName: string; // カテゴリ名
  code: string; // カテゴリコード
  name: string; // 整形後の名前
  originalName: string; // 元の名前
  level: number; // 階層レベル
  unit: string | null; // 単位
  parentCode: string | null; // 親コード
}

/**
 * 整形された年度情報
 */
export interface FormattedYear {
  code: string; // 時間軸コード
  name: string; // 元の名前
  displayName: string; // 表示用名前
  year: number | null; // 年度
  period: string | null; // 期間（月、四半期など）
  sortOrder: number; // ソート用
}

/**
 * 整形された地域情報
 */
export interface FormattedArea {
  code: string;             // 地域コード
  name: string;             // 元の名前
  displayName: string;      // 表示用名前
  level: number;            // 階層レベル
  parentCode: string | null; // 親地域コード
  areaType: 'country' | 'region' | 'prefecture' | 'city' | 'other'; // 地域タイプ
  sortOrder: number;        // ソート用
}

/**
 * 整形された値データ
 */
export interface FormattedValue {
  rawValue: string; // 元の値
  numericValue: number | null; // 数値
  displayValue: string; // 表示用値
  unit: string | null; // 単位
  categories: {
    // カテゴリ情報
    [key: string]: {
      code: string;
      name: string;
      originalName: string;
    };
  };
  timeCode: string | null; // 時間軸コード
  areaCode: string | null; // 地域コード
  yearInfo?: {
    // 年度情報
    code: string;
    name: string;
    displayName: string;
    year: number | null;
    period: string | null;
  };
  areaInfo?: {
    // 地域情報
    code: string;
    name: string;
    displayName: string;
    level: number;
    areaType: 'country' | 'region' | 'prefecture' | 'city' | 'other';
    parentCode: string | null;
  };
}

/**
 * 完全に整形されたe-STATデータ
 */
export interface FormattedEstatData {
  tableInfo: {
    title: string;
    statName: string;
    govOrg: string;
    surveyDate: string;
    openDate: string;
  };
  categories: FormattedCategory[];
  areas: FormattedArea[];
  years: FormattedYear[];
  values: FormattedValue[];
  summary: {
    categoryCount: number;
    areaCount: number;
    yearCount: number;
    valueCount: number;
    totalNumber: number;
  };
}
