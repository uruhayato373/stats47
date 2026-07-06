/**
 * cleanup-posted-sns-videos.ts — 投稿済み SNS 動画の R2 自動削除 (コスト対策)
 *
 * 正典: .claude/rules/sns-content-standards.md §R2 素材保持ポリシー。
 * R2 は無料枠 10GB を超過し課金中 (2026-07 時点 20.65GB)。動画 (.mp4) は再レンダー
 * 可能な派生物なので、投稿後 RETENTION_DAYS を過ぎたら R2 から削除する。
 * サムネイル (.png) / caption.txt / posts.json の投稿記録・メトリクスは永続。
 *
 * 安全設計:
 * - dry-run 既定。実削除は --execute 明示時のみ
 * - 対象は status=posted かつ posted_at <= now - RETENTION_DAYS の content_key のみ
 * - 同一 (domain, content_key) に draft / scheduled が残る場合はスキップ (再投稿予定を守る)
 * - 削除は `sns/<domain>/<content_key>/` prefix 配下の **.mp4 のみ**
 * - assertR2WriteAllowed で CI/認証環境以外の誤実行を防止
 * - posts.json への書き戻しはしない (冪等 — 毎回 list して判定できる)
 *
 * Usage:
 *   npx tsx packages/r2-storage/src/scripts/cleanup-posted-sns-videos.ts            # dry-run
 *   npx tsx packages/r2-storage/src/scripts/cleanup-posted-sns-videos.ts --execute  # 実削除
 *   ... [--retention-days 30]
 */
import { config } from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { deleteMultipleFromR2, listFromR2WithSize } from "../lib/index";
import { assertR2WriteAllowed } from "./_assert-ci-write";

config({ path: path.resolve(__dirname, "..", "..", "..", "..", ".env.local") });

const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..", "..");
const POSTS_PATH = path.join(PROJECT_ROOT, ".claude/state/sns/posts.json");

const args = process.argv.slice(2);
const EXECUTE = args.includes("--execute");
const retIdx = args.indexOf("--retention-days");
const RETENTION_DAYS = retIdx >= 0 ? Number(args[retIdx + 1]) : 30;

interface SnsPost {
  id: number;
  platform: string;
  domain: string | null;
  content_key: string | null;
  status: string;
  posted_at: string | null;
}

async function main() {
  if (EXECUTE) assertR2WriteAllowed({ op: "cleanup-posted-sns-videos (R2 mp4 削除)" });

  const data = JSON.parse(fs.readFileSync(POSTS_PATH, "utf-8"));
  const posts: SnsPost[] = data.posts ?? [];

  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 3600 * 1000)
    .toISOString()
    .slice(0, 10);
  console.log(
    `[cleanup-sns-videos] retention=${RETENTION_DAYS}日 cutoff=${cutoff} mode=${EXECUTE ? "EXECUTE" : "dry-run"}`,
  );

  // (domain, content_key) 単位で判定。draft/scheduled が 1 件でも残るキーは保護
  const protectedKeys = new Set(
    posts
      .filter((p) => p.status === "draft" || p.status === "scheduled")
      .map((p) => `${p.domain}/${p.content_key}`),
  );
  const candidates = new Map<string, SnsPost[]>();
  for (const p of posts) {
    if (p.status !== "posted" || !p.posted_at || !p.domain || !p.content_key) continue;
    if (p.posted_at > cutoff) continue; // まだ保持期間内
    const key = `${p.domain}/${p.content_key}`;
    if (protectedKeys.has(key)) continue;
    if (!candidates.has(key)) candidates.set(key, []);
    candidates.get(key)!.push(p);
  }
  console.log(`対象 (domain/content_key): ${candidates.size} 件 (保護スキップ: ${protectedKeys.size} キー)`);

  let totalMp4 = 0;
  let totalBytes = 0;
  const toDelete: string[] = [];
  for (const key of candidates.keys()) {
    const prefix = `sns/${key}/`;
    let objects: Array<{ key: string; size: number }>;
    try {
      objects = await listFromR2WithSize(prefix);
    } catch (e) {
      console.warn(`  list 失敗 skip: ${prefix} (${(e as Error).message})`);
      continue;
    }
    const mp4s = objects.filter((o) => o.key.endsWith(".mp4"));
    if (mp4s.length === 0) continue;
    const bytes = mp4s.reduce((s, o) => s + o.size, 0);
    totalMp4 += mp4s.length;
    totalBytes += bytes;
    console.log(`  ${prefix}: mp4 ${mp4s.length} 本 (${(bytes / 1024 / 1024).toFixed(1)} MB)`);
    toDelete.push(...mp4s.map((o) => o.key));
  }

  console.log(
    `\n合計: mp4 ${totalMp4} 本 / ${(totalBytes / 1024 / 1024).toFixed(1)} MB ${EXECUTE ? "を削除します" : "(dry-run — 削除するには --execute)"}`,
  );

  if (EXECUTE && toDelete.length > 0) {
    await deleteMultipleFromR2(toDelete);
    console.log(`✅ 削除完了: ${toDelete.length} オブジェクト`);
  }
}

main().catch((e) => {
  console.error("❌", e);
  process.exit(1);
});
