/**
 * MLIT データディレクトリのパス解決
 *
 * packages/gis/data/mlit/ の絶対パスを、process.cwd() からワークスペースルートを検出して返す。
 */

import * as fs from "fs";
import * as path from "path";

let cachedDataDir: string | null = null;

/**
 * ワークスペースルートを検出し、packages/gis/data/mlit の絶対パスを返す
 */
export function findMlitDataDir(): string {
  if (cachedDataDir) return cachedDataDir;
  let dir = process.cwd();
  for (let i = 0; i < 10; i++) {
    const pkgPath = path.join(dir, "package.json");
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
      if (pkg.workspaces) {
        cachedDataDir = path.join(dir, "packages", "gis", "data", "mlit");
        return cachedDataDir;
      }
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error("ワークスペースルートが見つかりません");
}

/**
 * MLIT 都道府県 TopoJSON ファイルの絶対パスを返す
 */
export function getMlitPrefectureTopojsonPath(): string {
  return path.join(findMlitDataDir(), "prefecture.topojson");
}
