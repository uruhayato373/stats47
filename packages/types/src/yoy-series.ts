export interface YoyRecord {
  areaCode: string;
  areaName: string;
  ratio: number;
  rawRatio: number;
}

export interface YoyFrame {
  year: number;
  yoy: YoyRecord[];
}

export interface YoyTimeseries {
  generatedAt: string;
  source: {
    file: string;
    origin: string;
    sourceGeneratedAt: string;
  };
  metricKey: string;
  yearRange: [number, number];
  movingAverageWindow: number;
  edgeHandling: string;
  maxAbs: number;
  prefectureCodes: string[];
  frames: YoyFrame[];
}
