export type GeoAnalysisValueFormat =
  | "integer"
  | "decimal1"
  | "percent1"
  | "signedPercent1";

export interface GeoAnalysisMetricDefinition {
  readonly key: string;
  readonly label: string;
  readonly unit: string;
  readonly format: GeoAnalysisValueFormat;
  readonly description: string;
}

export interface GeoAnalysisSnapshotRow {
  readonly areaCode: string;
  readonly areaName: string;
  readonly rank: number;
  readonly values: Readonly<Record<string, number | null>>;
}

export interface GeoAnalysisSource {
  readonly name: string;
  readonly url: string;
  readonly datasetId: string;
  readonly version: string;
  readonly license: string;
}

export interface GeoAnalysisSnapshot {
  readonly schemaVersion: 1;
  readonly slug: string;
  readonly generatedAt: string;
  readonly dataVersion: string;
  readonly geography: "prefecture";
  readonly title: string;
  readonly question: string;
  readonly primaryMetricKey: string;
  readonly metrics: readonly GeoAnalysisMetricDefinition[];
  readonly rows: readonly GeoAnalysisSnapshotRow[];
  readonly summary: {
    readonly observationCount: number;
    readonly medianValue: number;
    readonly topAreaCodes: readonly string[];
    readonly bottomAreaCodes: readonly string[];
  };
  readonly method: readonly string[];
  readonly sources: readonly GeoAnalysisSource[];
  readonly caveats: readonly string[];
  readonly dataQuality: {
    readonly expectedAreas: 47;
    readonly actualAreas: number;
    readonly missingAreaCodes: readonly string[];
    readonly inputCounts: Readonly<Record<string, number>>;
    readonly coverageNote: string;
  };
}
