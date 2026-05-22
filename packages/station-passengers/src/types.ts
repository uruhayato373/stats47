/** 国土数値情報「駅別乗降客数」(S12) 可視化: 型定義 */

/** public/station-passengers/{NN}.json の 1 駅 */
export interface Station {
  /** 駅グループコード */
  code: string;
  name: string;
  line: string;
  operator: string;
  lat: number;
  lon: number;
  /** 年 (文字列) → 乗降客数 */
  counts: Record<string, number>;
}

/** public/station-passengers/{NN}.json の構造 */
export interface StationPassengerData {
  prefCode: string;
  prefName: string;
  dataset: string;
  source: string;
  /** データのある年 (昇順) */
  years: number[];
  stations: Station[];
}
