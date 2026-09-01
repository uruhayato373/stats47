export interface MunicipalityRankingValue {
  areaCode: string;
  areaName: string;
  prefectureCode: string;
  value: number;
  rank: number;
}

export interface MunicipalityRankingItemSnapshot {
  schemaVersion: 1;
  generatedAt: string;
  rankingKey: string;
  title: string;
  /**
   * 同名 title の metric (事業所数×業種、転入者数の日本人/総数系など) を区別する表示用の限定子。
   * generator が「published 集合内で title が衝突する場合だけ」焼き込む — 一意な title に
   * 「総数」等のノイズを付けないため。ページはこれが在るとき title/h1 に併記する。
   */
  subtitle?: string;
  description: string;
  unit: string;
  latestYear: { yearCode: string; yearName: string };
  entityPolicyKey: string;
  entityCount: number;
  valueCount: number;
  excludedEntityCount: number;
  source: { name: string; url: string };
  /**
   * 全国分布のビン (テーマ一覧カードのミニチャート用に焼き込む)。
   * builder が binMunicipalityValues (binCount 20・pref なし) から count 系だけを写す。
   * 旧 snapshot には無い (optional で後方互換)。
   */
  distribution?: MunicipalityItemDistributionBin[];
}

export interface MunicipalityItemDistributionBin {
  x0: number;
  x1: number;
  count: number;
  isOverflow: boolean;
  isUnderflow: boolean;
}

export interface MunicipalityRankingValuesSnapshot {
  schemaVersion: 1;
  generatedAt: string;
  rankingKey: string;
  yearCode: string;
  yearName: string;
  unit: string;
  count: number;
  values: MunicipalityRankingValue[];
}

export function municipalityRankingItemKeyPath(rankingKey: string): string {
  return `app/municipalities/ranking/${encodeURIComponent(rankingKey)}/item.json`;
}

export function municipalityRankingValuesKeyPath(rankingKey: string): string {
  return `app/municipalities/ranking/${encodeURIComponent(rankingKey)}/values.json`;
}
