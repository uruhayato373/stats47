/**
 * e-Stat統計表リストユーティリティ関数
 * 責務: 共通的な処理とヘルパー関数
 */

import {
    AdvancedStatsListSearchOptions,
    STATS_FIELDS,
    StatsFieldCode,
} from "../types";

/**
 * 統計分野コード情報マップ
 */
export { STATS_FIELDS };

/**
 * 日付フォーマット関数
 *
 * @param date - 日付文字列（YYYYMM形式）
 * @returns フォーマットされた日付文字列
 */
export function formatSurveyDate(date: string): string {
  if (!date || date.length !== 6) {
    return date;
  }

  const year = date.substring(0, 4);
  const month = date.substring(4, 6);

  return `${year}年${month}月`;
}

/**
 * 公開日フォーマット関数
 *
 * @param date - 日付文字列（YYYY-MM-DD形式）
 * @returns フォーマットされた日付文字列
 */
export function formatOpenDate(date: string): string {
  if (!date) {
    return date;
  }

  try {
    const parsedDate = new Date(date);
    return parsedDate.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return date;
  }
}

/**
 * 統計表IDのバリデーション
 *
 * @param id - 統計表ID
 * @returns 有効なIDかどうか
 */
export function isValidTableId(id: string): boolean {
  // 10桁の数字かどうかチェック
  return /^\d{10}$/.test(id);
}

/**
 * 政府統計コードのバリデーション
 *
 * @param code - 政府統計コード
 * @returns 有効なコードかどうか
 */
export function isValidStatsCode(code: string): boolean {
  // 5桁または8桁の数字かどうかチェック
  return /^\d{5}$|^\d{8}$/.test(code);
}

/**
 * 統計分野コードのバリデーション
 *
 * @param code - 統計分野コード
 * @returns 有効なコードかどうか
 */
export function isValidStatsFieldCode(code: string): code is StatsFieldCode {
  return Object.keys(STATS_FIELDS).includes(code);
}

/**
 * 検索条件をURLパラメータに変換
 *
 * @param options - 検索オプション
 * @returns URLSearchParams
 */
export function searchOptionsToUrlParams(
  options: AdvancedStatsListSearchOptions
): URLSearchParams {
  const params = new URLSearchParams();

  if (options.searchWord) {
    params.set("searchWord", options.searchWord);
  }
  if (options.searchKind) {
    params.set("searchKind", options.searchKind);
  }
  if (options.statsField) {
    params.set("statsField", options.statsField);
  }
  if (options.statsCode) {
    params.set("statsCode", options.statsCode);
  }
  if (options.collectArea) {
    params.set("collectArea", options.collectArea);
  }
  if (options.surveyYears) {
    params.set("surveyYears", options.surveyYears);
  }
  if (options.openYears) {
    params.set("openYears", options.openYears);
  }
  if (options.updatedDate) {
    params.set("updatedDate", options.updatedDate);
  }
  if (options.includeExplanation) {
    params.set("includeExplanation", "true");
  }
  if (options.cycleFilter && options.cycleFilter.length > 0) {
    params.set("cycleFilter", options.cycleFilter.join(","));
  }
  if (options.dateRangeFilter?.from) {
    params.set("dateFrom", options.dateRangeFilter.from);
  }
  if (options.dateRangeFilter?.to) {
    params.set("dateTo", options.dateRangeFilter.to);
  }
  if (options.sortBy) {
    params.set("sortBy", options.sortBy);
  }
  if (options.sortOrder) {
    params.set("sortOrder", options.sortOrder);
  }
  if (options.limit) {
    params.set("limit", options.limit.toString());
  }
  if (options.startPosition) {
    params.set("startPosition", options.startPosition.toString());
  }

  return params;
}

/**
 * URLパラメータから検索条件を復元
 *
 * @param params - URLSearchParams
 * @returns 検索オプション
 */
export function urlParamsToSearchOptions(
  params: URLSearchParams
): AdvancedStatsListSearchOptions {
  const options: AdvancedStatsListSearchOptions = {};

  const searchWord = params.get("searchWord");
  if (searchWord) {
    options.searchWord = searchWord;
  }

  const searchKind = params.get("searchKind");
  if (searchKind === "1" || searchKind === "2") {
    options.searchKind = searchKind;
  }

  const statsField = params.get("statsField");
  if (statsField && isValidStatsFieldCode(statsField)) {
    options.statsField = statsField;
  }

  const statsCode = params.get("statsCode");
  if (statsCode) {
    options.statsCode = statsCode;
  }

  const collectArea = params.get("collectArea");
  if (collectArea === "1" || collectArea === "2" || collectArea === "3") {
    options.collectArea = collectArea;
  }

  const surveyYears = params.get("surveyYears");
  if (surveyYears) {
    options.surveyYears = surveyYears;
  }

  const openYears = params.get("openYears");
  if (openYears) {
    options.openYears = openYears;
  }

  const updatedDate = params.get("updatedDate");
  if (updatedDate) {
    options.updatedDate = updatedDate;
  }

  const includeExplanation = params.get("includeExplanation");
  if (includeExplanation === "true") {
    options.includeExplanation = true;
  }

  const cycleFilter = params.get("cycleFilter");
  if (cycleFilter) {
    options.cycleFilter = cycleFilter.split(",");
  }

  const dateFrom = params.get("dateFrom");
  const dateTo = params.get("dateTo");
  if (dateFrom || dateTo) {
    options.dateRangeFilter = {
      from: dateFrom || undefined,
      to: dateTo || undefined,
    };
  }

  const sortBy = params.get("sortBy");
  if (
    sortBy &&
    ["surveyDate", "openDate", "updatedDate", "statName"].includes(sortBy)
  ) {
    options.sortBy = sortBy as
      | "surveyDate"
      | "openDate"
      | "updatedDate"
      | "statName";
  }

  const sortOrder = params.get("sortOrder");
  if (sortOrder === "asc" || sortOrder === "desc") {
    options.sortOrder = sortOrder;
  }

  const limit = params.get("limit");
  if (limit) {
    const limitNum = parseInt(limit, 10);
    if (!isNaN(limitNum)) {
      options.limit = limitNum;
    }
  }

  const startPosition = params.get("startPosition");
  if (startPosition) {
    const startNum = parseInt(startPosition, 10);
    if (!isNaN(startNum)) {
      options.startPosition = startNum;
    }
  }

  return options;
}

/**
 * 統計分野コードから名称を取得
 *
 * @param code - 統計分野コード
 * @returns 分野名称
 */
export function getStatsFieldName(code: StatsFieldCode): string {
  return STATS_FIELDS[code]?.name || "不明";
}

/**
 * 統計分野コードからアイコンを取得
 *
 * @param code - 統計分野コード
 * @returns アイコン文字列
 */
export function getStatsFieldIcon(code: StatsFieldCode): string {
  return STATS_FIELDS[code]?.icon || "📊";
}

/**
 * 日付範囲のバリデーション
 *
 * @param from - 開始日（YYYYMM形式）
 * @param to - 終了日（YYYYMM形式）
 * @returns 有効な範囲かどうか
 */
export function isValidDateRange(from: string, to: string): boolean {
  if (!from || !to) {
    return true; // 片方だけの場合は有効
  }

  if (from.length !== 6 || to.length !== 6) {
    return false;
  }

  return from <= to;
}

/**
 * 検索キーワードの正規化
 *
 * @param keyword - 検索キーワード
 * @returns 正規化されたキーワード
 */
export function normalizeSearchKeyword(keyword: string): string {
  return keyword
    .trim()
    .replace(/\s+/g, " ") // 複数のスペースを1つに
    .replace(/[　]+/g, " "); // 全角スペースを半角に
}

/**
 * 統計表タイトルの省略表示
 *
 * @param title - 統計表タイトル
 * @param maxLength - 最大文字数（デフォルト: 50）
 * @returns 省略されたタイトル
 */
export function truncateTitle(title: string, maxLength: number = 50): string {
  if (title.length <= maxLength) {
    return title;
  }

  return title.substring(0, maxLength) + "...";
}

/**
 * 統計表の更新頻度を判定
 *
 * @param cycle - 周期文字列
 * @returns 更新頻度の説明
 */
export function getUpdateFrequency(cycle: string): string {
  switch (cycle) {
    case "年次":
      return "年1回";
    case "月次":
      return "月1回";
    case "四半期":
      return "四半期1回";
    case "週次":
      return "週1回";
    case "日次":
      return "日1回";
    case "-":
      return "不定期";
    default:
      return cycle || "不明";
  }
}

/**
 * 集計地域区分の説明を取得
 *
 * @param collectArea - 集計地域区分コード
 * @returns 地域区分の説明
 */
export function getCollectAreaDescription(
  collectArea: "1" | "2" | "3"
): string {
  switch (collectArea) {
    case "1":
      return "全国";
    case "2":
      return "都道府県";
    case "3":
      return "市区町村";
    default:
      return "不明";
  }
}

/**
 * 小地域フラグの説明を取得
 *
 * @param smallArea - 小地域フラグ
 * @returns 小地域の説明
 */
export function getSmallAreaDescription(smallArea: "0" | "1" | "2"): string {
  switch (smallArea) {
    case "0":
      return "なし";
    case "1":
      return "あり";
    case "2":
      return "一部あり";
    default:
      return "不明";
  }
}
