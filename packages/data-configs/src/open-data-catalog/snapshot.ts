import type { OpenDatasetLicense } from "./types";

export interface OpenDataRawFile {
  readonly key: string;
  readonly url: string;
  readonly sha256: string;
  readonly bytes: number;
  readonly contentType: string;
  readonly retrievedAt: string;
}

export interface OpenDataSourceManifest {
  readonly schemaVersion: 1;
  readonly datasetId: string;
  readonly version: string;
  readonly sha256: string;
  readonly recipeSha256: string;
  readonly retrievedAt: string;
  readonly license: OpenDatasetLicense;
  readonly files: readonly OpenDataRawFile[];
}

export interface OpenDataSnapshotVersion extends OpenDataSourceManifest {
  readonly manifestKey: string;
  readonly manifestSha256: string;
  readonly bytes: number;
  /** Only a read-back verified R2 transfer may mark a version archived. */
  readonly status: "staged" | "archived";
}

export interface OpenDataSnapshot {
  readonly datasetId: string;
  readonly versions: readonly OpenDataSnapshotVersion[];
}
