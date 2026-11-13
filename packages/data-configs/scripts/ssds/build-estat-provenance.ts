/**
 * e-Stat param → survey の統一テーブル生成器 (Phase 8)。
 *
 * 前ターンの設計: 出典解決を kind/displayName 分岐ではなく **param 単一ルール**に統一する。
 *   resolveProvenanceByParams(statsDataId, cdCat01):
 *     - statsDataId ∈ SSDS テーブル → cdCat01 で ssds-provenance を引く (二次統計)
 *     - それ以外               → statsDataId で survey を引く (一次統計)
 *
 * 本スクリプトは registry の主出典・年別の補助出典から 2 つの索引を生成する:
 *   - ssdsTableIds:        SSDS displayName を持つ estat metric の distinct statsDataId
 *   - statsDataIdToSurvey: 非SSDS estat を statsDataId でグループ化し survey を確定
 *       (displayName→survey を建設時の入力に使うが、同一 statsDataId に正しく解決できる兄弟が
 *        1 つでもあれば、displayName が指標ラベルの metric も救済される → runtime は displayName 非依存)
 *
 * 出力: src/ssds/estat-provenance.generated.json
 * 実行: cd packages/data-configs && npx tsx scripts/ssds/build-estat-provenance.ts
 */

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { buildEstatProvenance } from "../../src/ssds/build-estat-provenance-index";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "../../src/ssds/estat-provenance.generated.json");

function main(): void {
  const { index, conflicts } = buildEstatProvenance();
  const { ssdsTableIds, statsDataIdToSurvey } = index;

  writeFileSync(
    OUT,
    JSON.stringify(index, null, 0),
    "utf-8",
  );

  console.log(`SSDS テーブル ID: ${ssdsTableIds.length}`);
  console.log(`statsDataId→survey: ${Object.keys(statsDataIdToSurvey).length} 件`);
  if (conflicts.length) {
    console.log(`\n⚠️ 1 statsDataId が複数 survey に割れた (consensus=最多を採用): ${conflicts.length}`);
    for (const c of conflicts.slice(0, 10)) console.log(`  ${c}`);
  } else {
    console.log("✓ statsDataId↔survey は 1:1 (競合なし)");
  }
}

main();
