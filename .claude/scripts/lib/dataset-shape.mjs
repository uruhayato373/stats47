/**
 * dataset-shape.mjs — 記録を書く前に、台帳 (config/datasets.mjs) が宣言した JSON Schema で形を確かめる
 * (2026-10-20 RECORD-SCHEMA-CONTRACT-01)。セッションのエージェントは記録から判断するので、形が崩れた記録を書かない。
 * 合わなければ書かずに例外を投げる。schema の宣言と実在は check-datasets.mjs が別に検査する。
 *
 * 台帳の schema は共通の型 (config/schema/common.schema.json) を $ref で参照する (2026-10-26)。schema を Ajv で
 * compile する箇所は addCommonSchema(ajv) を先に呼ぶ。コードで同じ形を正規表現で判定するときは commonPattern(name) を使い、
 * 型の定義を書き写さない (note の公開 URL の判定が 3 通りに分かれていた)。
 */
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv from "ajv";
import { DATASETS } from "../../../config/datasets.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const validators = new Map();

/** 共通の型の schema のパス (repo root 相対) */
export const COMMON_SCHEMA_PATH = "config/schema/common.schema.json";
/** @type {{ $id: string, $defs: Record<string, { pattern?: string }> }} */
export const COMMON_SCHEMA = JSON.parse(readFileSync(join(ROOT, COMMON_SCHEMA_PATH), "utf8"));

/**
 * Ajv に共通の型を登録する ($ref: "common.schema.json#/$defs/<name>" を解決できるようにする)。登録済みなら何もしない。
 * @param {import("ajv").Ajv} ajv
 */
export function addCommonSchema(ajv) {
  if (!ajv.getSchema(COMMON_SCHEMA.$id)) ajv.addSchema(COMMON_SCHEMA);
  return ajv;
}

/**
 * 共通の型の pattern から正規表現を作る。pattern を持たない型は例外
 * @param {string} name
 */
export function commonPattern(name) {
  const pattern = COMMON_SCHEMA.$defs[name]?.pattern;
  if (!pattern) throw new Error(`common.schema.json に pattern を持つ型 ${name} が無い`);
  return new RegExp(pattern);
}

/** stats47 の note 公開記事の URL */
export const NOTE_URL_PATTERN = commonPattern("noteUrl");

/**
 * id の行が宣言した schema で doc を検証する。合わなければ例外
 * @param {string} id
 * @param {unknown} doc
 * @param {{ root?: string }} [options]
 */
export function assertDatasetShape(id, doc, { root = ROOT } = {}) {
  if (!validators.has(id)) {
    const ds = DATASETS.find((d) => d.id === id);
    if (!ds?.schema) throw new Error(`dataset_schema_missing: ${id}`);
    const ajv = addCommonSchema(new Ajv({ allErrors: true }));
    validators.set(id, { ajv, validate: ajv.compile(JSON.parse(readFileSync(join(root, ds.schema), "utf8"))), schema: ds.schema });
  }
  const { ajv, validate, schema } = validators.get(id);
  if (!validate(doc)) {
    throw new Error(`dataset_shape_mismatch: ${id} が ${schema} に合わない: ${ajv.errorsText(validate.errors, { dataVar: "" }).slice(0, 300)}`);
  }
}
