import type { DatasetRegistry } from "../../../config/datasets.mjs";

/** TS 側の正本 (REGISTRIES の 1 件) から ID の集合を読む。readText は repo root 相対で本文を返す。union を持つ registry は registries (REGISTRIES) が要る */
export declare function resolveRegistry(
  registry: DatasetRegistry,
  readText: (path: string) => string,
  registries?: Record<string, DatasetRegistry>,
): Set<string>;
export declare function matchesCondition(parent: unknown, cond: Record<string, unknown>): boolean;
export declare function selectPath(doc: unknown, path: string): { value: unknown; parent: unknown }[];
export declare function refValues(value: unknown, parse?: string): unknown[];
