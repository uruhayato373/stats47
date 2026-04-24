#!/usr/bin/env node
/**
 * YouTube 動画の公開設定（privacyStatus）を更新する。
 *
 * Usage:
 *   node .claude/scripts/youtube/update-privacy.js --video-id <id> --privacy private|unlisted|public
 *   node .claude/scripts/youtube/update-privacy.js --from-json <path> --privacy private
 *     └─ JSON は `{ suspectVideos: [{ videoId, ... }, ...] }` または `{ videoIds: [id, ...] }`
 *   node .claude/scripts/youtube/update-privacy.js --video-ids id1,id2,id3 --privacy private
 *
 *   --dry-run          API を呼ばず対象一覧だけ表示
 *   --reason <text>    JSON lines 出力に載せる理由タグ（デフォルト "hidden <today>"）
 *
 * 出力:
 *   各対象について成功/失敗と新しい privacyStatus を JSON lines で出力。
 *   D1 sns_posts のメタデータは変更しない（監査ログは Issue コメント側に集約）。
 */

const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");

const envPath = path.join(PROJECT_ROOT, ".env.local");
const env = {};
for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2];
}
const { GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, GOOGLE_OAUTH_REFRESH_TOKEN } = env;
if (!GOOGLE_OAUTH_CLIENT_ID || !GOOGLE_OAUTH_CLIENT_SECRET || !GOOGLE_OAUTH_REFRESH_TOKEN) {
  console.error("Error: .env.local に GOOGLE_OAUTH_* が必要です");
  process.exit(1);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    videoId: null,
    videoIds: [],
    fromJson: null,
    privacy: null,
    dryRun: false,
    reason: `hidden ${new Date().toISOString().slice(0, 10)}`,
  };
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--video-id":
        opts.videoId = args[++i];
        break;
      case "--video-ids":
        opts.videoIds = args[++i].split(",").map((s) => s.trim()).filter(Boolean);
        break;
      case "--from-json":
        opts.fromJson = args[++i];
        break;
      case "--privacy":
        opts.privacy = args[++i];
        break;
      case "--dry-run":
        opts.dryRun = true;
        break;
      case "--reason":
        opts.reason = args[++i];
        break;
    }
  }
  return opts;
}

function collectIds(opts) {
  const ids = new Set();
  if (opts.videoId) ids.add(opts.videoId);
  for (const id of opts.videoIds) ids.add(id);
  if (opts.fromJson) {
    const data = JSON.parse(fs.readFileSync(opts.fromJson, "utf-8"));
    const list = data.suspectVideos || data.videoIds || data.videos || [];
    for (const item of list) {
      if (typeof item === "string") ids.add(item);
      else if (item && item.videoId) ids.add(item.videoId);
    }
  }
  return [...ids];
}

async function main() {
  const opts = parseArgs();
  if (!opts.privacy || !["private", "unlisted", "public"].includes(opts.privacy)) {
    console.error("Error: --privacy は private | unlisted | public のいずれか");
    process.exit(1);
  }
  const ids = collectIds(opts);
  if (ids.length === 0) {
    console.error("Error: --video-id / --video-ids / --from-json のいずれかで対象が必要");
    process.exit(1);
  }

  console.error(`[update-privacy] target ${ids.length} videos → ${opts.privacy}${opts.dryRun ? " (dry-run)" : ""}`);

  if (opts.dryRun) {
    for (const id of ids) {
      console.log(JSON.stringify({ videoId: id, action: "dry-run", wouldBe: opts.privacy }));
    }
    return;
  }

  const oauth2Client = new google.auth.OAuth2(GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET);
  oauth2Client.setCredentials({ refresh_token: GOOGLE_OAUTH_REFRESH_TOKEN });
  const youtube = google.youtube({ version: "v3", auth: oauth2Client });

  for (const id of ids) {
    try {
      const res = await youtube.videos.update({
        part: "status",
        requestBody: { id, status: { privacyStatus: opts.privacy } },
      });
      const newStatus = res.data.status?.privacyStatus;
      console.log(JSON.stringify({ videoId: id, ok: true, newStatus, reason: opts.reason }));
    } catch (err) {
      console.log(
        JSON.stringify({
          videoId: id,
          ok: false,
          error: err.message,
          details: err.response?.data,
        }),
      );
    }
  }
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
