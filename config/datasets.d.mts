export interface Dataset {
  id: string;
  path: string;
  kind: string;
  domain: string;
  target: string;
  description: string;
  retain?: string;
  planned?: boolean;
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
export declare const RETIRED: { from: string; to: string; since: string }[];
export declare function datasetPath(id: string): string;
export declare function datasetDir(id: string): string;
