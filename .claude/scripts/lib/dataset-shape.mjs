/**
 * dataset-shape.mjs — 記録を書く前に、台帳 (config/datasets.mjs) が宣言した JSON Schema で形を確かめる
 * (2026-10-20 RECORD-SCHEMA-CONTRACT-01)。セッションのエージェントは記録から判断するので、形が崩れた記録を書かない。
 * 合わなければ書かずに例外を投げる。schema の宣言と実在は check-datasets.mjs が別に検査する。
 */
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv from "ajv";
import { DATASETS } from "../../../config/datasets.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const validators = new Map();

/** id の行が宣言した schema で doc を検証する。合わなければ例外 */
export function assertDatasetShape(id, doc, { root = ROOT } = {}) {
  if (!validators.has(id)) {
    const ds = DATASETS.find((d) => d.id === id);
    if (!ds?.schema) throw new Error(`dataset_schema_missing: ${id}`);
    const ajv = new Ajv({ allErrors: true });
    validators.set(id, { ajv, validate: ajv.compile(JSON.parse(readFileSync(join(root, ds.schema), "utf8"))), schema: ds.schema });
  }
  const { ajv, validate, schema } = validators.get(id);
  if (!validate(doc)) {
    throw new Error(`dataset_shape_mismatch: ${id} が ${schema} に合わない: ${ajv.errorsText(validate.errors, { dataVar: "" }).slice(0, 300)}`);
  }
}
