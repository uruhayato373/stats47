/**
 * e-STAT API Stats Data 型定義
 *
 * 統計データ取得API（getStatsData）に関連する全ての型定義。
 * 共通型は common.ts からインポート。
 */

import {
  EstatClassInfo,
  EstatResult,
  EstatTableInfo,
} from "@/features/estat-api/core/types/common";

/**
 * e-STAT API getStatsData のレスポンス型
 *
 * 統計データ取得APIの完全なレスポンス構造を定義。
 * 生のAPIレスポンスから整形されたデータへの変換の起点となる。
 *
 * @see https://www.e-stat.go.jp/api/api-info/e-stat-manual3-0#api_4
 * @example
 * ```typescript
 * const response: EstatStatsDataResponse = await estatAPI.getStatsData(params);
 * const formattedData = EstatStatsDataFormatter.formatStatsData(response);
 * ```
 */
export interface EstatStatsDataResponse {
  GET_STATS_DATA: {
    RESULT: EstatResult;
    PARAMETER: EstatStatsDataParameter;
    STATISTICAL_DATA: EstatStatisticalData;
  };
}

/**
 * e-STAT API getStatsData リクエストパラメータ情報
 *
 * 統計データ取得時にAPIに送信されたパラメータの詳細。
 * レスポンス内に含まれるため、どの条件でデータを取得したかが分かる。
 *
 * @example
 * ```typescript
 * const params: EstatStatsDataParameter = {
 *   LANG: "J",
 *   STATS_DATA_ID: "0000010101",
 *   DATA_FORMAT: "J",
 *   METAGET_FLG: "Y",
 *   CNT_GET_FLG: "N"
 * };
 * ```
 */
export interface EstatStatsDataParameter {
  LANG: "J" | "E"; // 言語
  STATS_DATA_ID: string; // 統計表ID
  DATA_FORMAT: "X" | "J"; // データ形式 (X: XML, J: JSON)
  START_POSITION?: number; // データ取得開始位置
  LIMIT?: number; // データ取得件数
  METAGET_FLG: "Y" | "N"; // メタ情報取得フラグ
  CNT_GET_FLG: "Y" | "N"; // データ件数取得フラグ
  EXPLANATION_GET_FLG: "Y" | "N"; // 解説情報取得フラグ
  ANNOTATION_GET_FLG: "Y" | "N"; // 注釈情報取得フラグ
  REPLACE_SP_CHARS: "0" | "1" | "2"; // 特殊文字の置換
  // 以下、絞り込み条件として使用されたパラメータが含まれる
  NARROWING_COND?: {
    [key: string]: string; // lvTab, cdTab, cdCat01等の絞り込み条件
  };
}

/**
 * e-STAT API統計データ本体
 *
 * 統計データの核心部分。メタ情報、分類情報、実際のデータ値を含む。
 * この構造から整形されたデータ（FormattedEstatData）が生成される。
 *
 * @example
 * ```typescript
 * const statisticalData: EstatStatisticalData = response.GET_STATS_DATA.STATISTICAL_DATA;
 * const tableInfo = statisticalData.TABLE_INF; // 統計表情報
 * const classInfo = statisticalData.CLASS_INF; // 分類情報
 * const dataInfo = statisticalData.DATA_INF;   // データ値
 * ```
 */
export interface EstatStatisticalData {
  RESULT_INF: EstatResultInfo;
  TABLE_INF: EstatTableInfo;
  CLASS_INF: EstatClassInfo;
  DATA_INF: EstatDataInfo;
  EXPLANATION?: EstatExplanation; // 解説情報（EXPLANATION_GET_FLG=Y時）
}

/**
 * e-STAT APIデータ件数情報
 *
 * 取得したデータの件数と位置情報。
 * ページネーションやデータの完全性確認に使用される。
 *
 * @example
 * ```typescript
 * const resultInfo: EstatResultInfo = statisticalData.RESULT_INF;
 * console.log(`総件数: ${resultInfo.TOTAL_NUMBER}`);
 * console.log(`取得範囲: ${resultInfo.FROM_NUMBER}-${resultInfo.TO_NUMBER}`);
 * ```
 */
export interface EstatResultInfo {
  TOTAL_NUMBER: number; // 総データ件数
  FROM_NUMBER: number; // データ開始位置（CNT_GET_FLG=Y時）
  TO_NUMBER: number; // データ終了位置（CNT_GET_FLG=Y時）
  NEXT_KEY?: number; // 次のデータ開始位置（継続データがある場合）
}

/**
 * e-STAT APIデータ情報
 *
 * 実際の統計データ値と注釈情報を含む。
 * データ値は各次元の組み合わせに対応する数値または特殊文字。
 *
 * @example
 * ```typescript
 * const dataInfo: EstatDataInfo = statisticalData.DATA_INF;
 * const values = Array.isArray(dataInfo.VALUE) ? dataInfo.VALUE : [dataInfo.VALUE];
 * const notes = dataInfo.NOTE ? (Array.isArray(dataInfo.NOTE) ? dataInfo.NOTE : [dataInfo.NOTE]) : [];
 * ```
 */
export interface EstatDataInfo {
  NOTE?: EstatNote | EstatNote[]; // 注釈（単一または配列）
  VALUE: EstatValue | EstatValue[]; // データ値（単一または配列）
}

/**
 * e-STAT API注釈情報
 *
 * データ値に付随する注釈記号とその説明。
 * 特殊な値（***, -, X等）の意味を説明する。
 *
 * @example
 * ```typescript
 * const note: EstatNote = {
 *   "@char": "***",
 *   $: "調査対象外"
 * };
 * ```
 */
export interface EstatNote {
  "@char": string; // 注釈記号
  $: string; // 注釈内容
}

/**
 * e-STAT APIデータ値
 *
 * 統計データの個別の値。各次元の組み合わせに対応する。
 * 表章項目は必須、その他の次元は統計表の構造に依存。
 *
 * @example
 * ```typescript
 * const value: EstatValue = {
 *   "@tab": "A1101",
 *   "@cat01": "A110101",
 *   "@area": "13",
 *   "@time": "2020",
 *   "@unit": "人",
 *   $: "14047594"
 * };
 * ```
 */
export interface EstatValue {
  "@tab": string; // 表章項目コード（必須）
  "@cat01"?: string; // 分類01コード
  "@cat02"?: string; // 分類02コード
  "@cat03"?: string; // 分類03コード
  "@cat04"?: string; // 分類04コード
  "@cat05"?: string; // 分類05コード
  "@cat06"?: string; // 分類06コード
  "@cat07"?: string; // 分類07コード
  "@cat08"?: string; // 分類08コード
  "@cat09"?: string; // 分類09コード
  "@cat10"?: string; // 分類10コード
  "@cat11"?: string; // 分類11コード
  "@cat12"?: string; // 分類12コード
  "@cat13"?: string; // 分類13コード
  "@cat14"?: string; // 分類14コード
  "@cat15"?: string; // 分類15コード
  "@area"?: string; // 地域コード
  "@time"?: string; // 時間軸コード
  "@unit"?: string; // 単位
  $: string; // 値（数値または特殊文字）
}

/**
 * e-STAT API解説情報
 *
 * 統計表の項目や概念の詳細な説明。
 * EXPLANATION_GET_FLG=Yの場合のみ取得される。
 *
 * @example
 * ```typescript
 * const explanation: EstatExplanation = statisticalData.EXPLANATION;
 * explanation.EXPLANATION_INF.forEach(exp => {
 *   console.log(`${exp.ITEM}: ${exp.EXPLANATION}`);
 * });
 * ```
 */
export interface EstatExplanation {
  EXPLANATION_INF: Array<{
    "@id": string; // 解説ID
    ITEM: string; // 項目名
    EXPLANATION: string; // 解説内容
  }>;
}

/**
 * e-STAT API getStatsData パラメータ
 *
 * 統計データ取得時に指定するパラメータ。
 * 絞り込み条件、取得範囲、出力オプションを含む。
 *
 * @example
 * ```typescript
 * const params: GetStatsDataParams = {
 *   appId: "your-app-id",
 *   statsDataId: "0000010101",
 *   cdCat01: "A1101",
 *   metaGetFlg: "Y",
 *   cntGetFlg: "N"
 * };
 * ```
 */
export interface GetStatsDataParams {
  // 必須パラメータ
  appId: string; // アプリケーションID
  statsDataId: string; // 統計表ID

  // 絞り込み条件（階層）
  lvTab?: string; // 表章項目の階層レベル
  lvCat01?: string; // 分類01の階層レベル
  lvCat02?: string; // 分類02の階層レベル
  lvCat03?: string; // 分類03の階層レベル
  lvCat04?: string; // 分類04の階層レベル
  lvCat05?: string; // 分類05の階層レベル
  lvCat06?: string; // 分類06の階層レベル
  lvCat07?: string; // 分類07の階層レベル
  lvCat08?: string; // 分類08の階層レベル
  lvCat09?: string; // 分類09の階層レベル
  lvCat10?: string; // 分類10の階層レベル
  lvCat11?: string; // 分類11の階層レベル
  lvCat12?: string; // 分類12の階層レベル
  lvCat13?: string; // 分類13の階層レベル
  lvCat14?: string; // 分類14の階層レベル
  lvCat15?: string; // 分類15の階層レベル
  lvArea?: string; // 地域の階層レベル
  lvTime?: string; // 時間軸の階層レベル

  // 絞り込み条件（コード）
  cdTab?: string; // 表章項目コード（カンマ区切り）
  cdCat01?: string; // 分類01コード（カンマ区切り）
  cdCat02?: string; // 分類02コード（カンマ区切り）
  cdCat03?: string; // 分類03コード（カンマ区切り）
  cdCat04?: string; // 分類04コード（カンマ区切り）
  cdCat05?: string; // 分類05コード（カンマ区切り）
  cdCat06?: string; // 分類06コード（カンマ区切り）
  cdCat07?: string; // 分類07コード（カンマ区切り）
  cdCat08?: string; // 分類08コード（カンマ区切り）
  cdCat09?: string; // 分類09コード（カンマ区切り）
  cdCat10?: string; // 分類10コード（カンマ区切り）
  cdCat11?: string; // 分類11コード（カンマ区切り）
  cdCat12?: string; // 分類12コード（カンマ区切り）
  cdCat13?: string; // 分類13コード（カンマ区切り）
  cdCat14?: string; // 分類14コード（カンマ区切り）
  cdCat15?: string; // 分類15コード（カンマ区切り）
  cdArea?: string; // 地域コード（カンマ区切り）
  cdTime?: string; // 時間軸コード（カンマ区切り）

  // 絞り込み条件（From-To）
  cdTimeFrom?: string; // 時間軸From
  cdTimeTo?: string; // 時間軸To

  // データ取得位置
  startPosition?: number; // データ開始位置（デフォルト:1）
  limit?: number; // データ取得件数（デフォルト:100000）

  // 出力オプション
  lang?: "J" | "E"; // 言語（デフォルト:J）
  metaGetFlg?: "Y" | "N"; // メタ情報取得（デフォルト:Y）
  cntGetFlg?: "Y" | "N"; // 件数取得（デフォルト:N）
  explanationGetFlg?: "Y" | "N"; // 解説情報取得（デフォルト:N）
  annotationGetFlg?: "Y" | "N"; // 注釈情報取得（デフォルト:N）
  replaceSpChars?: "0" | "1" | "2"; // 特殊文字置換（0:置換しない、1:NULL、2:0）
  sectionHeaderFlg?: "1" | "2"; // セクションヘッダ（1:有り、2:無し）
}

/**
 * CSV形式に変換されたメタデータ
 */
export interface EstatMetaCategoryData {
  stats_data_id: string;
  stat_name: string;
  title: string;
  cat01: string;
  item_name: string | null;
  unit: string | null;
}

/**
 * 整形された地域情報
 */
export interface FormattedArea {
  areaCode: string;
  areaName: string;
  level: string;
  parentCode?: string;
}

/**
 * 整形されたカテゴリ情報
 */
export interface FormattedCategory {
  categoryCode: string;
  categoryName: string;
  displayName: string;
  unit: string | null;
}

/**
 * 整形された年情報
 */
export interface FormattedYear {
  timeCode: string;
  timeName: string;
}

/**
 * 整形された値情報
 */
/**
 * 整形済み統計値
 *
 * 全ての分類軸をdimensionsで統一的に管理。
 * 後方互換性は考慮せず、クリーンな設計を優先。
 *
 * @example
 * ```typescript
 * const value: FormattedValue = {
 *   value: 14047594,
 *   unit: "人",
 *   dimensions: {
 *     area: { code: "13000", name: "東京都", level: "2" },
 *     time: { code: "2020", name: "2020年" },
 *     cat01: { code: "001", name: "総人口", unit: "人" }
 *   }
 * };
 * ```
 */
export interface FormattedValue {
  // 数値データ
  value: number | null; // null = 特殊文字（***, -, X, …）
  unit: string | null;

  // 全次元を統一的に管理
  dimensions: {
    // 必須次元
    area: {
      code: string;
      name: string;
      level?: string; // 階層レベル（"1", "2", "3"）
      parentCode?: string; // 親コード
    };
    time: {
      code: string;
      name: string;
    };

    // オプション次元（統計表により異なる）
    tab?: {
      code: string;
      name: string;
      unit?: string;
    };
    cat01?: { code: string; name: string; unit?: string };
    cat02?: { code: string; name: string; unit?: string };
    cat03?: { code: string; name: string; unit?: string };
    cat04?: { code: string; name: string; unit?: string };
    cat05?: { code: string; name: string; unit?: string };
    cat06?: { code: string; name: string; unit?: string };
    cat07?: { code: string; name: string; unit?: string };
    cat08?: { code: string; name: string; unit?: string };
    cat09?: { code: string; name: string; unit?: string };
    cat10?: { code: string; name: string; unit?: string };
    cat11?: { code: string; name: string; unit?: string };
    cat12?: { code: string; name: string; unit?: string };
    cat13?: { code: string; name: string; unit?: string };
    cat14?: { code: string; name: string; unit?: string };
    cat15?: { code: string; name: string; unit?: string };
  };

  // ランキング用（オプション）
  rank?: number;
}

/**
 * e-Stat値のパーサー
 *
 * 特殊文字（***, -, X, …）をnullに変換し、
 * 有効な数値のみを返す。
 *
 * @param raw - 生の値文字列
 * @returns 数値またはnull（特殊文字の場合）
 *
 * @example
 * ```typescript
 * parseEstatValue("1234.5")  // → 1234.5
 * parseEstatValue("***")     // → null
 * parseEstatValue("-")       // → null
 * parseEstatValue("X")       // → null
 * parseEstatValue("")        // → null
 * ```
 */
export function parseEstatValue(raw: string): number | null {
  if (!raw || raw.trim() === "") {
    return null;
  }

  const specialChars = ["***", "-", "X", "…"];
  if (specialChars.includes(raw.trim())) {
    return null;
  }

  const num = parseFloat(raw);
  return isNaN(num) ? null : num;
}

/**
 * データ注記
 */
export interface DataNote {
  char: string; // 注記文字（***, -, X など）
  description: string; // 説明
}

/**
 * 拡張版テーブル情報
 */
export interface FormattedTableInfo {
  // 既存フィールド
  id: string; // 統計表ID
  title: string; // 統計表題名
  statName: string; // 政府統計名
  govOrg: string; // 作成機関名
  statisticsName: string; // 提供統計名
  totalNumber: number; // 総データ件数
  fromNumber: number; // 開始番号
  toNumber: number; // 終了番号

  // 追加: 統計コード
  statCode: string; // 政府統計コード
  govOrgCode: string; // 作成機関コード

  // 追加: 日付情報（ネスト）
  dates: {
    surveyDate: number | string; // 調査年月
    openDate: string; // 公開日
    updatedDate: string; // 更新日（重要）
  };

  // 追加: データ特性（ネスト）
  characteristics: {
    cycle: string; // 提供周期（年度次、月次など）
    smallArea: number; // 小地域属性（0,1,2）
    collectArea: string; // 集計地域区分
  };

  // 追加: 分類情報（ネスト）
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

  // 追加: 提供統計名詳細
  statisticsNameSpec?: {
    tabulationCategory: string; // 集計カテゴリ
    tabulationSubCategory1?: string; // 集計サブカテゴリ1
    tabulationSubCategory2?: string; // 集計サブカテゴリ2
    tabulationSubCategory3?: string; // 集計サブカテゴリ3
  };

  // 追加: 説明
  description?: {
    tabulationCategoryExplanation?: string; // 集計カテゴリの説明
    general?: string; // 一般的な説明
  };
}

/**
 * 拡張版メタデータ
 */
export interface FormattedMetadata {
  // 処理情報
  processedAt: string; // 処理日時
  dataSource: "e-stat"; // データソース
  apiVersion?: string; // APIバージョン

  // データ統計
  stats: {
    totalRecords: number; // 総レコード数
    validValues: number; // 有効な値の数
    nullValues: number; // NULL値の数
    nullPercentage: number; // NULL値の割合
  };

  // データ範囲
  range?: {
    years: {
      min: string; // 最古の年度
      max: string; // 最新の年度
      count: number; // 年度数
    };
    areas: {
      count: number; // 地域数
      prefectureCount: number; // 都道府県数（level=2）
      hasNational: boolean; // 全国データの有無
    };
    categories: {
      count: number; // カテゴリ数
    };
  };

  // データ品質
  quality?: {
    completenessScore: number; // 完全性スコア（0-100）
    lastVerified?: string; // 最終検証日時
  };
}

/**
 * 整形されたe-STATデータ（拡張版）
 */
export interface FormattedEstatData {
  tableInfo: FormattedTableInfo;
  areas: FormattedArea[];
  categories: FormattedCategory[];
  years: FormattedYear[];
  values: FormattedValue[];
  metadata: FormattedMetadata;
  notes?: DataNote[];
}

/**
 * 統計データ一覧の項目
 */
export interface FormattedStatListItem {
  id: string;
  statName: string;
  title: string;
  govOrg: string;
  statisticsName: string;
  surveyDate: string;
  updatedDate: string;
  description?: string;
}
