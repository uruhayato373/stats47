/**
 * 最新の生 PSI (psi-batch-<ts>.json) を選ぶ共通部品。読み手は psi-threshold-check / psi-update-digest /
 * search-growth の sources。
 *
 * 置き場は git 管理外の data/psi/live/ (datasetDir("psi.batch"))。CI の psi job は fetch-psi-audit.mjs が
 * ここへ直接書いた生 JSON をその場で読むので、閾値アラートの経路は R2 を通らない。それ以外の場所
 * (手元・別 job) は `npm run state:pull -- psi` で R2 state/psi/ から取る。`--latest` で取ると latest.json だけが
 * 入るため、名前の新しい psi-batch より latest.json の生成時刻が新しければ latest.json を選ぶ。
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const BATCH_RE = /^psi-batch-(.+)\.json$/;
const LATEST_FILE = "latest.json";

/** fetch-psi-audit.mjs のファイル名と同じ形 (秒まで・記号は -) に揃える */
const toStamp = (iso) => String(iso).replace(/[:.]/g, "-").slice(0, 19);

/** @param {string} dir @returns {string | null} */
export function findLatestPsiBatch(dir) {
  if (!existsSync(dir)) return null;
  const names = readdirSync(dir);
  const newestBatch = names.filter((name) => BATCH_RE.test(name)).sort().at(-1) ?? null;
  if (!names.includes(LATEST_FILE)) return newestBatch ? join(dir, newestBatch) : null;
  if (!newestBatch) return join(dir, LATEST_FILE);
  const latestStamp = toStamp(JSON.parse(readFileSync(join(dir, LATEST_FILE), "utf8")).generated_at ?? "");
  const batchStamp = /** @type {RegExpExecArray} */ (BATCH_RE.exec(newestBatch))[1];
  return latestStamp > batchStamp ? join(dir, LATEST_FILE) : join(dir, newestBatch);
}

/** @param {string} dir */
export function loadLatestPsiBatch(dir) {
  const file = findLatestPsiBatch(dir);
  if (!file) throw new Error(`No psi-batch-*.json in ${dir} (手元では npm run state:pull -- psi --latest で取得する)`);
  const data = JSON.parse(readFileSync(file, "utf-8"));
  return { file, results: data.results || [], generated_at: data.generated_at };
}
