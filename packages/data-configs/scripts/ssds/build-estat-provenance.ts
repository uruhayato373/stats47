/**
 * e-Stat param → survey の統一テーブル生成器 (Phase 8)。
 *
 * 前ターンの設計: 出典解決を kind/displayName 分岐ではなく **param 単一ルール**に統一する。
 *   resolveProvenanceByParams(statsDataId, cdCat01):
 *     - statsDataId ∈ SSDS テーブル → cdCat01 で ssds-provenance を引く (二次統計)
 *     - それ以外               → statsDataId で survey を引く (一次統計)
 *
 * 本スクリプトは registry から 2 つの索引を生成する:
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

import { METRICS_REGISTRY } from "../../src/registry";
import {
  DISPLAYNAME_TO_SURVEY,
  STATS_DATA_ID_TO_SURVEY_OVERRIDE,
} from "../../src/ssds/displayname-to-survey";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "../../src/ssds/estat-provenance.generated.json");
const SSDS = "社会・人口統計体系";

function main(): void {
  const ssdsTableIds = new Set<string>();
  // statsDataId → (survey id → {count, name}) (consensus 用)
  const tally = new Map<string, Map<string, { count: number; name: string }>>();

  for (const metric of Object.values(METRICS_REGISTRY)) {
    const s = metric.source;
    if (s.kind !== "estat" || !s.statsDataId) continue;
    if (s.displayName?.startsWith(SSDS)) {
      ssdsTableIds.add(s.statsDataId);
      continue;
    }
    // 非SSDS: displayName → survey を集計
    const surveyId = s.displayName ? DISPLAYNAME_TO_SURVEY[s.displayName] : undefined;
    if (!surveyId || !s.displayName) continue;
    const m = tally.get(s.statsDataId) ?? new Map();
    const cur = m.get(surveyId) ?? { count: 0, name: s.displayName };
    cur.count += 1;
    m.set(surveyId, cur);
    tally.set(s.statsDataId, m);
  }

  // consensus: statsDataId ごとに最多 survey を採用。競合は警告。
  // SSDS テーブルと重複する statsDataId は runtime で SSDS 優先になるため除外 (dead entry 防止)。
  const statsDataIdToSurvey: Record<string, { id: string; name: string }> = {};
  const conflicts: string[] = [];
  for (const [sdi, m] of tally) {
    if (ssdsTableIds.has(sdi)) continue;
    const sorted = [...m.entries()].sort((a, b) => b[1].count - a[1].count);
    statsDataIdToSurvey[sdi] = { id: sorted[0][0], name: sorted[0][1].name };
    if (sorted.length > 1) {
      conflicts.push(`${sdi}: ${sorted.map(([id, v]) => `${id}(${v.count})`).join(", ")}`);
    }
  }

  // ThemeCatalog など registry 外から直接参照する一次統計を明示的に補完する。
  // SSDS テーブルへの誤上書きは provenance 層の混在になるため fail-fast。
  for (const [sdi, survey] of Object.entries(STATS_DATA_ID_TO_SURVEY_OVERRIDE)) {
    if (ssdsTableIds.has(sdi)) {
      throw new Error(`statsDataId override が SSDS テーブルと競合しています: ${sdi}`);
    }
    statsDataIdToSurvey[sdi] = survey;
  }

  writeFileSync(
    OUT,
    JSON.stringify(
      { ssdsTableIds: [...ssdsTableIds].sort(), statsDataIdToSurvey },
      null,
      0,
    ),
    "utf-8",
  );

  console.log(`SSDS テーブル ID: ${ssdsTableIds.size}`);
  console.log(`statsDataId→survey: ${Object.keys(statsDataIdToSurvey).length} 件`);
  if (conflicts.length) {
    console.log(`\n⚠️ 1 statsDataId が複数 survey に割れた (consensus=最多を採用): ${conflicts.length}`);
    for (const c of conflicts.slice(0, 10)) console.log(`  ${c}`);
  } else {
    console.log("✓ statsDataId↔survey は 1:1 (競合なし)");
  }
}

main();
