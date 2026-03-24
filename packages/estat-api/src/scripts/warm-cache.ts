#!/usr/bin/env tsx
/**
 * e-Stat API キャッシュを事前作成するスクリプト。
 *
 * comparison_components テーブルから全ユニークな estatParams を取得し、
 * e-Stat API を呼び出して R2 にキャッシュを保存する。
 * cdArea なしで取得するため、1エントリで全47都道府県をカバーする。
 *
 * Usage:
 *   npx tsx packages/estat-api/src/scripts/warm-cache.ts [--dry-run] [--concurrency N]
 */

import { config as dotenvConfig } from "dotenv";
import Database from "better-sqlite3";
import path from "path";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";

// モノレポルートの .env.local を明示的にロード（他の import より先に実行）
dotenvConfig({ path: path.resolve(__dirname, "../../../../.env.local") });

import type { GetStatsDataParams } from "../stats-data/types";

const DB_PATH = path.resolve(
  __dirname,
  "../../../../.local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite"
);

function parseArgs() {
  const argv = process.argv.slice(2);
  let dryRun = false;
  let concurrency = 3;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--dry-run") dryRun = true;
    if (argv[i] === "--concurrency" && argv[i + 1]) concurrency = Number(argv[++i]);
  }
  return { dryRun, concurrency };
}

function createR2S3Client(): S3Client {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "R2 S3互換API用の環境変数が不足: CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_R2_ACCESS_KEY_ID, CLOUDFLARE_R2_SECRET_ACCESS_KEY"
    );
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

/** comparison_components から全ユニークな estatParams を抽出 */
function extractUniqueParams(): GetStatsDataParams[] {
  const db = new Database(DB_PATH);
  const rows = db
    .prepare(
      "SELECT component_props FROM comparison_components WHERE is_active = 1 AND data_source = 'estat'"
    )
    .all() as { component_props: string }[];
  db.close();

  const seen = new Set<string>();
  const result: GetStatsDataParams[] = [];

  for (const row of rows) {
    const props = JSON.parse(row.component_props);
    const paramSources = [
      props.estatParams,
      props.rateParams,
      props.columnParams,
      props.lineParams,
    ].filter(Boolean);

    // composition-chart: segments + totalCode から個別パラメータを生成
    if (props.segments && props.statsDataId) {
      const codes = [
        ...(props.segments as Array<{ code: string }>).map((s) => s.code),
        props.totalCode,
      ].filter(Boolean);
      for (const code of codes) {
        paramSources.push({ statsDataId: props.statsDataId, cdCat01: code });
      }
    }

    for (const ep of paramSources) {
      const paramsList: GetStatsDataParams[] = Array.isArray(ep) ? ep : [ep];
      for (const p of paramsList) {
        const cleaned: Record<string, string> = {};
        for (const [k, v] of Object.entries(p)) {
          if (k !== "cdArea" && v != null) cleaned[k] = String(v);
        }
        const key = JSON.stringify(cleaned, Object.keys(cleaned).sort());
        if (!seen.has(key)) {
          seen.add(key);
          result.push(cleaned as unknown as GetStatsDataParams);
        }
      }
    }
  }

  return result;
}

async function runWithConcurrency<T>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<void>
): Promise<void> {
  let index = 0;
  const workers = Array.from({ length: concurrency }, async () => {
    while (index < items.length) {
      const i = index++;
      await fn(items[i], i);
    }
  });
  await Promise.all(workers);
}

async function main() {
  const { dryRun, concurrency } = parseArgs();
  const params = extractUniqueParams();

  console.log(`=== e-Stat Cache Warm-up ===`);
  console.log(`Unique param sets: ${params.length}`);
  console.log(`Concurrency: ${concurrency}`);
  console.log(`Dry run: ${dryRun}`);
  console.log();

  // dotenv 読み込み後に動的 import（ESTAT_APP_ID 定数が process.env から読まれるため）
  const { fetchStatsDataFromApi } = await import("../stats-data/repositories/api/fetch-from-api");
  const { generateCacheKey } = await import("../stats-data/repositories/cache/generate-cache-key");

  if (dryRun) {
    for (const p of params) {
      console.log(`  ${generateCacheKey(p)}`);
    }
    console.log(`\nTotal: ${params.length} cache entries would be created.`);
    return;
  }

  const s3 = createR2S3Client();
  const bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME || "stats47";

  let cached = 0;
  let fetched = 0;
  let errors = 0;

  await runWithConcurrency(params, concurrency, async (p, i) => {
    const key = generateCacheKey(p);
    const label = `[${i + 1}/${params.length}] ${key}`;

    try {
      // R2 キャッシュ確認
      try {
        const existing = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
        if (existing.Body) {
          console.log(`  CACHED  ${label}`);
          cached++;
          return;
        }
      } catch (err: any) {
        if (err.name !== "NoSuchKey" && err.$metadata?.httpStatusCode !== 404) {
          throw err;
        }
        // 404 = キャッシュミス → 次のステップで取得
      }

      // e-Stat API から取得
      console.log(`  FETCH   ${label}`);
      const data = await fetchStatsDataFromApi(p);

      // R2 に保存
      const envelope = {
        cachedAt: new Date().toISOString(),
        response: data,
      };
      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: JSON.stringify(envelope),
          ContentType: "application/json",
          Metadata: {
            "stats-data-id": p.statsDataId,
            "saved-at": envelope.cachedAt,
          },
        })
      );

      fetched++;
      // e-Stat API レートリミット対策
      await new Promise((r) => setTimeout(r, 1000));
    } catch (err) {
      console.error(`  ERROR   ${label}: ${err instanceof Error ? err.message : err}`);
      errors++;
      await new Promise((r) => setTimeout(r, 500));
    }
  });

  console.log();
  console.log(`=== Complete ===`);
  console.log(`Already cached: ${cached}`);
  console.log(`Newly fetched:  ${fetched}`);
  console.log(`Errors:         ${errors}`);
  console.log(`Total:          ${params.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
