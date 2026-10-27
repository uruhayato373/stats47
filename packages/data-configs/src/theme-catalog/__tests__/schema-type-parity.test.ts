import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { generateTypeSchemas } from "../../../scripts/metric-schema";

/**
 * ThemeCatalog の JSON Schema (手書き) が TS 型 (正典) と同じ項目を持つことを固定する。
 *
 * schema は説明文・pattern など型から作れない制約を持つので手書きのまま残すが、
 * 「項目を足すときは両方を同じ差分で変える」(types.ts 冒頭) をコメントではなく検査で担保する。
 * 型は metric の schema 生成と同じ generateTypeSchemas で JSON Schema にしてから比べる。
 */

type Schema = {
  properties?: Record<string, Schema>;
  required?: string[];
  enum?: unknown[];
  items?: Schema;
  $ref?: string;
  anyOf?: Schema[];
  oneOf?: Schema[];
};

const REPO_ROOT = resolve(__dirname, "../../../../..");
const handwritten = JSON.parse(
  readFileSync(resolve(REPO_ROOT, "data/themes/schema/theme-catalog.schema.json"), "utf8"),
) as Schema & { definitions: Record<string, Schema> };

/** 手書き schema の定義名 → TS の型名 */
const PAIRS: Array<[string, string]> = [
  ["#", "ThemeCatalog"],
  ["selection", "MetricSelection"],
  ["metric", "CatalogMetric"],
  ["chart", "CatalogChart"],
  ["metricGroup", "CatalogMetricGroup"],
  ["section", "CatalogSection"],
  ["evidenceTopic", "CatalogEvidenceTopic"],
];

const generated = generateTypeSchemas(
  "packages/data-configs/src/theme-catalog/types.ts",
  PAIRS.map(([, type]) => type),
) as Record<string, Schema>;

function handwrittenDef(name: string): Schema {
  return name === "#" ? handwritten : handwritten.definitions[name];
}

function resolveRef(schema: Schema): Schema {
  if (!schema.$ref) return schema;
  const name = schema.$ref.replace("#/definitions/", "");
  return handwritten.definitions[name] ?? schema;
}

/** enum を持つ位置 (配列の要素を含む) を探す */
function enumOf(schema: Schema | undefined): unknown[] | undefined {
  if (!schema) return undefined;
  const target = resolveRef(schema);
  if (target.enum) return target.enum;
  if (target.items) return enumOf(target.items);
  return undefined;
}

describe("ThemeCatalog schema と TS 型の一致", () => {
  it.each(PAIRS)("%s の項目名が %s と一致する", (defName, typeName) => {
    const hand = handwrittenDef(defName);
    const fromType = generated[typeName];
    expect(Object.keys(hand.properties ?? {}).sort()).toEqual(
      Object.keys(fromType.properties ?? {}).sort(),
    );
  });

  it.each(PAIRS)("%s の必須項目が %s と一致する", (defName, typeName) => {
    const hand = handwrittenDef(defName);
    const fromType = generated[typeName];
    expect([...(hand.required ?? [])].sort()).toEqual([...(fromType.required ?? [])].sort());
  });

  it.each(PAIRS)("%s の選択肢 (enum) が %s と一致する", (defName, typeName) => {
    const hand = handwrittenDef(defName);
    const fromType = generated[typeName];
    for (const [prop, typeSchema] of Object.entries(fromType.properties ?? {})) {
      const typeEnum = enumOf(typeSchema);
      const handEnum = enumOf(hand.properties?.[prop]);
      if (!typeEnum || !handEnum) continue;
      expect([...handEnum].sort(), `${defName}.${prop}`).toEqual([...typeEnum].sort());
    }
  });
});
