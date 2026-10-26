/**
 * テスト前処理 (tests/setup/pack-snapshots.global.ts) が、取得の失敗で指標を黙って飛ばさないことを固定する
 * (PACK-SNAPSHOT-SKIP-GUARD-01)。データの理由 (47 県そろいの年が無い・全県 null・registry 未登録) だけなら今までどおり通る。
 */
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { buildPackSnapshots, PackSnapshotFetchError } from "../src/data/pack-snapshot";
import { MissingFullYearError, type FetchedValues } from "../src/data/load-ranking-values";
import { PREFECTURE_CODES5 } from "../src/data/prefectures";
import { ensurePackSnapshots, PACK_SNAPSHOT_STALE_DAYS } from "./setup/pack-snapshots.global";

const REGISTRY: Record<string, Record<string, unknown>> = {
  "ok-key": { unit: "人", category: "population", title: "テスト指標" },
  "no-full-year": { unit: "人", category: "population", title: "47 県がそろわない指標" },
  "all-null": { unit: "人", category: "population", title: "全県 null の指標" },
  "flaky-key": { unit: "人", category: "population", title: "取得に失敗する指標" },
};

function values(value: number | null): FetchedValues["values"] {
  return PREFECTURE_CODES5.map((code5) => ({ code5, value }));
}

/** 公開 R2 の代わり。キーごとに成功・データの理由・取得の失敗を返す */
async function fakeFetch(key: string): Promise<FetchedValues> {
  if (key === "no-full-year") throw new MissingFullYearError(`47 県フルの年が見つからない: ${key}`);
  if (key === "flaky-key") throw new TypeError("fetch failed");
  return { rankingKey: key, year: "2023", unit: "人", values: values(key === "all-null" ? null : 1) };
}

const dirs: string[] = [];
function tempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "pack-snapshot-setup-"));
  dirs.push(dir);
  return dir;
}
afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

function run(dir: string, rankingKeys: string[], logs: string[] = []) {
  return ensurePackSnapshots({
    packs: [{ id: "P-99", title: "テストパック", rankingKeys }],
    registry: REGISTRY,
    dir,
    build: buildPackSnapshots,
    buildOptions: { fetchValues: fakeFetch, outDir: dir, concurrency: 2 },
    log: (line) => logs.push(line),
  });
}

describe("パックの固定データの前処理", () => {
  it("取得の失敗が 1 件でもあれば止まり、欠けた固定データを書かない", async () => {
    const dir = tempDir();
    await expect(run(dir, ["ok-key", "flaky-key", "no-full-year"])).rejects.toBeInstanceOf(PackSnapshotFetchError);
    expect(existsSync(join(dir, "P-99.json"))).toBe(false);
  });

  it("データの理由だけで飛ばした指標は今までどおり通し、飛ばした件数を出す", async () => {
    const dir = tempDir();
    const logs: string[] = [];
    await run(dir, ["ok-key", "no-full-year", "all-null", "unregistered"], logs);
    const snapshot = JSON.parse(readFileSync(join(dir, "P-99.json"), "utf8"));
    expect(snapshot.indicatorCount).toBe(1);
    expect(logs.join("\n")).toContain("データの理由で飛ばした指標 3 件");
  });

  it("buildPackSnapshots は飛ばした理由を data と fetch に分ける", async () => {
    const dir = tempDir();
    const [result] = await buildPackSnapshots(
      [{ id: "P-98", title: "分類", rankingKeys: ["no-full-year", "all-null", "unregistered", "flaky-key"] }],
      REGISTRY,
      { fetchValues: fakeFetch, outDir: dir },
    );
    expect(Object.fromEntries(result.skipped.map((s) => [s.key, s.kind]))).toEqual({
      "no-full-year": "data",
      "all-null": "data",
      unregistered: "data",
      "flaky-key": "fetch",
    });
  });

  it(`手元のパックが ${PACK_SNAPSHOT_STALE_DAYS} 日より古ければ作り直し方を警告し、作り直さない`, async () => {
    const dir = tempDir();
    const path = join(dir, "P-99.json");
    const old = { packId: "P-99", generatedAt: "2026-01-01T00:00:00.000Z", indicatorCount: 0, indicators: [] };
    writeFileSync(path, JSON.stringify(old));
    const logs: string[] = [];
    await ensurePackSnapshots({
      packs: [{ id: "P-99", title: "テストパック", rankingKeys: ["ok-key"] }],
      registry: REGISTRY,
      dir,
      build: buildPackSnapshots,
      buildOptions: { fetchValues: fakeFetch, outDir: dir },
      now: new Date("2026-10-26T00:00:00Z"),
      log: (line) => logs.push(line),
    });
    expect(logs.join("\n")).toMatch(/P-99 の固定データは 298 日前に作られた/);
    expect(JSON.parse(readFileSync(path, "utf8")).generatedAt).toBe(old.generatedAt);
  });
});
