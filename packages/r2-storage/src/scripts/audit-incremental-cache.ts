/**
 * OpenNext R2 incremental-cache 世代監査。
 *
 * 既定は dry-run。`--apply` を付けた場合だけ、保持対象外の世代 prefix を削除する。
 *
 * 使い方:
 *   npx tsx packages/r2-storage/src/scripts/audit-incremental-cache.ts
 *   npx tsx packages/r2-storage/src/scripts/audit-incremental-cache.ts --keep 5
 *   npx tsx packages/r2-storage/src/scripts/audit-incremental-cache.ts --keep 5 --apply
 *   npx tsx packages/r2-storage/src/scripts/audit-incremental-cache.ts --keep 3 --apply --assert-max 4
 *
 * --assert-max <n>: 処理後に残った世代数が n を超えていたら exit 1。
 *   GC が黙って効かなくなった状態 (2026-06〜07 に 67 世代 9GB まで放置された事故) を
 *   機械的に検知するための番人。--apply と併用すると削除後の実測で判定する。
 */
import { config } from "dotenv";
import path from "path";

import { deleteMultipleFromR2, listFromR2WithSize } from "../lib";
import { formatBytes } from "../lib/utils/format-bytes";
import { assertR2WriteAllowed } from "./_assert-ci-write";

config({ path: path.resolve(__dirname, "../../../..", ".env.local") });

interface CacheGeneration {
  id: string;
  prefix: string;
  count: number;
  size: number;
  lastModified: Date | null;
  keys: string[];
}

function parseArgs(): { keep: number; apply: boolean; assertMax?: number } {
  const args = process.argv.slice(2);
  const keepIdx = args.indexOf("--keep");
  const keep = keepIdx >= 0 ? Number(args[keepIdx + 1]) : 3;

  if (!Number.isInteger(keep) || keep < 1) {
    throw new Error("--keep must be a positive integer");
  }

  const assertIdx = args.indexOf("--assert-max");
  const assertMax = assertIdx >= 0 ? Number(args[assertIdx + 1]) : undefined;

  if (assertMax !== undefined && (!Number.isInteger(assertMax) || assertMax < 1)) {
    throw new Error("--assert-max must be a positive integer");
  }

  return {
    keep,
    apply: args.includes("--apply"),
    assertMax,
  };
}

function compareDateDesc(a: Date | null, b: Date | null): number {
  return (b?.getTime() ?? 0) - (a?.getTime() ?? 0);
}

function toDateLabel(value: Date | null): string {
  return value ? value.toISOString() : "unknown";
}

function groupGenerations(
  files: Awaited<ReturnType<typeof listFromR2WithSize>>,
): CacheGeneration[] {
  const generations = new Map<string, CacheGeneration>();

  for (const file of files) {
    const match = file.key.match(/^incremental-cache\/([^/]+)\//);
    if (!match) continue;

    const id = match[1];
    const current = generations.get(id) ?? {
      id,
      prefix: `incremental-cache/${id}/`,
      count: 0,
      size: 0,
      lastModified: null,
      keys: [],
    };

    current.count += 1;
    current.size += file.size;
    current.keys.push(file.key);

    if (file.lastModified && compareDateDesc(file.lastModified, current.lastModified) < 0) {
      current.lastModified = file.lastModified;
    }

    generations.set(id, current);
  }

  return [...generations.values()].sort((a, b) => {
    const byDate = compareDateDesc(a.lastModified, b.lastModified);
    return byDate === 0 ? b.size - a.size : byDate;
  });
}

async function deleteKeys(keys: string[]): Promise<void> {
  const chunkSize = 1000;
  let deleted = 0;
  let errors = 0;

  for (let i = 0; i < keys.length; i += chunkSize) {
    const chunk = keys.slice(i, i + chunkSize);
    const result = await deleteMultipleFromR2(chunk);
    deleted += result.deleted.length;
    errors += result.errors.length;

    if (result.errors.length > 0) {
      for (const error of result.errors.slice(0, 10)) {
        console.error(`FAIL ${error.key}: ${error.message}`);
      }
    }

    console.log(
      `delete progress: ${Math.min(i + chunkSize, keys.length)} / ${keys.length} ` +
        `(deleted=${deleted}, errors=${errors})`,
    );
  }
}

/**
 * 処理後に残った世代数を再計測し、assertMax を超えていたら exit 1 にする。
 * 「GC を配線したつもりで実は効いていない」を黙って見逃さないための番人。
 */
async function assertGenerationCeiling(assertMax: number): Promise<void> {
  const remaining = groupGenerations(await listFromR2WithSize("incremental-cache/"));
  console.log("");
  console.log(`assert-max: ${remaining.length} generations remain (ceiling ${assertMax})`);

  if (remaining.length > assertMax) {
    console.error(
      `✗ incremental-cache の世代が ${remaining.length} 個あり上限 ${assertMax} を超えている。` +
        " GC が効いていない可能性がある (正典 .claude/rules/r2-storage-design.md)",
    );
    process.exitCode = 1;
    return;
  }

  console.log("✓ 世代数は上限内");
}

async function main(): Promise<void> {
  const { keep, apply, assertMax } = parseArgs();
  if (apply) {
    assertR2WriteAllowed({
      op: "audit-incremental-cache --apply (R2 incremental-cache deletion)",
    });
  }

  const files = await listFromR2WithSize("incremental-cache/");
  const generations = groupGenerations(files);
  const kept = generations.slice(0, keep);
  const removable = generations.slice(keep);

  const totalSize = generations.reduce((sum, generation) => sum + generation.size, 0);
  const removableSize = removable.reduce((sum, generation) => sum + generation.size, 0);
  const removableCount = removable.reduce((sum, generation) => sum + generation.count, 0);

  console.log(`incremental-cache generations: ${generations.length}`);
  console.log(`objects: ${files.length}`);
  console.log(`total: ${formatBytes(totalSize)}`);
  console.log(`keep: latest ${keep} generations`);
  console.log(
    `${apply ? "delete target" : "dry-run delete target"}: ` +
      `${removable.length} generations / ${removableCount} objects / ${formatBytes(removableSize)}`,
  );
  console.log("");

  console.log(`${"ACTION".padEnd(8)} ${"SIZE".padStart(10)} ${"COUNT".padStart(7)} ${"LAST_MODIFIED".padEnd(24)} PREFIX`);
  console.log("-".repeat(90));

  for (const generation of generations) {
    const action = kept.includes(generation) ? "keep" : apply ? "delete" : "would";
    console.log(
      `${action.padEnd(8)} ${formatBytes(generation.size).padStart(10)} ` +
        `${String(generation.count).padStart(7)} ` +
        `${toDateLabel(generation.lastModified).padEnd(24)} ${generation.prefix}`,
    );
  }

  if (!apply) {
    console.log("");
    console.log("dry-run only. Add --apply to delete generations marked as 'would'.");
    if (assertMax !== undefined) await assertGenerationCeiling(assertMax);
    return;
  }

  if (removable.length === 0) {
    console.log("No removable generations.");
    if (assertMax !== undefined) await assertGenerationCeiling(assertMax);
    return;
  }

  console.log("");
  console.log("Deleting removable incremental-cache generations...");
  await deleteKeys(removable.flatMap((generation) => generation.keys));

  if (assertMax !== undefined) await assertGenerationCeiling(assertMax);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

