/**
 * Cloudflare Workers Cache の HTML / data response を無効化する。
 * zone purge API は Workers Cache へ影響しないため、Worker 自身の認証付き purge API を呼ぶ。
 *
 * Usage:
 *   npx tsx packages/r2-storage/src/scripts/purge-worker-cache.ts --all
 *   npx tsx packages/r2-storage/src/scripts/purge-worker-cache.ts --data
 *   npx tsx packages/r2-storage/src/scripts/purge-worker-cache.ts --urls https://stats47.jp/blog/foo
 */

import { config } from "dotenv";
import { pathToFileURL } from "node:url";
import path from "node:path";

config({ path: path.resolve(import.meta.dirname, "..", "..", "..", "..", ".env.local") });

const DEFAULT_PURGE_URL = "https://stats47.jp/api/internal/worker-cache/purge";
const MAX_URLS_PER_REQUEST = 100;

interface PurgeWorkerCacheOptions {
  purgeAll?: boolean;
  purgeData?: boolean;
  secret?: string;
  urls?: readonly string[];
  endpoint?: string;
  fetcher?: typeof fetch;
}

interface PurgeApiResponse {
  success?: boolean;
  error?: string;
  purgedTags?: number;
}

export async function purgeWorkerCache(options: PurgeWorkerCacheOptions): Promise<void> {
  const secret = options.secret ?? process.env.WORKER_CACHE_PURGE_SECRET;
  if (!secret) {
    throw new Error("WORKER_CACHE_PURGE_SECRET must be set");
  }

  const urls = [...(options.urls ?? [])];
  const operationCount = Number(options.purgeAll === true)
    + Number(options.purgeData === true)
    + Number(urls.length > 0);
  if (operationCount !== 1) {
    throw new Error("Specify exactly one of --all, --data, or --urls");
  }

  const fetcher = options.fetcher ?? fetch;
  const endpoint = options.endpoint ?? DEFAULT_PURGE_URL;
  const batches = options.purgeAll || options.purgeData
    ? [[]]
    : Array.from(
        { length: Math.ceil(urls.length / MAX_URLS_PER_REQUEST) },
        (_, index) => urls.slice(index * MAX_URLS_PER_REQUEST, (index + 1) * MAX_URLS_PER_REQUEST),
      );

  for (const batch of batches) {
    const response = await fetcher(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        options.purgeAll
          ? { purgeAll: true }
          : options.purgeData
            ? { purgeData: true }
            : { urls: batch },
      ),
      signal: AbortSignal.timeout(30_000),
    });
    const body = (await response.json()) as PurgeApiResponse;
    if (!response.ok || body.success !== true) {
      throw new Error(`Workers Cache purge failed (${response.status}): ${body.error ?? "unknown error"}`);
    }
    console.log(`✅ Workers Cache purged (${body.purgedTags ?? 0} tags)`);
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const urlsIndex = args.indexOf("--urls");
  const purgeAll = args.includes("--all");
  const purgeData = args.includes("--data");
  const urls = urlsIndex === -1
    ? []
    : args.slice(urlsIndex + 1).filter((value) => /^https:\/\//.test(value));

  await purgeWorkerCache({ purgeAll, purgeData, urls });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
