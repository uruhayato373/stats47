import "dotenv/config";
import "server-only";

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildDeterministicRankingContent } from "../services/deterministic-ranking-content";
import { aiContentKeyPath, type AiContentSnapshotRow } from "../types/snapshot";
import { buildRankingContentInput } from "./build-input";

interface TargetManifest {
  keys: string[];
}

interface Options {
  manifest: string;
  outDir: string;
  report: string;
  concurrency: number;
  force: boolean;
}

interface BackfillResult {
  rankingKey: string;
  status: "ok" | "skip" | "fail";
  detail: string;
}

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");

function resolveProjectPath(value: string): string {
  return path.isAbsolute(value) ? value : path.resolve(PROJECT_ROOT, value);
}

function parseArgs(argv: string[]): Options {
  const get = (name: string): string | undefined => {
    const index = argv.indexOf(name);
    return index >= 0 ? argv[index + 1] : undefined;
  };
  const manifest = get("--manifest");
  if (!manifest) throw new Error("--manifest <targets.json> が必要です");
  const concurrency = Number(get("--concurrency") ?? "8");
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 32) {
    throw new Error("--concurrency は1〜32の整数で指定してください");
  }
  return {
    manifest: resolveProjectPath(manifest),
    outDir: resolveProjectPath(get("--out") ?? ".local/r2"),
    report: resolveProjectPath(
      get("--report") ?? ".local/ci/deterministic-backfill-report.json",
    ),
    concurrency,
    force: argv.includes("--force"),
  };
}

function readManifest(file: string): TargetManifest {
  const parsed = JSON.parse(readFileSync(file, "utf8")) as Partial<TargetManifest>;
  if (!Array.isArray(parsed.keys) || parsed.keys.some((key) => typeof key !== "string" || !key)) {
    throw new Error("manifest.keys が文字列配列ではありません");
  }
  const unique = new Set(parsed.keys);
  if (unique.size !== parsed.keys.length) throw new Error("manifest.keys に重複があります");
  return { keys: [...parsed.keys] };
}

function writeRow(outDir: string, row: AiContentSnapshotRow): string {
  const destination = path.join(outDir, aiContentKeyPath(row.rankingKey));
  mkdirSync(path.dirname(destination), { recursive: true });
  writeFileSync(destination, `${JSON.stringify(row, null, 2)}\n`, "utf8");
  return destination;
}

async function processOne(rankingKey: string, options: Options): Promise<BackfillResult> {
  const destination = path.join(options.outDir, aiContentKeyPath(rankingKey));
  if (!options.force && existsSync(destination)) {
    return { rankingKey, status: "skip", detail: "existing-staging" };
  }
  try {
    const meta = await buildRankingContentInput(rankingKey);
    if (!meta) return { rankingKey, status: "fail", detail: "missing-input" };
    const content = buildDeterministicRankingContent(meta.input);
    const now = new Date().toISOString();
    writeRow(options.outDir, {
      rankingKey,
      yearCode: meta.yearCode,
      faq: JSON.stringify(content.faq),
      regionalAnalysis: content.regionalAnalysis,
      insights: content.insights,
      prefectureCommentary: JSON.stringify(content.prefectureCommentary),
      createdAt: now,
      updatedAt: now,
    });
    return { rankingKey, status: "ok", detail: "generated" };
  } catch (error) {
    return {
      rankingKey,
      status: "fail",
      detail: error instanceof Error ? error.message : String(error),
    };
  }
}

async function runPool(keys: string[], options: Options): Promise<BackfillResult[]> {
  const results: BackfillResult[] = [];
  let nextIndex = 0;
  const workers = Array.from({ length: Math.min(options.concurrency, keys.length) }, async () => {
    for (;;) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= keys.length) return;
      const result = await processOne(keys[index], options);
      results[index] = result;
      process.stdout.write(`[${result.status.toUpperCase()}] ${result.rankingKey}: ${result.detail}\n`);
    }
  });
  await Promise.all(workers);
  return results;
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const manifest = readManifest(options.manifest);
  const results = await runPool(manifest.keys, options);
  const counts = results.reduce(
    (acc, result) => ({ ...acc, [result.status]: acc[result.status] + 1 }),
    { ok: 0, skip: 0, fail: 0 },
  );
  mkdirSync(path.dirname(options.report), { recursive: true });
  writeFileSync(
    options.report,
    `${JSON.stringify({ generatedAt: new Date().toISOString(), targetCount: manifest.keys.length, counts, results }, null, 2)}\n`,
    "utf8",
  );
  process.stdout.write(`完了: OK ${counts.ok} / SKIP ${counts.skip} / FAIL ${counts.fail}\n`);
  if (counts.fail > 0) process.exitCode = 1;
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(2);
});
