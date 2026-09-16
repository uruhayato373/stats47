// pull 済みカタログ (`catalog.mjs pull` が置く .local/estat-catalog/) の読み取り。
// CLI の search と他スクリプト (estimate-city-data-size 等) で同じ読み方を共有する。
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

/** 指定 collectArea の現役表 (removedAt 無し) を getStatsList 要約と同じ 4 フィールドに絞る */
export function listTablesByCollectArea(tables, collectArea) {
  return tables
    .filter((t) => Number(t.collectArea) === Number(collectArea) && !t.removedAt)
    .map((t) => ({
      statsDataId: t.statsDataId,
      statName: t.statName ?? "",
      title: t.title ?? "",
      govOrg: t.govOrg ?? null,
    }));
}
