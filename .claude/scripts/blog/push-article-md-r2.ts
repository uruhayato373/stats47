/**
 * push-article-md-r2 — 変換済み article.md だけを R2 へ push する (S3 API)
 *
 * fix-source-link-placement.mjs が `.local/blog-srclink-fix/out/<slug>/article.md` に
 * 書き出した是正済み本文を、R2 の `app/blog/<slug>/article.md` へ上書きする専用スクリプト。
 *
 * 汎用の diff-push-r2.ts / push-r2-wrangler.ts を使わない理由:
 *   - 両者は `.local/r2/<prefix>` ツリー全体を対象にする。`.local/r2/app/blog/` には
 *     ローカル作業由来の stale な data/*.json が残っており、巻き込んで push する事故が起きる。
 *   - 本スクリプトは「変換した article.md だけ」に対象を限定し、put 後に GET で
 *     実内容を検証する (wrangler put の永続化漏れ事例があるため、S3 API + 事後検証)。
 *
 * 使い方:
 *   npx tsx .claude/scripts/blog/push-article-md-r2.ts                  # dry-run (既定)
 *   npx tsx .claude/scripts/blog/push-article-md-r2.ts --apply
 *   npx tsx .claude/scripts/blog/push-article-md-r2.ts --apply --slug a,b
 *   npx tsx .claude/scripts/blog/push-article-md-r2.ts --apply --src .local/blog-linkfix/out
 *
 * --src で変換出力ディレクトリを切り替える (既定は source-link 配置是正の出力)。
 * どちらも `<dir>/<slug>/article.md` の構造であることが前提。
 */

import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { config } from "dotenv";
import * as fs from "fs";
import * as path from "path";

import { assertR2WriteAllowed } from "../../../packages/r2-storage/src/scripts/_assert-ci-write";

const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");
config({ path: path.join(PROJECT_ROOT, ".env.local") });

const BUCKET = process.env.CLOUDFLARE_R2_BUCKET_NAME || "stats47";
const srcArgIdx = process.argv.indexOf("--src");
const OUT_DIR =
  srcArgIdx >= 0 && process.argv[srcArgIdx + 1]
    ? path.resolve(PROJECT_ROOT, process.argv[srcArgIdx + 1])
    : path.join(PROJECT_ROOT, ".local/blog-srclink-fix/out");
// live と同じ content-type を維持する (既存 app/blog/<slug>/article.md は octet-stream)
const CONTENT_TYPE = "application/octet-stream";
const CONCURRENCY = 8;

const argv = process.argv.slice(2);
const APPLY = argv.includes("--apply");
const slugArgIdx = argv.indexOf("--slug");
const SLUG_FILTER =
  slugArgIdx >= 0 && argv[slugArgIdx + 1]
    ? new Set(argv[slugArgIdx + 1].split(",").map((s) => s.trim()))
    : null;

function getClient(): S3Client {
  const endpoint = process.env.R2_S3_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "R2 S3 認証情報が不足しています (.env.local の R2_S3_ENDPOINT / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY)",
    );
  }
  return new S3Client({ region: "auto", endpoint, credentials: { accessKeyId, secretAccessKey } });
}

async function streamToString(body: unknown): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const c of body as AsyncIterable<Buffer>) chunks.push(Buffer.from(c));
  return Buffer.concat(chunks).toString("utf8");
}

async function main() {
  if (!fs.existsSync(OUT_DIR)) {
    throw new Error(`変換出力が見つかりません: ${OUT_DIR} (先に fix-source-link-placement.mjs --apply を実行)`);
  }
  let slugs = fs
    .readdirSync(OUT_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && fs.existsSync(path.join(OUT_DIR, d.name, "article.md")))
    .map((d) => d.name);
  if (SLUG_FILTER) slugs = slugs.filter((s) => SLUG_FILTER.has(s));

  assertR2WriteAllowed({ op: "push blog article.md", dryRun: !APPLY });
  console.log(`mode   : ${APPLY ? "APPLY" : "DRY-RUN"}`);
  console.log(`対象   : ${slugs.length} 記事 (app/blog/<slug>/article.md)`);
  if (!APPLY) {
    console.log(slugs.slice(0, 10).map((s) => `  - ${s}`).join("\n"));
    console.log(`  ... (--apply で実際に push)`);
    return;
  }

  const client = getClient();
  const failed: string[] = [];
  let done = 0;
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, slugs.length) }, async () => {
      while (i < slugs.length) {
        const slug = slugs[i++];
        const key = `app/blog/${slug}/article.md`;
        const body = fs.readFileSync(path.join(OUT_DIR, slug, "article.md"), "utf8");
        try {
          await client.send(
            new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: body, ContentType: CONTENT_TYPE }),
          );
          // 事後検証: 実際に永続化され、内容が一致しているか
          const got = await client.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
          const remote = await streamToString(got.Body);
          if (remote !== body) throw new Error("put 後の内容が一致しません");
          done++;
          if (done % 25 === 0) console.log(`  ${done}/${slugs.length} …`);
        } catch (e) {
          failed.push(`${slug}: ${(e as Error).message}`);
        }
      }
    }),
  );

  console.log(`push 完了: ${done}/${slugs.length}`);
  if (failed.length) {
    console.error(`失敗 ${failed.length} 件:`);
    failed.forEach((f) => console.error(`  ${f}`));
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
