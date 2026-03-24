/**
 * e-Stat API 統計データ取得レスポンスの型定義
 *
 * @see https://www.e-stat.go.jp/api/api-info/e-stat-manual3-0
 */
export interface EstatStatsDataResponse {
  GET_STATS_DATA: {
    RESULT: {
      STATUS: number;
      ERROR_MSG: string;
      DATE?: string;
    };
    PARAMETER: {
      LANG: string;
      STATS_DATA_ID: string;
      // 他のパラメータは省略
    };
    STATISTICAL_DATA: {
      TABLE_INF: EstatTableInfo;
      CLASS_INF: EstatClassInfo;
      DATA_INF: {
        VALUE: EstatValue | EstatValue[];
        NOTE?: EstatNote | EstatNote[];
      };
    };
  };
}

/**
 * TABLE_INFの型定義
 */
export interface EstatTableInfo {
  "@id"?: string;
  TITLE: {
    $: string;
    "@code": string;
  };
  STAT_NAME: {
    $: string;
    "@code": string;
  };
  GOV_ORG: {
    $: string;
    "@code": string;
  };
  STATISTICS_NAME: string;
  SURVEY_DATE: string;
  OPEN_DATE: string;
  SMALL_AREA: "0" | "1" | "2";
  COLLECT_AREA: string;
  CYCLE: string;
  UPDATED_DATE: string;
  TOTAL_NUMBER?: string;
  FROM_NUMBER?: string;
  TO_NUMBER?: string;
  MAIN_CATEGORY?: {
    $: string;
    "@code": string;
  };
  SUB_CATEGORY?: {
    $: string;
    "@code": string;
  };
  STATISTICS_NAME_SPEC?: {
    TABULATION_CATEGORY?: string;
    TABULATION_SUB_CATEGORY1?: string;
    TABULATION_SUB_CATEGORY2?: string;
    TABULATION_SUB_CATEGORY3?: string;
  };
  DESCRIPTION?: {
    $: string;
    TABULATION_CATEGORY_EXPLANATION?: string;
  };
}

export type EstatClassId = 
    | "tab"
    | "cat01" | "cat02" | "cat03" | "cat04" | "cat05"
    | "cat06" | "cat07" | "cat08" | "cat09" | "cat10"
    | "cat11" | "cat12" | "cat13" | "cat14" | "cat15"
    | "area" | "time";

export interface EstatClass {
  "@code": string;
  "@name": string;
  "@level"?: string;
  "@unit"?: string;
  "@parentCode"?: string;
  "@explanation"?: string;
}

export interface EstatClassObject {
  "@id": EstatClassId;
  "@name": string;
  "@description"?: string;
  CLASS?: EstatClass | EstatClass[];
  META_INFO?: {
    NEED: "true" | "false";
    POSITION: string;
  };
}

export interface EstatClassInfo {
  CLASS_OBJ: EstatClassObject[];
}

/**
 * DATA_INF.VALUEの型定義
 */
export interface EstatValue {
  "@tab"?: string;
  "@cat01"?: string;
  "@cat02"?: string;
  "@cat03"?: string;
  "@cat04"?: string;
  "@cat05"?: string;
  "@cat06"?: string;
  "@cat07"?: string;
  "@cat08"?: string;
  "@cat09"?: string;
  "@cat10"?: string;
  "@cat11"?: string;
  "@cat12"?: string;
  "@cat13"?: string;
  "@cat14"?: string;
  "@cat15"?: string;
  "@area"?: string;
  "@time"?: string;
  "@unit"?: string;
  $: string;
}

/**
 * DATA_INF.NOTEの型定義
 */
export interface EstatNote {
  "@char": string;
  $: string;
}

export type FormattedTableInfo = {
  id: string;
  title: string;
  statName: string;
  statCode: string;
  govOrg: string;
  govOrgCode: string;
  statisticsName: string;
  totalNumber: number;
  fromNumber: number;
  toNumber: number;
  dates: {
    surveyDate: string | number;
    openDate: string;
    updatedDate: string;
  };
  characteristics: {
    cycle: string;
    smallArea: number;
    collectArea: string;
  };
  classification: {
    mainCategory: {
      code: string;
      name: string;
    };
    subCategory?: {
      code: string;
      name: string;
    };
  };
  statisticsNameSpec?: {
    tabulationCategory?: string;
    tabulationSubCategory1?: string;
    tabulationSubCategory2?: string;
    tabulationSubCategory3?: string;
  };
  description?: {
    tabulationCategoryExplanation?: string;
    general?: string;
  };
};