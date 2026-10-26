/**
 * パックの固定データ (src/data/pack-snapshots/P-NN.json、git 管理外) が無ければ、テストの前に公開 R2 から作る。
 * 実データで検査するテスト (license-exclusion / delivery-integrity) が読む。CI の checkout には無いため、
 * 2026-10-13 に PR #1125 と develop の Unit Tests が null 参照で落ちた。全パックの作成は約 9 秒 (公開 URL の読み取りだけ)。
 * 手元に既にあるパックは作り直さない (検査の入力を勝手に更新しない)。古ければ作り直し方を警告する。
 *
 * 取得の失敗 (R2 の HTTP 失敗・接続失敗) で指標を飛ばしかけたら、何も書かずに止まる。2026-10-21 の develop-quality-gate
 * run 39594085606 で P-12 が 2,073 → 2,072 指標になり、件数を固定したテストが落ちた (PACK-SNAPSHOT-SKIP-GUARD-01)。
 * データの理由 (47 県そろいの年が無い・全県 null・registry 未登録) で飛ばした指標は今までどおり許し、件数だけを出す。
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { buildPackSnapshots as BuildPackSnapshots } from "../../src/data/pack-snapshot";

/** 手元の固定データがこの日数より古ければ警告する */
export const PACK_SNAPSHOT_STALE_DAYS = 14;
const DAY_MS = 86_400_000;

type BuildOptions = NonNullable<Parameters<typeof BuildPackSnapshots>[2]>;

export interface EnsurePackSnapshotsInput {
  readonly packs: readonly { id: string; title: string; rankingKeys: readonly string[] }[];
  readonly registry: Record<string, Record<string, unknown>>;
  readonly dir: string;
  readonly build: typeof BuildPackSnapshots;
  readonly buildOptions?: BuildOptions;
  readonly now?: Date;
  readonly log?: (line: string) => void;
}

/** 無いパックを作り、古いパックを警告する。取得の失敗があれば buildPackSnapshots が書かずに投げる。 */
export async function ensurePackSnapshots(input: EnsurePackSnapshotsInput): Promise<void> {
  const log = input.log ?? ((line: string) => console.warn(line));
  const now = input.now ?? new Date();
  const missing = [];
  for (const pack of input.packs) {
    const path = join(input.dir, `${pack.id}.json`);
    if (!existsSync(path)) {
      missing.push(pack);
      continue;
    }
    const generatedAt = Date.parse(String(JSON.parse(readFileSync(path, "utf8")).generatedAt ?? ""));
    const ageDays = Number.isFinite(generatedAt) ? Math.floor((now.getTime() - generatedAt) / DAY_MS) : null;
    if (ageDays === null || ageDays > PACK_SNAPSHOT_STALE_DAYS) {
      log(
        `[pack-snapshots] ${pack.id} の固定データは ${ageDays === null ? "作成日不明" : `${ageDays} 日前`}に作られた` +
          ` (CI は毎回作り直す)。作り直す: npx tsx packages/product-factory/src/data/pack-snapshot.ts --id ${pack.id}`,
      );
    }
  }
  if (missing.length === 0) return;

  const results = await input.build(missing, input.registry, { ...input.buildOptions, failOnFetchError: true });
  const empty = results.filter((r) => r.built === 0).map((r) => r.packId);
  if (empty.length) throw new Error(`パックの固定データを作れなかった (公開 R2 から 0 指標): ${empty.join(", ")}`);
  const skipped = results.reduce((sum, r) => sum + r.skipped.length, 0);
  log(
    `[pack-snapshots] ${results.length} パックを作成。データの理由で飛ばした指標 ${skipped} 件 ` +
      `(${results.filter((r) => r.skipped.length > 0).map((r) => `${r.packId}:${r.skipped.length}`).join(", ") || "なし"})`,
  );
}

export default async function setup(): Promise<void> {
  const [{ PACK_SNAPSHOT_DIR, buildPackSnapshots }, { PACKS }, { METRICS_REGISTRY }] = await Promise.all([
    import("../../src/data/pack-snapshot"),
    import("../../src/catalog/products/packs"),
    import("@stats47/data-configs"),
  ]);
  await ensurePackSnapshots({
    packs: PACKS.filter((p) => p.rankingKeys.length > 0).map((p) => ({ id: p.id, title: p.name, rankingKeys: p.rankingKeys })),
    registry: METRICS_REGISTRY as unknown as Record<string, Record<string, unknown>>,
    dir: PACK_SNAPSHOT_DIR,
    build: buildPackSnapshots,
  });
}
