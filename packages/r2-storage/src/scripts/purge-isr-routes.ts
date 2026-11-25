/**
 * purge-isr-routes — 特定ルートの OpenNext ISR キャッシュエントリを削除する
 *
 * 背景 (2026-07-24 実測):
 *   blog/[slug] などビルド時に prerender されたページは、R2 の元データ (article.md) を
 *   更新しても **本番に反映されない**。レスポンスは x-nextjs-prerender:1 /
 *   x-nextjs-stale-time:4294967294 (実質無限) で、CDN を迂回しても Worker が
 *   incremental cache のエントリをそのまま返すため。
 *   → 該当ルートのキャッシュエントリを消すと、次アクセスで R2 から再レンダリングされる。
 *
 * キャッシュの所在 (open-next.config.ts / wrangler.toml):
 *   バケット stats47 の `incremental-cache/<buildId>/<sha256(key)>.cache`
 *   (r2-incremental-cache override の computeCacheKey)。key は Next.js 16.3.8 以上では
 *   `/route-cache/APP_PAGE/<sha256(app の項目名)>/$<パス>`、それより前はパスそのもの。
 *   両方の形を `lib/utils/isr-route-cache-key.ts` が求め、置かれているほうを消す
 *   (旧形式だけを探して 2026-11-25 の公開で「どの buildId にもない」で止まった)。
 *
 * 使い方:
 *   npx tsx packages/r2-storage/src/scripts/purge-isr-routes.ts --routes /blog/foo /blog/bar
 *   npx tsx packages/r2-storage/src/scripts/purge-isr-routes.ts --routes-file /tmp/routes.txt --apply
 *   npx tsx packages/r2-storage/src/scripts/purge-isr-routes.ts --routes /themes --build-id <id> --apply
 *
 * 既定は dry-run。--build-id 未指定なら「プローブルートのエントリが最も新しい buildId」を
 * 現行ビルドとみなす (デプロイのたびに buildId が変わり、旧 build の残骸が蓄積するため)。
 *
 * 注意: エントリ削除後も (a) regional cache (long-lived: 最大 30 分エッジ再利用)、
 *   (b) Cloudflare CDN (s-maxage=2 + stale-while-revalidate) の順に伝播待ちがある。
 *   即時反映が要る場合は CDN パージ (purge-cache.ts、CLOUDFLARE_API_TOKEN が要る = CI) を併用する。
 */

import {
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  type S3Client,
} from "@aws-sdk/client-s3";
import { config } from "dotenv";
import * as fs from "fs";
import * as path from "path";

import { createR2S3Client } from "../lib/clients/r2-s3-client.mjs";
import { candidateIsrObjectKeys, listAppEntries } from "../lib/utils/isr-route-cache-key";
import { assertR2WriteAllowed } from "./_assert-ci-write";
import { SITE } from "@stats47/types";

config({ path: path.resolve(__dirname, "..", "..", "..", "..", ".env.local") });

const BUCKET = process.env.CLOUDFLARE_R2_BUCKET_NAME || SITE.r2Bucket;
const CACHE_PREFIX = "incremental-cache";
const CONCURRENCY = 12;

function getClient(): S3Client {
  const endpoint = process.env.R2_S3_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error("R2 S3 認証情報が不足 (.env.local: R2_S3_ENDPOINT / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY)");
  }
  const client = createR2S3Client();
  const handler = client.config.requestHandler;
  if ("updateHttpClientConfig" in handler && typeof handler.updateHttpClientConfig === "function") {
    handler.updateHttpClientConfig("requestTimeout", 20000);
  }
  return client;
}

/** ページの描画を持つ app ディレクトリ (キーの元になる app の項目名をここから作る) */
const APP_DIR = path.resolve(__dirname, "..", "..", "..", "..", "apps", "web", "src", "app");
const APP_ENTRIES = listAppEntries(APP_DIR);

async function existingKeys(client: S3Client, buildId: string, route: string): Promise<string[]> {
  const found: string[] = [];
  for (const key of candidateIsrObjectKeys(buildId, route, APP_ENTRIES)) {
    try {
      await client.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
      found.push(key);
    } catch {
      /* この形では置かれていない */
    }
  }
  return found;
}

/** プローブルートのエントリが最も新しい buildId を現行ビルドとみなす */
async function detectCurrentBuildId(client: S3Client, probeRoutes: string[]): Promise<string> {
  const listed = await client.send(
    new ListObjectsV2Command({ Bucket: BUCKET, Prefix: `${CACHE_PREFIX}/`, Delimiter: "/" }),
  );
  const buildIds = (listed.CommonPrefixes ?? [])
    .map((p) => p.Prefix?.split("/")[1])
    .filter((b): b is string => Boolean(b));
  if (buildIds.length === 0) throw new Error("incremental-cache 配下に buildId が見つかりません");

  const found: { buildId: string; mtime: number }[] = [];
  await Promise.all(
    buildIds.map(async (buildId) => {
      for (const route of probeRoutes) {
        for (const key of candidateIsrObjectKeys(buildId, route, APP_ENTRIES)) {
          try {
            const head = await client.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
            found.push({ buildId, mtime: head.LastModified?.getTime() ?? 0 });
          } catch {
            /* この buildId のこの形には無い */
          }
        }
      }
    }),
  );
  if (found.length === 0) {
    throw new Error(`プローブルート (${probeRoutes.join(", ")}) のエントリがどの buildId にもありません`);
  }
  const best = found.reduce((a, b) => (b.mtime > a.mtime ? b : a));
  console.log(
    `現行 buildId: ${best.buildId} (最終更新 ${new Date(best.mtime).toISOString()}, 候補 ${buildIds.length} 件)`,
  );
  return best.buildId;
}

async function main() {
  const argv = process.argv.slice(2);
  const APPLY = argv.includes("--apply");
  const buildIdIdx = argv.indexOf("--build-id");
  const routesFileIdx = argv.indexOf("--routes-file");
  const routesIdx = argv.indexOf("--routes");

  let routes: string[] = [];
  if (routesFileIdx >= 0 && argv[routesFileIdx + 1]) {
    routes = fs
      .readFileSync(argv[routesFileIdx + 1], "utf8")
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.startsWith("/"));
  } else if (routesIdx >= 0) {
    routes = argv.slice(routesIdx + 1).filter((s) => s.startsWith("/"));
  }
  if (routes.length === 0) {
    console.error("--routes /path ... または --routes-file <file> が必要です (先頭スラッシュ必須)");
    process.exit(1);
  }

  const client = getClient();
  const buildId =
    buildIdIdx >= 0 && argv[buildIdIdx + 1]
      ? argv[buildIdIdx + 1]
      : await detectCurrentBuildId(client, [routes[0], "/themes", "/blog"]);

  assertR2WriteAllowed({ op: "purge ISR cache entries", dryRun: !APPLY });
  console.log(`mode  : ${APPLY ? "APPLY" : "DRY-RUN"}`);
  console.log(`対象  : ${routes.length} ルート (${CACHE_PREFIX}/${buildId}/)`);

  let deleted = 0;
  let missing = 0;
  const failed: string[] = [];
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, routes.length) }, async () => {
      while (i < routes.length) {
        const route = routes[i++];
        const keys = await existingKeys(client, buildId, route);
        if (keys.length === 0) {
          missing++;
          continue; // 元々キャッシュされていない (= 次アクセスで render される) ので何もしない
        }
        if (!APPLY) {
          deleted++;
          continue;
        }
        try {
          for (const key of keys) await client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
          deleted++;
          if (deleted % 25 === 0) console.log(`  ${deleted} 件削除 …`);
        } catch (e) {
          failed.push(`${route}: ${(e as Error).message}`);
        }
      }
    }),
  );

  console.log(`${APPLY ? "削除" : "削除対象"}: ${deleted} / キャッシュ無し: ${missing} / 失敗: ${failed.length}`);
  failed.forEach((f) => console.error(`  ${f}`));
  if (!APPLY) console.log("--apply で実際に削除します");
  else
    console.log(
      "次アクセスで R2 から再レンダリングされます (regional cache 最大 30 分 + CDN の SWR 伝播待ちあり)",
    );
  if (failed.length) process.exit(1);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
