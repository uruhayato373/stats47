export interface Dataset {
  id: string;
  path: string;
  kind: string;
  domain: string;
  target: string;
  description: string;
  retain?: string;
  planned?: boolean;
  /** 形状契約 (JSON Schema) のパス */
  schema?: string;
  /** 正本を置く private R2 の prefix */
  r2State?: string;
}
/** TS 側の正本から ID を読む方法 (REGISTRIES の 1 件)。union は他の registry の ID を合わせる */
export interface DatasetRegistry {
  description: string;
  files?: string[];
  pattern?: string;
  between?: [string, string];
  union?: string[];
}
export declare const KINDS: Record<string, string>;
export declare const TARGETS: Record<string, { dir: string; label: string }>;
export declare const GOVERNED: RegExp[];
export declare const AGENT_STATE: Record<string, string>;
export declare const IGNORED_NAMES: Set<string>;
export declare const SLOTS: Record<string, string>;
export declare const IMAGE_ROOTS: RegExp[];
export declare const IMAGE_EXT: RegExp;
export declare const DATASETS: Dataset[];
export declare const REGISTRIES: Record<string, DatasetRegistry>;
export declare const REGISTRY_REFS: { from: string; to: string; key: string; severity?: "warn"; why?: string }[];
export declare const RETIRED: { from: string; to: string; since: string }[];
export declare function datasetPath(id: string): string;
export declare function datasetDir(id: string): string;
