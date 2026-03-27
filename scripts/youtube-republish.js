#!/usr/bin/env node
/**
 * 非公開にした YouTube 動画を1本ずつ公開に戻すスクリプト。
 *
 * 使い方:
 *   node scripts/youtube-republish.js          # 今日が公開日の動画を公開
 *   node scripts/youtube-republish.js --list   # スケジュール一覧を表示
 *   node scripts/youtube-republish.js --force  # 日付チェックなしで次の1本を公開
 */

const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");

// .env.local 読み込み
const envPath = path.join(__dirname, "..", ".env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
const envVars = {};
for (const line of envContent.split("\n")) {
  const match = line.match(/^([A-Z_]+)=(.*)$/);
  if (match) envVars[match[1]] = match[2];
}

const oauth2Client = new google.auth.OAuth2(
  envVars.GOOGLE_OAUTH_CLIENT_ID,
  envVars.GOOGLE_OAUTH_CLIENT_SECRET,
  "http://localhost:3847"
);
oauth2Client.setCredentials({
  refresh_token: envVars.GOOGLE_OAUTH_REFRESH_TOKEN,
});
const youtube = google.youtube({ version: "v3", auth: oauth2Client });

// 再公開スケジュール: 4/3 から1日1本
const SCHEDULE = [
  { date: "2026-04-03", id: "8u8FNE3zTUU", title: "ラスパイレス指数 公務員給与1位は静岡" },
  { date: "2026-04-04", id: "hNH2SM0HZTo", title: "流入人口比率ランキング 佐賀が全国4位" },
  { date: "2026-04-05", id: "MH4Sv4Mrmas", title: "民生費ランキング 福祉費1位が沖縄" },
  { date: "2026-04-06", id: "-KRF6t-vwuE", title: "教育費ランキング 1位は佐賀県" },
  { date: "2026-04-07", id: "SWFp5gXA5Eo", title: "最高気温ランキング 沖縄より暑い県が26" },
  { date: "2026-04-08", id: "W1xqwVrXZDM", title: "地方税割合ランキング 東京63% 島根15%" },
  { date: "2026-04-09", id: "soaE0of-At4", title: "地方債ランキング 静岡の借金が歳入の208%" },
  { date: "2026-04-10", id: "hnnPbPUf4H8", title: "ホテル客室数ランキング 奈良46位" },
];

(async () => {
  const args = process.argv.slice(2);
  const today = new Date().toISOString().slice(0, 10);

  if (args.includes("--list")) {
    console.log("=== 再公開スケジュール ===");
    for (const s of SCHEDULE) {
      const status = s.date < today ? "✅ 済" : s.date === today ? "📌 今日" : "⏳ 待ち";
      console.log(`${status} ${s.date}  ${s.title}`);
    }
    return;
  }

  const forceMode = args.includes("--force");

  // 今日が公開日の動画、または --force で次の未公開動画を取得
  let targets;
  if (forceMode) {
    // まだ private の動画を1本だけ取得
    const remaining = [];
    for (const s of SCHEDULE) {
      try {
        const res = await youtube.videos.list({ id: s.id, part: "status" });
        if (res.data.items[0]?.status.privacyStatus === "private") {
          remaining.push(s);
        }
      } catch (e) {
        // skip
      }
    }
    targets = remaining.slice(0, 1);
  } else {
    targets = SCHEDULE.filter((s) => s.date === today);
  }

  if (targets.length === 0) {
    console.log("今日 (" + today + ") の公開対象はありません。");
    console.log("--list でスケジュール確認、--force で次の1本を強制公開できます。");
    return;
  }

  for (const t of targets) {
    try {
      await youtube.videos.update({
        part: "status",
        requestBody: {
          id: t.id,
          status: { privacyStatus: "public" },
        },
      });
      console.log("✅ " + t.id + " → public (" + t.title + ")");
    } catch (err) {
      console.log("❌ " + t.id + ": " + err.message);
    }
  }
})();
