import type { DatasetRegistry } from "../../../config/datasets.mjs";

/** TS 側の正本 (REGISTRIES の 1 件) から ID の集合を読む。readText は repo root 相対で本文を返す */
export declare function resolveRegistry(registry: DatasetRegistry, readText: (path: string) => string): Set<string>;
export declare function selectPath(doc: unknown, path: string): { value: unknown; parent: unknown }[];
export declare function refValues(value: unknown, parse?: string): unknown[];
