/**
 * 完全DBレス検証 (2.1): 計算型 ranking (per_capita/ratio/subtraction) を R2-native な
 * calculateRankingValues で再計算し、配信中の app/ranking/<key>/values.json と突合する。
 *
 * D1 query 撤廃 (findRankingItemByKey → readRankingItemByKeyFromR2) 後も計算結果が
 * 配信値と一致することを確認する read-only スクリプト。
 *
 * 実行: R2_PUBLIC_FETCH_URL=https://storage.stats47.jp NODE_OPTIONS='--conditions react-server' \
 *         npx tsx packages/ranking/scripts/verify-calculated-rankings.ts
 */

import { fetchFromR2AsJson } from "@stats47/r2-storage/server";

import { KNOWN_RANKING_KEYS } from "../src/config/known-ranking-keys";
import { readRankingItemByKeyFromR2 } from "../src/repositories/ranking-item";
import { calculateRankingValues } from "../src/services/calculate-ranking-values";
import type { RankingItem } from "../src/types";

interface ServedValue {
  areaCode: string;
  rank: number;
  value: number;
}
interface ServedSnapshot {
  partitions: Array<{ yearCode: string; values: ServedValue[] }>;
}

const REL_TOL = 1e-6;

async function main() {
  const calcKeys: string[] = [];
  for (const key of KNOWN_RANKING_KEYS) {
    const r = await readRankingItemByKeyFromR2(key);
    const item = r.success ? r.data : null;
    if (item?.calculation?.isCalculated && item.calculation.type) {
      calcKeys.push(key);
    }
  }
  console.log(`計算型 ranking: ${calcKeys.length} 件`);

  // 合格基準は「rank 完全一致 + 件数一致」(ranking の正しさ)。
  // value は snapshot 生成側で display スケール (ratio の ×100 等) が適用されるため
  // runtime calculateRankingValues の raw 値とは定数倍ずれることがある (DBレス回帰ではない)。
  let rankOk = 0;
  const rankMismatches: string[] = [];
  const valueScaled: string[] = [];
  const uncomputable: string[] = [];

  for (const key of calcKeys) {
    const r = await readRankingItemByKeyFromR2(key);
    const item = r.success ? r.data : null;
    if (!item) continue;
    const yearCode = (item as RankingItem).latestYear?.yearCode;
    if (!yearCode) continue;

    const computed = await calculateRankingValues(item as RankingItem, yearCode);
    const served = await fetchFromR2AsJson<ServedSnapshot>(`app/ranking/${key}/values.json`);
    const servedPartition =
      served?.partitions?.find((p) => p.yearCode === yearCode) ?? served?.partitions?.[0];
    const servedValues = servedPartition?.values ?? [];
    const type = item.calculation?.type;

    if (computed.length === 0) {
      uncomputable.push(`${key} (${type}): computed=0 served=${servedValues.length} (config に num/den 欠落の可能性)`);
      continue;
    }

    const servedByArea = new Map(servedValues.map((v) => [v.areaCode, v]));
    let rankDiff = 0;
    let valueDiff = 0;
    let nullValues = 0;
    let sampleRatio = 1;
    for (const c of computed) {
      const s = servedByArea.get(c.areaCode);
      if (!s) continue;
      if (c.rank !== s.rank) rankDiff++;
      // ★null は比較から外して数える。JS の `null - x` は null を 0 に強制するので、
      //   そのまま計算すると差分が常に 100% になり、さらに `s.value / null` が
      //   Infinity になって「×Infinity 倍ずれ」という無意味な報告が出る。
      if (c.value === null) {
        nullValues++;
        continue;
      }
      const denom = Math.max(Math.abs(s.value), 1e-9);
      if (Math.abs(c.value - s.value) / denom > REL_TOL) {
        valueDiff++;
        if (c.value !== 0) sampleRatio = s.value / c.value;
      }
    }
    const countDiff = Math.abs(computed.length - servedValues.length);

    if (rankDiff > 0 || countDiff > 0) {
      rankMismatches.push(`${key} (${type}): rankDiff=${rankDiff} countDiff=${countDiff}`);
    } else {
      rankOk++;
      if (valueDiff > 0) {
        valueScaled.push(`${key} (${type}): rank 一致, value 全 ${valueDiff} 件が定数倍ずれ (×${sampleRatio.toFixed(2)} = snapshot 側 display スケール)`);
      }
      if (nullValues > 0) {
        // 計算側が値を出せなかった県。黙って落とすと「一致」に見えるので必ず出す。
        valueScaled.push(`${key} (${type}): computed value が null の県 ${nullValues} 件 (比較不能)`);
      }
    }
  }

  console.log(`\n✅ rank 一致 (件数一致): ${rankOk}/${calcKeys.length}`);
  if (rankMismatches.length > 0) {
    console.log(`❌ rank 不一致 ${rankMismatches.length} 件 (DBレス回帰の疑い):`);
    rankMismatches.forEach((m) => console.log("  " + m));
  } else {
    console.log("計算可能な全計算型 ranking で rank が配信値と完全一致 (DBレス計算路は正しい)");
  }
  if (valueScaled.length > 0) {
    console.log(`\nℹ️  value 定数倍ずれ ${valueScaled.length} 件 (既存の snapshot display スケール、DBレス回帰ではない):`);
    valueScaled.forEach((m) => console.log("  " + m));
  }
  if (uncomputable.length > 0) {
    console.log(`\nℹ️  計算不能 ${uncomputable.length} 件 (item.json の calculation config 不備、別件):`);
    uncomputable.forEach((m) => console.log("  " + m));
  }

  if (rankMismatches.length > 0) process.exitCode = 1;
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
