/** テーマの台帳ファイル (カタログが 1 ファイルを 1 行で持つもの) の絶対パスを、カタログの id から引く。 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { datasetPath } from "../../../config/datasets.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

/**
 * STATE_DIR (fixture テスト用の上書き) があれば、その中の同じファイル名を指す。
 * @param {string} id 例: "themes.portfolio"
 * @returns {string}
 */
export function themeStatePath(id) {
  const rel = datasetPath(id);
  return process.env.STATE_DIR ? path.join(process.env.STATE_DIR, path.basename(rel)) : path.join(PROJECT_ROOT, rel);
}
