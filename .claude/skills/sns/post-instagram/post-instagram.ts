/**
 * Instagram 自動投稿スクリプト — Graph API 版（純 API、browser-use 不使用）
 *
 * 使い方:
 *   npx tsx .claude/skills/sns/post-instagram/post-instagram.ts \
 *     current-balance-ratio \
 *     manufacturing-shipment-amount \
 *     --domain ranking
 *
 * 引数: <rankingKey> を 1 件以上指定
 *   --domain ranking|compare|correlation|blog (デフォルト: ranking)
 *   --type image|carousel|reels (デフォルト: ディレクトリ構造から自動判定)
 *   --dry-run  API を叩かずに payload と public URL 到達確認のみ
 *
 * 設計:
 *   - 即時投稿のみ（Content Publishing API は予約非対応）
 *   - 画像/動画は R2 に push 済み前提（公開 URL 必須）
 *   - carousel は子 container を事前作成 → 親 container → publish の 3 段階
 *   - reels は container 作成後 status_code=FINISHED を polling
 */
import * as path from "path";
import * as fs from "fs";
import Database from "better-sqlite3";
import * as dotenv from "dotenv";

const PROJECT_ROOT = path.resolve(__dirname, "../../../..");
dotenv.config({ path: path.join(PROJECT_ROOT, ".env.local") });

const LOCAL_R2_ROOT = path.join(PROJECT_ROOT, ".local/r2");
const PUBLIC_R2_BASE = "https://storage.stats47.jp";
const DB_PATH = path.join(
  PROJECT_ROOT,
  ".local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite"
);
const PUBLISH_LOG = path.join(
  PROJECT_ROOT,
  ".claude/state/metrics/sns/instagram-publish-log.csv"
);

const TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const IG_USER_ID = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

if (!TOKEN || !IG_USER_ID) {
  console.error("❌ INSTAGRAM_ACCESS_TOKEN または INSTAGRAM_BUSINESS_ACCOUNT_ID が未設定");
  process.exit(1);
}

type PostType = "image" | "carousel" | "reels";

interface PostSpec {
  key: string;
  domain: string;
  type: PostType;
  caption: string;
  imageUrls: string[];
  videoUrl?: string;
  coverUrl?: string;
}

// ─── 引数パース ─────────────────────────────────────
function parseArgs(): { keys: string[]; domain: string; forceType: PostType | null; dryRun: boolean } {
  const args = process.argv.slice(2);
  let domain = "ranking";
  let forceType: PostType | null = null;
  let dryRun = false;
  const keys: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--domain") domain = args[++i];
    else if (a === "--type") forceType = args[++i] as PostType;
    else if (a === "--dry-run") dryRun = true;
    else if (a.startsWith("--")) {
      console.error(`❌ 不明な引数: ${a}`);
      process.exit(1);
    } else {
      keys.push(a);
    }
  }

  if (keys.length === 0) {
    console.error("使い方: post-instagram.ts <rankingKey> [...] [--domain <d>] [--type <t>] [--dry-run]");
    process.exit(1);
  }
  return { keys, domain, forceType, dryRun };
}

// ─── コンテンツ読み込み・タイプ判定 ─────────────────────
function loadPostSpec(domain: string, key: string, forceType: PostType | null): PostSpec {
  const baseDir = path.join(LOCAL_R2_ROOT, "sns", domain, key, "instagram");
  if (!fs.existsSync(baseDir)) {
    throw new Error(`ディレクトリが存在しません: ${baseDir}`);
  }

  const captionPath = path.join(baseDir, "caption.txt");
  if (!fs.existsSync(captionPath)) {
    throw new Error(`caption.txt がありません: ${captionPath}`);
  }
  const caption = fs.readFileSync(captionPath, "utf8").trim();
  if (caption.length > 2200) {
    throw new Error(`caption が 2200 字超過: ${caption.length} 字`);
  }

  const reelPath = path.join(baseDir, "reel.mp4");
  const stillsDir = path.join(baseDir, "stills");
  const hasReel = fs.existsSync(reelPath);
  const stillFiles = fs.existsSync(stillsDir)
    ? fs
        .readdirSync(stillsDir)
        .filter((f) => /\.(png|jpg|jpeg)$/i.test(f))
        .sort()
    : [];

  let type: PostType;
  if (forceType) type = forceType;
  else if (hasReel) type = "reels";
  else if (stillFiles.length >= 2) type = "carousel";
  else if (stillFiles.length === 1) type = "image";
  else throw new Error(`投稿可能な画像/動画が見つかりません: ${baseDir}`);

  const keyPrefix = `sns/${domain}/${key}/instagram`;

  if (type === "reels") {
    if (!hasReel) throw new Error(`reel.mp4 が見つかりません: ${reelPath}`);
    const coverFile = stillFiles.find((f) => f.startsWith("cover") || f.startsWith("thumb")) ?? stillFiles[0];
    return {
      key,
      domain,
      type,
      caption,
      imageUrls: [],
      videoUrl: `${PUBLIC_R2_BASE}/${keyPrefix}/reel.mp4`,
      coverUrl: coverFile ? `${PUBLIC_R2_BASE}/${keyPrefix}/stills/${coverFile}` : undefined,
    };
  }

  const imageUrls = stillFiles.slice(0, 10).map((f) => `${PUBLIC_R2_BASE}/${keyPrefix}/stills/${f}`);
  return { key, domain, type, caption, imageUrls };
}

// ─── API 呼び出しヘルパ ─────────────────────────────
const GRAPH_BASE = "https://graph.instagram.com/v21.0";

async function igPost(path: string, params: Record<string, string>): Promise<any> {
  const body = new URLSearchParams({ ...params, access_token: TOKEN! });
  const res = await fetch(`${GRAPH_BASE}/${path}`, { method: "POST", body });
  const data = (await res.json()) as any;
  if (data.error) {
    throw new Error(`API Error ${data.error.code}: ${data.error.message}`);
  }
  return data;
}

async function igGet(path: string, params: Record<string, string> = {}): Promise<any> {
  const qs = new URLSearchParams({ ...params, access_token: TOKEN! });
  const res = await fetch(`${GRAPH_BASE}/${path}?${qs}`);
  const data = (await res.json()) as any;
  if (data.error) {
    throw new Error(`API Error ${data.error.code}: ${data.error.message}`);
  }
  return data;
}

// ─── Public URL 到達確認 ────────────────────────────
async function verifyUrl(url: string): Promise<void> {
  const res = await fetch(url, { method: "HEAD" });
  if (!res.ok) {
    throw new Error(`Public URL に到達不可 (${res.status}): ${url}\n→ /push-r2 を先に実行してください`);
  }
}

// ─── 投稿処理 ────────────────────────────────────
async function publishImage(spec: PostSpec): Promise<string> {
  const { id: containerId } = await igPost(`${IG_USER_ID}/media`, {
    image_url: spec.imageUrls[0],
    caption: spec.caption,
  });
  console.log(`  📦 container 作成: ${containerId}`);

  const { id: mediaId } = await igPost(`${IG_USER_ID}/media_publish`, {
    creation_id: containerId,
  });
  return mediaId;
}

async function publishCarousel(spec: PostSpec): Promise<string> {
  const childIds: string[] = [];
  for (let i = 0; i < spec.imageUrls.length; i++) {
    const { id } = await igPost(`${IG_USER_ID}/media`, {
      image_url: spec.imageUrls[i],
      is_carousel_item: "true",
    });
    childIds.push(id);
    console.log(`  📸 child ${i + 1}/${spec.imageUrls.length}: ${id}`);
  }

  const { id: containerId } = await igPost(`${IG_USER_ID}/media`, {
    media_type: "CAROUSEL",
    children: childIds.join(","),
    caption: spec.caption,
  });
  console.log(`  📦 carousel container: ${containerId}`);

  const { id: mediaId } = await igPost(`${IG_USER_ID}/media_publish`, {
    creation_id: containerId,
  });
  return mediaId;
}

async function publishReel(spec: PostSpec): Promise<string> {
  const params: Record<string, string> = {
    media_type: "REELS",
    video_url: spec.videoUrl!,
    caption: spec.caption,
  };
  if (spec.coverUrl) params.cover_url = spec.coverUrl;

  const { id: containerId } = await igPost(`${IG_USER_ID}/media`, params);
  console.log(`  🎬 reels container: ${containerId}`);

  // status_code を polling（FINISHED になるまで最大 5 分）
  const maxAttempts = 30;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    await new Promise((r) => setTimeout(r, 10_000));
    const { status_code } = await igGet(containerId, { fields: "status_code" });
    console.log(`  ⏳ status (${attempt}/${maxAttempts}): ${status_code}`);
    if (status_code === "FINISHED") break;
    if (status_code === "ERROR" || status_code === "EXPIRED") {
      throw new Error(`reels 処理失敗: status=${status_code}`);
    }
    if (attempt === maxAttempts) {
      throw new Error(`reels 処理タイムアウト（5 分経過）`);
    }
  }

  const { id: mediaId } = await igPost(`${IG_USER_ID}/media_publish`, {
    creation_id: containerId,
  });
  return mediaId;
}

// ─── 投稿結果記録 ──────────────────────────────────
function recordPublish(spec: PostSpec, mediaId: string, permalink: string): void {
  const postedAt = new Date().toISOString();

  // CSV ログ
  if (!fs.existsSync(path.dirname(PUBLISH_LOG))) {
    fs.mkdirSync(path.dirname(PUBLISH_LOG), { recursive: true });
  }
  const header = "posted_at,domain,ranking_key,type,media_id,permalink\n";
  if (!fs.existsSync(PUBLISH_LOG)) fs.writeFileSync(PUBLISH_LOG, header);
  fs.appendFileSync(
    PUBLISH_LOG,
    `${postedAt},${spec.domain},${spec.key},${spec.type},${mediaId},${permalink}\n`
  );
  console.log(`  📝 log: ${PUBLISH_LOG}`);

  // D1 sns_posts へ記録
  if (!fs.existsSync(DB_PATH)) {
    console.warn(`  ⚠️ D1 not found, skipping DB write: ${DB_PATH}`);
    return;
  }
  const db = new Database(DB_PATH);
  try {
    const postType = spec.type === "reels" ? "reel" : spec.type === "carousel" ? "carousel" : "original";

    // 既存の draft/scheduled 行があれば status=posted に UPDATE、なければ INSERT
    const existing = db
      .prepare(
        `SELECT id FROM sns_posts
         WHERE platform = 'instagram' AND domain = ? AND content_key = ? AND post_type = ?
           AND status IN ('draft', 'scheduled')
         LIMIT 1`
      )
      .get(spec.domain, spec.key, postType) as { id: number } | undefined;

    if (existing) {
      db.prepare(
        `UPDATE sns_posts SET status='posted', post_url=?, posted_at=?, caption=?, updated_at=? WHERE id=?`
      ).run(permalink, postedAt, spec.caption, postedAt, existing.id);
      console.log(`  💾 D1 sns_posts UPDATE (id=${existing.id})`);
    } else {
      db.prepare(
        `INSERT INTO sns_posts (platform, post_type, domain, content_key, caption, post_url, posted_at, status, created_at, updated_at)
         VALUES ('instagram', ?, ?, ?, ?, ?, ?, 'posted', ?, ?)`
      ).run(postType, spec.domain, spec.key, spec.caption, permalink, postedAt, postedAt, postedAt);
      console.log(`  💾 D1 sns_posts INSERT`);
    }
  } catch (e) {
    console.warn(`  ⚠️ D1 write error: ${(e as Error).message}`);
  } finally {
    db.close();
  }
}

// ─── メイン ─────────────────────────────────────
async function main(): Promise<void> {
  const { keys, domain, forceType, dryRun } = parseArgs();
  console.log(`🎯 Instagram 投稿: ${keys.length} 件 (domain=${domain}${forceType ? `, type=${forceType}` : ""})`);

  for (const key of keys) {
    console.log(`\n─── ${key} ───`);
    const spec = loadPostSpec(domain, key, forceType);
    console.log(`  📂 type=${spec.type}, caption=${spec.caption.length}字`);
    if (spec.type === "reels") console.log(`  🎥 video=${spec.videoUrl}`);
    spec.imageUrls.forEach((u, i) => console.log(`  🖼  ${i + 1}: ${u}`));

    // Public URL 到達確認
    for (const url of [...spec.imageUrls, ...(spec.videoUrl ? [spec.videoUrl] : [])]) {
      await verifyUrl(url);
    }
    console.log(`  ✅ public URL 到達確認 OK`);

    if (dryRun) {
      console.log(`  🧪 DRY RUN: API 呼び出しスキップ`);
      continue;
    }

    let mediaId: string;
    if (spec.type === "image") mediaId = await publishImage(spec);
    else if (spec.type === "carousel") mediaId = await publishCarousel(spec);
    else mediaId = await publishReel(spec);

    const media = await igGet(mediaId, { fields: "permalink" });
    console.log(`  ✅ 投稿完了: ${media.permalink}`);
    recordPublish(spec, mediaId, media.permalink);
  }

  console.log(`\n🎉 ${keys.length} 件の投稿処理完了`);
}

main().catch((err) => {
  console.error(`\n❌ ${err.message}`);
  process.exit(1);
});
