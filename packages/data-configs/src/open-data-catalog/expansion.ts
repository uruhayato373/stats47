export interface OpenDataExpansionEntry {
  readonly datasetId: string;
  readonly table: string;
  readonly metricKey: string;
}

export interface OpenDataExpansion {
  readonly entries: readonly OpenDataExpansionEntry[];
}
