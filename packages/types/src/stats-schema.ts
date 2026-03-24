import { AreaType } from "./area";

/**
 * 統計データのスキーマ
 *
 * e-Stat APIやその他の統計データソースから取得した統計データの基本構造を表す。
 */
export interface StatsSchema {
    /** 地域タイプ（prefecture / city / national） */
    areaType?: AreaType;
    /** 地域コード（都道府県コードまたは市区町村コード） */
    areaCode: string;
    /** 地域名（都道府県名または市区町村名） */
    areaName: string;
    /** 年度コード（4桁、例: "2020"） */
    yearCode: string;
    /** 年度名（例: "2020年"） */
    yearName: string;
    /** カテゴリコード（統計項目を表すコード） */
    categoryCode: string;
    /** カテゴリ名（統計項目名） */
    categoryName: string;
    /** 統計値（数値） */
    value: number;
    /** 単位（例: "人", "千円", "%"） */
    unit: string;
  }