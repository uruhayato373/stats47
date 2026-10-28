import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { generateTypeSchemas } from "../../../scripts/metric-schema";

/**
 * data/content の JSON Schema (手書き) が content/index.ts の型と同じ項目を持つことを固定する。
 * schema は pattern・minLength など型から作れない制約を持つので手書きのまま残し、項目名と必須だけを比べる。
 */

type Schema = { properties?: Record<string, Schema>; required?: string[]; items?: Schema };

const REPO_ROOT = resolve(__dirname, "../../../../..");
function itemSchema(file: string, listKey: string): Schema {
  const schema = JSON.parse(
    readFileSync(resolve(REPO_ROOT, `data/content/schema/${file}.schema.json`), "utf8"),
  ) as Schema;
  const items = schema.properties?.[listKey]?.items;
  if (!items) throw new Error(`${file}.schema.json に ${listKey}[] の要素定義が無い`);
  return items;
}

/** [schema ファイル, 一覧のキー, TS の型名] */
const PAIRS: Array<[string, string, string]> = [
  ["routes", "routes", "ContentRoute"],
  ["tags", "tags", "ContentTag"],
  ["pages", "pages", "ContentPage"],
];

const generated = generateTypeSchemas(
  "packages/data-configs/src/content/index.ts",
  PAIRS.map(([, , type]) => type),
) as Record<string, Schema>;

describe("content schema と TS 型の一致", () => {
  it.each(PAIRS)("%s.schema.json の要素が %s[] の %s と同じ項目を持つ", (file, listKey, type) => {
    const hand = itemSchema(file, listKey);
    expect(Object.keys(hand.properties ?? {}).sort()).toEqual(
      Object.keys(generated[type].properties ?? {}).sort(),
    );
    expect([...(hand.required ?? [])].sort()).toEqual([...(generated[type].required ?? [])].sort());
  });
});
