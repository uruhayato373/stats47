/**
 * パックの固定データ (src/data/pack-snapshots/P-NN.json、git 管理外) が無ければ、テストの前に公開 R2 から作る。
 * 実データで検査するテスト (license-exclusion / delivery-integrity) が読む。CI の checkout には無いため、
 * 2026-10-13 に PR #1125 と develop の Unit Tests が null 参照で落ちた。全パックの作成は約 9 秒 (公開 URL の読み取りだけ)。
 * 手元に既にあるパックは作り直さない (検査の入力を勝手に更新しない)。
 */
import { existsSync } from "node:fs";
import { join } from "node:path";

export default async function setup(): Promise<void> {
  const [{ PACK_SNAPSHOT_DIR, buildPackSnapshots }, { PACKS }, { METRICS_REGISTRY }] = await Promise.all([
    import("../../src/data/pack-snapshot"),
    import("../../src/catalog/products/packs"),
    import("@stats47/data-configs"),
  ]);
  const missing = PACKS.filter((p) => p.rankingKeys.length > 0 && !existsSync(join(PACK_SNAPSHOT_DIR, `${p.id}.json`)));
  if (missing.length === 0) return;
  const results = await buildPackSnapshots(
    missing.map((p) => ({ id: p.id, title: p.name, rankingKeys: p.rankingKeys })),
    METRICS_REGISTRY as unknown as Record<string, Record<string, unknown>>,
  );
  const empty = results.filter((r) => r.built === 0).map((r) => r.packId);
  if (empty.length) throw new Error(`パックの固定データを作れなかった (公開 R2 から 0 指標): ${empty.join(", ")}`);
}
