/**
 * geoshape データディレクトリのパス解決
 *
 * packages/gis/data/geoshape/ の絶対パスを、process.cwd() からワークスペースルートを検出して返す。
 */

import * as fs from "fs";
import * as path from "path";

let cachedDataDir: string | null = null;

/**
 * ワークスペースルートを検出し、packages/gis/data/geoshape の絶対パスを返す
 */
export function findGeoshapeDataDir(): string {
  if (cachedDataDir) return cachedDataDir;
  let dir = process.cwd();
  for (let i = 0; i < 10; i++) {
    const pkgPath = path.join(dir, "package.json");
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
      if (pkg.workspaces) {
        cachedDataDir = path.join(dir, "packages", "gis", "data", "geoshape");
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
 * 都道府県 TopoJSON ファイルの絶対パスを返す
 */
export function getPrefectureTopojsonPath(): string {
  return path.join(findGeoshapeDataDir(), "prefecture.topojson");
}

/**
 * 都道府県 SVG ディレクトリの絶対パスを返す
 */
export function getPrefectureSvgDir(): string {
  return path.join(findGeoshapeDataDir(), "svg");
}
