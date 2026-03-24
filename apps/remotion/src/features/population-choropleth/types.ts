export interface PopulationRecord {
  areaCode: string;
  areaName: string;
  pop2025: number;
  pop2045: number;
  ratio: number;
}

export interface PrefectureData {
  prefCode: string;
  prefName: string;
  records: PopulationRecord[];
}

export interface CityPathInfo {
  path: string;
  fill: string;
  areaCode: string;
  areaName: string;
  ratio: number;
}
