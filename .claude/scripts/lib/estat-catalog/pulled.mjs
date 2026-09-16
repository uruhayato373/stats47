// pull 済みカタログ (`catalog.mjs pull` が置く .local/estat-catalog/) の読み取り。
// CLI の search と、索引を読む他スクリプトで同じ読み方を共有する。
import fs from "node:fs";
import path from "node:path";

/** manifest + index/surveys.json + index/tables/<statCode>.json を読み、全表行を 1 配列に連結する */
export function loadPulled(pullDir) {
  if (!fs.existsSync(path.join(pullDir, "manifest.json"))) {
    throw new Error(`${pullDir} が無い。先に 'catalog.mjs pull' を実行`);
  }
  const surveys = JSON.parse(fs.readFileSync(path.join(pullDir, "index/surveys.json"), "utf8"));
  const tables = [];
  for (const s of surveys) {
    const p = path.join(pullDir, `index/tables/${s.statCode}.json`);
    if (fs.existsSync(p)) tables.push(...JSON.parse(fs.readFileSync(p, "utf8")));
  }
  return { surveys, tables };
}
