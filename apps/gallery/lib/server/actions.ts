import "server-only";

import fs from "node:fs";
import path from "node:path";

import { projectRoot, R2_BASE } from "./project-root";
import { startJob } from "./jobs";
import { loadGalleryState } from "./gallery-state";

/**
 * spawn を伴うアクション (publish-x / publish-yt / regenerate) と R2 探索。
 * 旧 server.mjs の該当ハンドラを忠実移植 (引数構成・ガード・ホワイトリストを変えない)。
 * 各関数は { status, body } を返し、route が HTTP に写す。
 */
export type ActionResult<T = unknown> = { status: number; body: T };

function publishXScript(): string {
  return path.join(projectRoot(), ".claude/skills/sns/publish-x/publish-x.ts");
}
function ytUploadScript(): string {
  return path.join(projectRoot(), ".claude/scripts/youtube/upload.js");
}

// ─── publish-x ─────────────────────────────────────
export interface PublishXInput {
  content_key?: string;
  datetime?: string;
  domain?: string;
  dry_run?: boolean;
  immediate?: boolean;
  force?: boolean;
}

export function publishX(body: PublishXInput): ActionResult {
  const { content_key, datetime, domain = "ranking", dry_run = false, immediate = false } = body;
  if (!content_key) return { status: 400, body: { error: "content_key は必須" } };
  if (!dry_run && !immediate && !datetime) {
    return { status: 400, body: { error: "予約には datetime (YYYY-MM-DDTHH:MM) が必要" } };
  }
  // 誤即時投稿ガード: 最終成功から 7 日超なら dry-run を先に強制
  const st = loadGalleryState();
  const last = st.lastPublishXSuccess ? Date.now() - Date.parse(st.lastPublishXSuccess) : Infinity;
  if (!dry_run && last > 7 * 24 * 3600 * 1000 && !body.force) {
    return {
      status: 428,
      body: {
        error:
          "publish-x の成功実績が 7 日以上ない。まず dry-run で UI 変化を確認してください (force:true で強行可)",
      },
    };
  }
  const args = ["tsx", publishXScript(), content_key];
  if (datetime && !immediate) args.push(datetime);
  args.push("--domain", domain);
  if (immediate) args.push("--immediate");
  if (dry_run) args.push("--dry-run");
  const r = startJob("publish-x", "npx", args);
  return "error" in r ? { status: 409, body: r } : { status: 202, body: r };
}

// ─── publish-yt ────────────────────────────────────
export interface PublishYtInput {
  confirm?: boolean;
  video_file?: string;
  title?: string;
  content_key?: string;
  thumbnail?: string;
  description?: string;
}

export function publishYt(body: PublishYtInput): ActionResult {
  if (body.confirm !== true) {
    return { status: 400, body: { error: "confirm:true が必須 (月1運用の明示確認)" } };
  }
  const { video_file, title, content_key, thumbnail, description } = body;
  if (!video_file || !title) return { status: 400, body: { error: "video_file / title は必須" } };
  if (!fs.existsSync(video_file)) {
    return { status: 400, body: { error: `video_file が存在しない: ${video_file}` } };
  }
  const args = [ytUploadScript(), video_file, "--title", title];
  if (description) args.push("--description", description);
  if (thumbnail) args.push("--thumbnail", thumbnail);
  if (content_key) args.push("--content-key", content_key);
  // 月1 + 重複ガードは upload.js が内蔵 (check-youtube-post-budget / check-youtube-duplicate)
  const r = startJob("publish-yt", "node", args);
  return "error" in r ? { status: 409, body: r } : { status: 202, body: r };
}

// ─── regenerate (kind ホワイトリストのみ・任意コマンド実行を防ぐ) ─────
function ogpRegen(type: string, keys: string | null): { cmd: string; args: string[] } {
  const prefix = type === "note-covers" ? "note" : type === "areas" ? "app/areas" : "app/ranking";
  const keyArg = keys ? ` --key ${keys}` : "";
  const gen = `npx tsx --tsconfig apps/web/scripts/tsconfig.ogp.json apps/web/scripts/generate-ogp-images.ts --type ${type}${keyArg}`;
  const push = `npx tsx packages/r2-storage/src/scripts/diff-push-r2.ts --prefix ${prefix}`;
  // 生成 (→ .local/r2 staging) してから R2 push。push には S3 creds が要る (無ければ job ログで fail)
  return { cmd: "sh", args: ["-c", `${gen} && ${push}`] };
}

const REGEN: Record<string, (keys: string | null) => { cmd: string; args: string[] }> = {
  "blog-thumbnails": (keys) => ({
    cmd: "npx",
    args: [
      "tsx",
      "apps/web/scripts/generate-blog-thumbnails-cloud.ts",
      "--apply",
      ...(keys ? ["--slug", keys] : []),
    ],
  }),
  "ogp-ranking": (keys) => ogpRegen("ranking", keys),
  "ogp-ranking-cards": (keys) => ogpRegen("ranking-cards", keys),
  "ogp-areas": (keys) => ogpRegen("areas", keys),
  "ogp-note-covers": (keys) => ogpRegen("note-covers", keys),
};

export interface RegenerateInput {
  kind?: string;
  keys?: string;
}

export function regenerate(body: RegenerateInput): ActionResult {
  const kind = body.kind;
  const keys = body.keys ? String(body.keys).trim() : null;
  if (!kind || !REGEN[kind]) {
    return { status: 400, body: { error: `kind は ${Object.keys(REGEN).join(" | ")} のいずれか` } };
  }
  if (keys && !/^[a-z0-9,_-]+$/.test(keys)) {
    return { status: 400, body: { error: "keys は英数字・カンマ・ハイフンのみ (安全のため)" } };
  }
  const { cmd, args } = REGEN[kind](keys);
  const r = startJob(`regenerate:${kind}`, cmd, args);
  return "error" in r ? { status: 409, body: r } : { status: 202, body: r };
}

// ─── R2 探索 (HEAD probe — list 不可の代替) ─────────────
export async function probeR2(
  domain: string,
  contentKey: string,
): Promise<Array<{ rel: string; size: number }>> {
  const rels = [
    `instagram/caption.txt`,
    `instagram/reel.mp4`,
    `instagram/stills/slide-1-cover-1080x1350.png`,
    `x/caption.txt`,
    `x/stills/chart-x-1200x630.png`,
    `youtube/reel.mp4`,
  ];
  const found: Array<{ rel: string; size: number }> = [];
  await Promise.all(
    rels.map(async (rel) => {
      try {
        const r = await fetch(`${R2_BASE}/sns/${domain}/${contentKey}/${rel}`, { method: "HEAD" });
        if (r.ok) found.push({ rel, size: Number(r.headers.get("content-length") || 0) });
      } catch {
        // 探索なので失敗は無視
      }
    }),
  );
  return found;
}
