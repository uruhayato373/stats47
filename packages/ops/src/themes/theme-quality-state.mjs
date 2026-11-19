/**
 * Lossless storage for the weekly quality audit; every tracked file stays below 1 MiB.
 * A part that outgrows the limit is split into numbered shards (quality.<part>.json,
 * quality.<part>.2.json, …) instead of refusing the write. 2026-10-05 〜 11-13 の間、観測が 1 MiB を
 * 超えて書き込みを拒否し続け、全テーマの品質が「不明」のままになった (THEME-PAGE-REVIEW-01)。
 */
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

const PARTS = ["definitions", "observations", "lastGoodObservations"];
const MAX_FILE_BYTES = 1_048_576;
const sha256 = (body) => createHash("sha256").update(body).digest("hex");
const partPath = (filename, field, shard = 1) =>
  filename.replace(/\.json$/, shard === 1 ? `.${field}.json` : `.${field}.${shard}.json`);

function readShard(filename, field, entry, shard) {
  const body = fs.readFileSync(partPath(filename, field, shard));
  if (sha256(body) !== entry?.sha256) throw new Error(`Quality state checksum mismatch: ${field}`);
  const rows = JSON.parse(body);
  if (!Array.isArray(rows) || rows.length !== entry.count) throw new Error(`Quality state count mismatch: ${field}`);
  return rows;
}

export function readThemeQualityState(filename) {
  const result = JSON.parse(fs.readFileSync(filename, "utf8"));
  if (result.schemaVersion !== 2) return result;
  const { files, ...state } = result;
  for (const field of PARTS) {
    const entry = files?.[field];
    state[field] = entry?.shards
      ? entry.shards.flatMap((shard, i) => readShard(filename, field, shard, i + 1))
      : readShard(filename, field, entry, 1);
    if (state[field].length !== entry.count) throw new Error(`Quality state count mismatch: ${field}`);
  }
  return { ...state, schemaVersion: 1 };
}

/** 行の順を変えずに、各ファイルが上限に収まるよう分ける。1 行で上限を超える場合だけ拒否する。 */
function splitRows(rows, target) {
  const shards = [];
  let current = [];
  let bytes = 3; // "[" + "]" + "\n"
  for (const row of rows) {
    const size = Buffer.byteLength(JSON.stringify(row)) + 1; // 区切りの ","
    if (size + 3 > MAX_FILE_BYTES) throw new Error(`Quality state exceeds 1 MiB: ${target}`);
    if (current.length > 0 && bytes + size > MAX_FILE_BYTES) {
      shards.push(current);
      current = [];
      bytes = 3;
    }
    current.push(row);
    bytes += size;
  }
  shards.push(current);
  return shards;
}

export function writeThemeQualityState(filename, result) {
  const state = { ...result, schemaVersion: 2, files: {} };
  const outputs = [];
  const stale = [];
  for (const field of PARTS) {
    if (!Array.isArray(result[field])) throw new Error(`Quality state array missing: ${field}`);
    const shards = splitRows(result[field], partPath(filename, field)).map((rows, i) => {
      const body = `${JSON.stringify(rows)}\n`;
      const target = partPath(filename, field, i + 1);
      outputs.push([target, body]);
      return { path: path.basename(target), sha256: sha256(body), count: rows.length };
    });
    // 1 ファイルに収まる間は従来と同じ形 (path・sha256・count) のまま書く
    state.files[field] = shards.length === 1 ? shards[0] : { count: result[field].length, shards };
    delete state[field];
    for (let n = shards.length + 1; fs.existsSync(partPath(filename, field, n)); n += 1) stale.push(partPath(filename, field, n));
  }
  outputs.push([filename, `${JSON.stringify(state)}\n`]);
  // Reject the complete write before touching the previous baseline if any file is too large.
  for (const [target, body] of outputs) {
    if (Buffer.byteLength(body) > MAX_FILE_BYTES) throw new Error(`Quality state exceeds 1 MiB: ${target}`);
  }
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  for (const [target, body] of outputs) {
    fs.writeFileSync(`${target}.tmp`, body);
    fs.renameSync(`${target}.tmp`, target);
  }
  for (const target of stale) fs.unlinkSync(target);
}
