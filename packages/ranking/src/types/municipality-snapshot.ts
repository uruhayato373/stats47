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
  description: string;
  unit: string;
  latestYear: { yearCode: string; yearName: string };
  entityPolicyKey: string;
  entityCount: number;
  valueCount: number;
  excludedEntityCount: number;
  source: { name: string; url: string };
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
