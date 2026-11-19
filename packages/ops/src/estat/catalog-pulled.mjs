// pull 済みカタログ (`catalog.mjs pull` が置く .local/estat-catalog/) の読み取り。
// CLI の search と、索引を読む他スクリプトで同じ読み方を共有する。
import fs from "node:fs";
import path from "node:path";

/** Read every generated metric shard; reject a missing, invalid or duplicate index. */
export function loadMetricLinkage(directory) {
  const shards = fs.readdirSync(directory).filter((name) => /^linkage-\d{3}\.json$/.test(name)).sort();
  if (shards.length === 0) throw new Error(`指標逆引き索引が無い: ${directory}`);
  const keys = new Set();
  return shards.flatMap((name) => {
    const shard = JSON.parse(fs.readFileSync(path.join(directory, name), "utf8"));
    if (shard.version !== 1 || !Array.isArray(shard.entries) || shard.entries.length === 0) throw new Error(`不正な指標逆引き索引: ${name}`);
    for (const entry of shard.entries) {
      if (typeof entry.metricKey !== "string" || keys.has(entry.metricKey) || !Array.isArray(entry.sources)) throw new Error(`重複または不正な指標ID: ${name}`);
      keys.add(entry.metricKey);
    }
    return shard.entries;
  });
}

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
