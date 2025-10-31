/**
 * e-Stat メタ情報の型定義
 * 統計表レベル（stats_data_id）での管理に特化
 */
import type { AreaType } from "@/features/area";

import type {
  EstatClassInfo,
  EstatResult,
  EstatTableInfo,
} from "../../core/types/common";

/**
 * 統計表の基本情報
 *
 * extractTableInfo関数が返す統計表の基本情報を表す型。
 * e-Stat APIのTABLE_INFから抽出された情報を含む。
 *
 * @example
 * ```typescript
 * const tableInfo: TableInfo = extractTableInfo(metaInfo);
 * console.log(tableInfo.title); // "Ａ　人口・世帯"
 * console.log(tableInfo.tabulationCategory); // "都道府県データ"
 * ```
 */
export interface TableInfo {
  /** 統計表ID */
  id: string;
  /** 政府統計名 */
  statName: string;
  /** 作成機関 */
  organization: string;
  /** 提供統計名及び提供分類名 */
  statisticsName: string;
  /** 統計表題名 */
  title: string;
  /** 提供周期 */
  cycle: string;
  /** 調査年月 */
  surveyDate: string;
  /** 公開日 */
  openDate: string;
  /** 小地域属性 */
  smallArea: string;
  /** 集計地域区分 */
  collectArea: string;
  /** 大分類 */
  mainCategory: {
    code: string;
    name: string;
  };
  /** 小分類（オプション） */
  subCategory?: {
    code: string;
    name: string;
  };
  /** 総レコード数 */
  totalRecords: number;
  /** 更新日 */
  updatedDate: string;
  /** 集計区分（STATISTICS_NAME_SPEC.TABULATION_CATEGORY） */
  tabulationCategory?: string;
  /** 説明文（オプション） */
  explanation?: string;
}

/**
 * e-Statメタ情報エンティティ
 *
 * データベースに保存されるe-Statメタ情報の形式。
 * 統計表レベル（stats_data_id）での管理に特化した設計。
 *
 * @example
 * ```typescript
 * const metaInfo: EstatMetaInfo = {
 *   stats_data_id: "0000010101",
 *   stat_name: "社会・人口統計体系",
 *   title: "Ａ　人口・世帯",
 *   area_type: "prefecture",
 *   cycle: "年度次",
 *   survey_date: "2020",
 *   last_fetched_at: "2025-01-31T00:00:00Z",
 *   created_at: "2025-01-31T00:00:00Z",
 *   updated_at: "2025-01-31T00:00:00Z"
 * };
 * ```
 */
export interface EstatMetaInfo {
  /** 統計表ID（e-Statの統計表を一意に識別するID、例: "0000010101"） */
  stats_data_id: string;
  /** 政府統計名（例: "社会・人口統計体系"） */
  stat_name: string;
  /** 統計表のタイトル（例: "Ａ　人口・世帯"） */
  title: string;
  /** 地域レベル（'national': 全国, 'prefecture': 都道府県, 'city': 市区町村） */
  area_type: AreaType;
  /** 調査周期（例: "年度次", "月次", "年次"） */
  cycle?: string;
  /** 調査年月（例: "2020", "202001"） */
  survey_date?: string;
  /** 説明文（統計表の詳細説明、オプション） */
  description?: string;
  /** 最終取得日時（ISO 8601形式、e-Stat APIから最後に取得した日時） */
  last_fetched_at: string;
  /** 作成日時（ISO 8601形式、レコードが作成された日時） */
  created_at: string;
  /** 更新日時（ISO 8601形式、レコードが最後に更新された日時） */
  updated_at: string;
}
/**
 * e-Statメタ情報保存用入力データ
 *
 * データベースに保存するためのメタ情報の入力形式。
 * EstatMetaInfoから自動生成されるタイムスタンプ（created_at, updated_at, last_fetched_at）を除いた形式。
 *
 * @example
 * ```typescript
 * const input: SaveEstatMetaInfoInput = {
 *   stats_data_id: "0000010101",
 *   stat_name: "社会・人口統計体系",
 *   title: "Ａ　人口・世帯",
 *   area_type: "prefecture",
 *   cycle: "年度次"
 * };
 * ```
 */
export interface SaveEstatMetaInfoInput {
  /** 統計表ID */
  stats_data_id: string;
  /** 政府統計名 */
  stat_name: string;
  /** 統計表のタイトル */
  title: string;
  /** 地域レベル */
  area_type: AreaType;
  /** 調査周期 */
  cycle?: string;
  /** 調査年月 */
  survey_date?: string;
  /** 説明文 */
  description?: string;
}
/**
 * e-Statメタ情報検索結果
 *
 * メタ情報の検索結果を返す際に使用する形式。
 * 検索結果の配列、総件数、検索クエリ、実行日時を含む。
 *
 * @example
 * ```typescript
 * const result: EstatMetaInfoSearchResult = {
 *   items: [metaInfo1, metaInfo2],
 *   totalCount: 100,
 *   searchQuery: "人口",
 *   executedAt: "2025-01-31T00:00:00Z"
 * };
 * ```
 */
export interface EstatMetaInfoSearchResult {
  /** 検索結果のメタ情報配列 */
  items: EstatMetaInfo[];
  /** 検索条件に一致する総件数（ページネーション前の全件数） */
  totalCount: number;
  /** 検索クエリ（ユーザーが入力した検索文字列、オプション） */
  searchQuery?: string;
  /** 検索実行日時（ISO 8601形式） */
  executedAt: string;
}
/**
 * e-Statメタ情報サマリー
 *
 * データベース内のメタ情報の概要を表す形式。
 * 総エントリ数と最後の更新日時を含む。
 *
 * @example
 * ```typescript
 * const summary: EstatMetaInfoSummary = {
 *   totalEntries: 150,
 *   lastUpdated: "2025-01-31T00:00:00Z"
 * };
 * ```
 */
export interface EstatMetaInfoSummary {
  /** データベース内の総メタ情報エントリ数 */
  totalEntries: number;
  /** 最後に更新されたエントリの更新日時（ISO 8601形式、データが存在しない場合はnull） */
  lastUpdated: string | null;
}
/**
 * e-Statメタ情報一覧取得オプション
 *
 * メタ情報の一覧を取得する際のページネーションとソートオプション。
 *
 * @example
 * ```typescript
 * const options: EstatMetaInfoListOptions = {
 *   limit: 20,
 *   offset: 0,
 *   orderBy: "updated_at",
 *   orderDirection: "DESC"
 * };
 * ```
 */
export interface EstatMetaInfoListOptions {
  /** 取得件数（デフォルト: 20） */
  limit?: number;
  /** 取得開始位置（ページネーション用、デフォルト: 0） */
  offset?: number;
  /** ソート項目（'updated_at': 更新日時, 'stat_name': 統計名, 'title': タイトル） */
  orderBy?: "updated_at" | "stat_name" | "title";
  /** ソート方向（'ASC': 昇順, 'DESC': 降順、デフォルト: 'DESC'） */
  orderDirection?: "ASC" | "DESC";
}
/**
 * e-Statメタ情報検索オプション
 *
 * メタ情報を検索する際のページネーションと検索タイプオプション。
 *
 * @example
 * ```typescript
 * const options: EstatMetaInfoSearchOptions = {
 *   limit: 20,
 *   offset: 0,
 *   searchType: "full"
 * };
 * ```
 */
export interface EstatMetaInfoSearchOptions {
  /** 取得件数（デフォルト: 20） */
  limit?: number;
  /** 取得開始位置（ページネーション用、デフォルト: 0） */
  offset?: number;
  /**
   * 検索タイプ
   * - 'full': 全文検索（stat_name, title, descriptionのすべてを検索）
   * - 'stat_name': 政府統計名のみ検索
   * - 'title': タイトルのみ検索
   * - 'description': 説明文のみ検索
   */
  searchType?: "full" | "stat_name" | "title" | "description";
}

/**
 * e-Stat API メタ情報レスポンスの型定義
 *
 * e-Stat APIのGET_META_INFOエンドポイントのレスポンス形式。
 * 統計表の基本情報（TABLE_INF）と分類情報（CLASS_INF）を含む。
 *
 * この型はe-Stat APIから返される生のJSONレスポンスを表します。
 * 実際のAPIレスポンスは`data/mock/estat-api/meta-info/prefecture/0000010101.json`を参照してください。
 *
 * @example
 * ```typescript
 * // メタ情報の取得
 * const response: EstatMetaInfoResponse = await fetchMetaInfo("0000010101");
 *
 * // 統計表の基本情報へのアクセス
 * const tableInfo = response.GET_META_INFO.METADATA_INF.TABLE_INF;
 * console.log(tableInfo.TITLE.$); // "Ａ　人口・世帯"
 *
 * // 分類情報へのアクセス
 * const classInfo = response.GET_META_INFO.METADATA_INF.CLASS_INF;
 * const areaClass = classInfo.CLASS_OBJ.find(obj => obj["@id"] === "area");
 *
 * // API呼び出し結果の確認
 * if (response.GET_META_INFO.RESULT.STATUS === 0) {
 *   console.log("API呼び出し成功");
 * }
 * ```
 */
export interface EstatMetaInfoResponse {
  /** e-Stat APIのメタ情報取得レスポンスのルートオブジェクト */
  GET_META_INFO: {
    /**
     * API呼び出し結果
     * STATUS: 0（正常終了）または100以上（エラー）
     * ERROR_MSG: エラーメッセージ（正常時は "正常に終了しました。"）
     * DATE: 処理日時（ISO 8601形式）
     */
    RESULT: EstatResult;
    /**
     * APIリクエストパラメータ（リクエスト時に指定した値がそのまま返される）
     */
    PARAMETER: {
      /** 言語設定（"J": 日本語, "E": 英語） */
      LANG: string;
      /** 統計表ID（例: "0000010101"） */
      STATS_DATA_ID: string;
      /** データ形式（"J": 日本語形式, "E": 英語形式） */
      DATA_FORMAT: string;
    };
    /**
     * メタデータ情報
     * 統計表の詳細情報と分類情報を含む
     */
    METADATA_INF: {
      /** 統計表の基本情報（タイトル、統計名、作成機関、調査周期など） */
      TABLE_INF: EstatTableInfo;
      /** 分類情報（地域、時間、カテゴリなどの分類項目の定義） */
      CLASS_INF: EstatClassInfo;
    };
  };
}
