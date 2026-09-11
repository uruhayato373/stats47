/** Lossless storage for the weekly quality audit; all tracked parts stay below 1 MiB. */
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

const PARTS = ["definitions", "observations", "lastGoodObservations"];
const sha256 = (body) => createHash("sha256").update(body).digest("hex");
const partPath = (filename, field) => filename.replace(/\.json$/, `.${field}.json`);

export function readThemeQualityState(filename) {
  const result = JSON.parse(fs.readFileSync(filename, "utf8"));
  if (result.schemaVersion !== 2) return result;
  const { files, ...state } = result;
  for (const field of PARTS) {
    const body = fs.readFileSync(partPath(filename, field));
    if (sha256(body) !== files?.[field]?.sha256) throw new Error(`Quality state checksum mismatch: ${field}`);
    state[field] = JSON.parse(body);
    if (!Array.isArray(state[field]) || state[field].length !== files[field].count) throw new Error(`Quality state count mismatch: ${field}`);
  }
  return { ...state, schemaVersion: 1 };
}

export function writeThemeQualityState(filename, result) {
  const state = { ...result, schemaVersion: 2, files: {} };
  const outputs = [];
  for (const field of PARTS) {
    if (!Array.isArray(result[field])) throw new Error(`Quality state array missing: ${field}`);
    const body = `${JSON.stringify(result[field])}\n`;
    const target = partPath(filename, field);
    state.files[field] = { path: path.basename(target), sha256: sha256(body), count: result[field].length };
    delete state[field];
    outputs.push([target, body]);
  }
  outputs.push([filename, `${JSON.stringify(state)}\n`]);
  // Reject the complete write before touching the previous baseline if any part is too large.
  for (const [target, body] of outputs) {
    if (Buffer.byteLength(body) > 1_048_576) throw new Error(`Quality state exceeds 1 MiB: ${target}`);
  }
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  for (const [target, body] of outputs) {
    fs.writeFileSync(`${target}.tmp`, body);
    fs.renameSync(`${target}.tmp`, target);
  }
}
