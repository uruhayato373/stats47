/**
 * drop-invalid-norm-options.ts — denominator 系 metric config から不適切な
 * normalizationOptions (自 family の分母 type) を削除する (T3-RANKING-NORM-DATA-CLEAN-01)。
 *
 * 例: total-population の per_population (「人口10万人あたりの人口」)。
 * isBaseMetric() ガード導入以前の残存データを git TS SSOT から掃除する。
 *
 * Usage:
 *   npx tsx packages/ranking/src/scripts/drop-invalid-norm-options.ts            # dry-run (既定)
 *   npx tsx packages/ranking/src/scripts/drop-invalid-norm-options.ts --apply    # 書き込み
 *
 * 反映後の外部工程 (本スクリプトはやらない):
 *   R2 item.json への焼き込みは generate-ranking-items.ts → sync-snapshots (CI) の既存経路。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DENOMINATOR_KEYS } from "../utils/is-base-metric";
import {
  dropNormOptionsOfType,
  invalidNormTypeForKey,
} from "../utils/drop-invalid-norm-options-core";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const METRICS_DIR = path.resolve(__dirname, "../../../data-configs/src/metrics");
const apply = process.argv.includes("--apply");

let changedFiles = 0;
let totalDropped = 0;
for (const key of [...DENOMINATOR_KEYS].sort()) {
  const file = path.join(METRICS_DIR, `${key}.ts`);
  if (!fs.existsSync(file)) {
    console.log(`- ${key}: config なし (skip)`);
    continue;
  }
  const invalidType = invalidNormTypeForKey(key);
  if (!invalidType) {
    console.log(`- ${key}: family 対応 type なし (skip)`);
    continue;
  }
  const source = fs.readFileSync(file, "utf8");
  const result = dropNormOptionsOfType(source, invalidType);
  if (result.dropped === 0) {
    console.log(`- ${key}: ${invalidType} なし (clean)`);
    continue;
  }
  changedFiles++;
  totalDropped += result.dropped;
  console.log(
    `* ${key}: ${invalidType} を ${result.dropped} 件削除 (残 ${result.remaining} option)${apply ? " → 書き込み" : " [dry-run]"}`,
  );
  if (apply) fs.writeFileSync(file, result.source);
}

console.log(
  `\n${apply ? "[apply]" : "[dry-run]"} 対象 ${changedFiles} ファイル / 削除 ${totalDropped} option`,
);
if (!apply && changedFiles > 0) {
  console.log("書き込みは --apply を付けて再実行");
}
