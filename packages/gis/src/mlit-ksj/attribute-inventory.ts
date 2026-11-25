/**
 * 国土数値情報の取り込みが観測した属性名の記録 (GIS-ATTRIBUTE-LEDGER-01)。
 *
 * 取り込み (scripts/run-pipeline.ts・scripts/acquire-public-ksj.ts) が公式の GeoJSON から実際に読んだ属性名を、
 * 生成物 `data/geo/attribute-inventory.json` (台帳 `geo.ksj-attribute-inventory`・Schema 付き) に書く。
 * 属性の原典台帳 (`geo.ksj-attributes`・attributes.ts) が「公式が言う属性」で、こちらは「配られた実物にあった属性」。
 * 2 つを突き合わせて未整理の属性を数えるのは別の検査で、ここは観測を足していくだけ。
 *
 * 約束:
 * - 観測は足し算だけ (属性名・版の和集合)。取り込みの範囲 (県・メッシュ) が違っても、同じ地物の種類なら 1 行にまとまる
 * - 新しく足すものが無ければファイルを書き換えない (observedAt も動かさない。実行のたびの差分を作らない)
 * - 属性が 1 つも読めなかった観測は足さない (空の観測で「属性が無い」と記録しない)
 * - 生成物なので手で編集しない。パスは書き手が渡す (読み込み口は置き場の台帳の id で引く)
 */
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import * as path from "node:path";

import { streamGeoJsonFeatureBatches } from "./stream-geojson";

/** 地物の種類の語幹が取れないファイル (例: P04-22_13.geojson は語幹なし) の key */
export const UNNAMED_FEATURE_TYPE = "(unnamed)";

/** これ以上大きい GeoJSON は全体を文字列にせず、地物を流して読む */
export const INVENTORY_STREAM_THRESHOLD_BYTES = 64 * 1024 * 1024;

export interface ObservedAttributes {
  readonly dataId: string;
  /** 原典のファイル名の語幹 (<dataId>-<版>_<key>.geojson の key)。取れなければ UNNAMED_FEATURE_TYPE */
  readonly featureType: string;
  /** 観測した原典の版 (2 桁) */
  readonly version: string;
  /** 観測した属性名 (並びは問わない) */
  readonly attributes: readonly string[];
}

export interface InventoryFeatureType {
  versions: string[];
  attributes: string[];
  observedAt: string;
}

export interface AttributeInventory {
  schemaVersion: 1;
  datasets: Record<string, { featureTypes: Record<string, InventoryFeatureType> }>;
}

export const EMPTY_ATTRIBUTE_INVENTORY: AttributeInventory = { schemaVersion: 1, datasets: {} };

/** ZIP 内のファイル名から地物の種類の語幹を取る (attributes.ts の findKsjFeatureTypeForEntry と同じ規則) */
export function featureTypeOfEntry(entry: string): string {
  return /_([A-Za-z][A-Za-z0-9]*)\.geojson$/.exec(entry)?.[1] ?? UNNAMED_FEATURE_TYPE;
}

const sortedUnique = (values: Iterable<string>): string[] => [...new Set(values)].sort();

type PropertiesOf = { properties?: Record<string, unknown> | null };

/** 地物の properties が持つ属性名の和集合 */
export function collectAttributeNames(features: readonly PropertiesOf[]): string[] {
  const names = new Set<string>();
  for (const feature of features) for (const key of Object.keys(feature.properties ?? {})) names.add(key);
  return [...names].sort();
}

/** GeoJSON ファイル 1 つが持つ属性名を観測する。大きいファイルは地物を流して読む */
export async function observeGeoJsonFile(
  filePath: string,
  options: { dataId: string; version: string; streamThresholdBytes?: number },
): Promise<ObservedAttributes> {
  const threshold = options.streamThresholdBytes ?? INVENTORY_STREAM_THRESHOLD_BYTES;
  const names = new Set<string>();
  if (statSync(filePath).size >= threshold) {
    for await (const batch of streamGeoJsonFeatureBatches(filePath, { maxFeatures: 20_000, maxBytes: 24 * 1024 * 1024 })) {
      for (const name of collectAttributeNames(batch)) names.add(name);
    }
  } else {
    const parsed = JSON.parse(readFileSync(filePath, "utf8")) as { features?: PropertiesOf[] };
    for (const name of collectAttributeNames(parsed.features ?? [])) names.add(name);
  }
  return {
    dataId: options.dataId,
    featureType: featureTypeOfEntry(path.basename(filePath)),
    version: options.version,
    attributes: [...names].sort(),
  };
}

/**
 * 観測をまとめた記録へ足す (純関数。入力は変えない)。足すものが無ければ同じ内容を返し、observedAt も動かさない。
 * @param observedAt 観測した日 (YYYY-MM-DD)
 */
export function mergeObservations(
  inventory: AttributeInventory,
  observations: readonly ObservedAttributes[],
  observedAt: string,
): AttributeInventory {
  const next: AttributeInventory = structuredClone(inventory);
  for (const observation of observations) {
    if (observation.attributes.length === 0) continue;
    const dataset = (next.datasets[observation.dataId] ??= { featureTypes: {} });
    const current = dataset.featureTypes[observation.featureType];
    const attributes = sortedUnique([...(current?.attributes ?? []), ...observation.attributes]);
    const versions = sortedUnique([...(current?.versions ?? []), observation.version]);
    const changed =
      !current ||
      attributes.length !== current.attributes.length ||
      versions.length !== current.versions.length;
    dataset.featureTypes[observation.featureType] = { versions, attributes, observedAt: changed ? observedAt : current.observedAt };
  }
  return sortInventory(next);
}

function sortInventory(inventory: AttributeInventory): AttributeInventory {
  const datasets: AttributeInventory["datasets"] = {};
  for (const dataId of Object.keys(inventory.datasets).sort()) {
    const featureTypes: Record<string, InventoryFeatureType> = {};
    for (const key of Object.keys(inventory.datasets[dataId].featureTypes).sort()) {
      featureTypes[key] = inventory.datasets[dataId].featureTypes[key];
    }
    datasets[dataId] = { featureTypes };
  }
  return { schemaVersion: 1, datasets };
}

export function readAttributeInventory(inventoryPath: string): AttributeInventory {
  if (!existsSync(inventoryPath)) return structuredClone(EMPTY_ATTRIBUTE_INVENTORY);
  const parsed = JSON.parse(readFileSync(inventoryPath, "utf8")) as AttributeInventory;
  if (parsed.schemaVersion !== 1) throw new Error(`属性の観測記録の schemaVersion が 1 ではない: ${inventoryPath}`);
  return parsed;
}

/**
 * 観測を記録ファイルへ足す。内容が変わらなければ書かない。書いたら true。
 * @param observedAt 省略すると今日 (UTC の日付)
 */
export function recordObservedAttributes(
  inventoryPath: string,
  observations: readonly ObservedAttributes[],
  observedAt: string = new Date().toISOString().slice(0, 10),
): boolean {
  const before = readAttributeInventory(inventoryPath);
  const after = mergeObservations(before, observations, observedAt);
  const text = `${JSON.stringify(after, null, 2)}\n`;
  if (existsSync(inventoryPath) && readFileSync(inventoryPath, "utf8") === text) return false;
  if (!existsSync(inventoryPath) && Object.keys(after.datasets).length === 0) return false;
  mkdirSync(path.dirname(inventoryPath), { recursive: true });
  writeFileSync(inventoryPath, text, "utf8");
  return true;
}
