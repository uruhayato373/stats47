import { AreaType } from "./area";

/**
 * 統計データのスキーマ
 *
 * observations テーブルの行と 1:1 対応。
 * 指標のタイトル（旧 categoryName）は metrics.title から別途取得する。
 */
export interface StatsSchema {
    /** 指標キー（metrics.key、旧 categoryCode） */
    metricKey: string;
    /** 地域タイプ（prefecture / city / national） */
    areaType?: AreaType;
    /** 地域コード（都道府県コードまたは市区町村コード） */
    areaCode: string;
    /** 地域名（都道府県名または市区町村名） */
    areaName: string;
    /** 年度コード（4桁、例: "2020"） */
    yearCode: string;
    /** 年度名（例: "2020年度" / "2020年"） */
    yearName: string;
    /** 統計値（null は未集計） */
    value: number | null;
    /** 単位（例: "人", "千円", "%"） */
    unit: string;
  }