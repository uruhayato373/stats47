/**
 * ローカル R2 から KSJ TopoJSON を読み込む
 */

import * as fs from "node:fs";
import * as path from "node:path";
import type { TopoJSONTopology } from "@stats47/types";

/**
 * プロジェクトルートを検出
 */
function findProjectRoot(): string {
  let dir = __dirname;
  for (let i = 0; i < 10; i++) {
    if (fs.existsSync(path.join(dir, ".local"))) {
      return dir;
    }
    const pkgPath = path.join(dir, "package.json");
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
      if (pkg.workspaces || pkg.name === "stats47") {
        return dir;
      }
    }
    dir = path.dirname(dir);
  }
  throw new Error("Could not find project root");
}

export interface FetchKsjOptions {
  dataId: string;
  version: string;
  /** ファイル名指定（省略時はディレクトリ内の最初の .topojson） */
  filename?: string;
}

/**
 * ローカル R2 から KSJ TopoJSON を読み込む
 */
export function fetchKsjTopologyFromLocal(
  options: FetchKsjOptions
): TopoJSONTopology {
  const root = findProjectRoot();
  const dir = path.join(
    root,
    ".local/r2/gis/mlit-ksj",
    options.dataId,
    options.version
  );

  if (!fs.existsSync(dir)) {
    throw new Error(`KSJ data not found: ${dir}`);
  }

  let filePath: string;
  if (options.filename) {
    filePath = path.join(dir, options.filename);
  } else {
    // ディレクトリ内の最初の .topojson を使用
    const files = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith(".topojson"))
      .sort();
    if (files.length === 0) {
      throw new Error(`No .topojson files in ${dir}`);
    }
    filePath = path.join(dir, files[0]);
  }

  if (!fs.existsSync(filePath)) {
    throw new Error(`KSJ file not found: ${filePath}`);
  }

  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as TopoJSONTopology;
}

/**
 * 指定データセットの利用可能なファイル一覧
 */
export function listKsjFiles(
  dataId: string,
  version: string
): string[] {
  const root = findProjectRoot();
  const dir = path.join(
    root,
    ".local/r2/gis/mlit-ksj",
    dataId,
    version
  );

  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".topojson"))
    .sort();
}

/**
 * ダウンロード済みデータセット一覧
 */
export function listDownloadedDatasets(): Array<{
  dataId: string;
  version: string;
  files: string[];
}> {
  const root = findProjectRoot();
  const baseDir = path.join(root, ".local/r2/gis/mlit-ksj");

  if (!fs.existsSync(baseDir)) return [];

  const result: Array<{
    dataId: string;
    version: string;
    files: string[];
  }> = [];

  for (const dataId of fs.readdirSync(baseDir).sort()) {
    const dataDir = path.join(baseDir, dataId);
    if (!fs.statSync(dataDir).isDirectory()) continue;

    for (const version of fs.readdirSync(dataDir).sort()) {
      const versionDir = path.join(dataDir, version);
      if (!fs.statSync(versionDir).isDirectory()) continue;

      const files = fs
        .readdirSync(versionDir)
        .filter((f) => f.endsWith(".topojson"));
      if (files.length > 0) {
        result.push({ dataId, version, files });
      }
    }
  }

  return result;
}
