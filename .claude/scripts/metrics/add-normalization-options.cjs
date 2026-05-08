/**
 * metrics テーブルの calculation_config_json に normalizationOptions を一括追加する
 *
 * 対象: is_active = 1 かつ isCalculated が false/null の指標
 * 除外: 比率・すでに正規化済み・意味をなさない unit の指標
 *
 * 実行: node .claude/scripts/metrics/add-normalization-options.cjs [--dry-run]
 */

const path = require("path");
const Database = require("better-sqlite3");

const PROJECT_ROOT = path.resolve(__dirname, "../../..");
const DB_PATH = path.join(
  PROJECT_ROOT,
  ".local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite"
);

const isDryRun = process.argv.includes("--dry-run");

// 指標の unit から正規化後の表示 unit を生成する
function buildNormalizationOptions(metricUnit) {
  const u = metricUnit || "件";
  return [
    {
      type: "per_population",
      label: "人口10万人あたり",
      unit: `${u}/10万人`,
      scaleFactor: 100000,
      decimalPlaces: 1,
    },
    {
      type: "per_area",
      label: "面積100km²あたり",
      unit: `${u}/100km²`,
      scaleFactor: 100,
      decimalPlaces: 2,
    },
  ];
}

// 割り算が意味をなさない unit のパターン
// - 比率・割合: %, ％, ‰
// - すでに正規化済み: 人（人口10万対）
// - 比倍: 倍
// - 年齢・温度・期間（平均値）: 歳, ℃, 年, 日, 時間, 畳
// - ‐ (指数・特殊): ‐
// - すでに /unit 形式: kg/日, 台/12h, 円/m2, m3/日 etc.
const EXCLUDED_UNITS = new Set([
  "%",
  "％",
  "‰",
  "人（人口10万対）",
  "倍",
  "歳",
  "℃",
  "年",
  "日",
  "時間",
  "畳",
  "‐",
]);

function isExcludedUnit(unit) {
  if (!unit) return false;
  if (EXCLUDED_UNITS.has(unit)) return true;
  // /を含む単位（すでに正規化済み）
  if (unit.includes("/")) return true;
  return false;
}

function main() {
  const db = new Database(DB_PATH, { readonly: isDryRun });

  // 対象指標を取得
  const rows = db
    .prepare(
      `SELECT key, title, unit, calculation_config_json
       FROM metrics
       WHERE is_active = 1`
    )
    .all();

  let updated = 0;
  let skippedCalculated = 0;
  let skippedUnit = 0;
  let skippedAlreadyHas = 0;

  const updateStmt = isDryRun
    ? null
    : db.prepare(
        "UPDATE metrics SET calculation_config_json = ? WHERE key = ?"
      );

  for (const row of rows) {
    let config = {};
    if (row.calculation_config_json) {
      try {
        config = JSON.parse(row.calculation_config_json);
      } catch {
        config = {};
      }
    }

    // すでに isCalculated: true の指標は除外
    if (config.isCalculated === true) {
      skippedCalculated++;
      continue;
    }

    // 意味をなさない unit は除外
    if (isExcludedUnit(row.unit)) {
      skippedUnit++;
      if (isDryRun) {
        console.log(`[SKIP unit] ${row.key} (unit="${row.unit}")`);
      }
      continue;
    }

    // すでに normalizationOptions を持つ場合も再生成（unit修正のため上書き）
    // ただし denominatorKey がカスタム指定されている場合はスキップ（手動設定の優先）
    if (
      Array.isArray(config.normalizationOptions) &&
      config.normalizationOptions.some((o) => o.denominatorKey)
    ) {
      skippedAlreadyHas++;
      continue;
    }

    // normalizationOptions を追加（指標の unit を反映）
    const newConfig = {
      ...config,
      normalizationOptions: buildNormalizationOptions(row.unit),
    };

    if (isDryRun) {
      console.log(`[UPDATE] ${row.key} "${row.title}" (unit="${row.unit}")`);
    } else {
      updateStmt.run(JSON.stringify(newConfig), row.key);
    }
    updated++;
  }

  console.log("\n=== 結果 ===");
  console.log(`対象合計: ${rows.length}`);
  console.log(`更新${isDryRun ? "(予定)" : "済み"}: ${updated}`);
  console.log(`スキップ(isCalculated:true): ${skippedCalculated}`);
  console.log(`スキップ(unit除外): ${skippedUnit}`);
  console.log(`スキップ(normalizationOptions既存): ${skippedAlreadyHas}`);

  if (isDryRun) {
    console.log("\n[DRY RUN] 実際の更新は行われていません。--dry-run を外して実行してください。");
  } else {
    console.log("\n完了。/sync-snapshots で R2 スナップショットを再生成してください。");
  }
}

main();
