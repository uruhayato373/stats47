#!/usr/bin/env node
/**
 * GitHub Actions 用 IG 予約投稿スクリプト
 *
 * `.claude/state/instagram-w18-schedule.json` を読み、今日 (JST) と一致する
 * エントリがあれば Instagram Graph API で投稿する。
 *
 * 設計:
 * - ローカルファイル依存なし (caption / media は R2 公開 URL から取得)
 * - D1 への書き込みなし (CI に D1 環境なし)
 * - 投稿成功 / 該当なし は exit 0、API エラーのみ exit 1
 *
 * 環境変数:
 *   INSTAGRAM_ACCESS_TOKEN
 *   INSTAGRAM_BUSINESS_ACCOUNT_ID
 *   IG_PUBLIC_R2_BASE (default: https://storage.stats47.jp)
 *   IG_SCHEDULE_FILE (明示指定。未指定なら .claude/state/instagram-w*-schedule.json から
 *                     当日エントリを含む週ファイルを自動選択 — 週替わりの手編集忘れ防止)
 *   IG_FORCE_DATE (test 用: JST 日付を強制指定 YYYY-MM-DD)
 *   IG_FORCE_TIME (test 用: JST 時刻を強制指定 HH:MM)
 *   IG_DRY_RUN   (test 用: entry 解決 + caption/media 到達確認まで行い実投稿しない)
 *
 * 1 日複数本 (2026-07-11〜): エントリに time ("HH:MM" JST) を持たせ、cron を
 * 1 日複数回発火させる。各実行は「time <= 現在時刻 かつ ig-posted-log に無い」
 * 最早の 1 件だけを投稿する (二重投稿は posted-log で防止)。
 */

const fs = require("node:fs");
const path = require("node:path");

const TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const IG_USER_ID = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
const PUBLIC_R2_BASE = process.env.IG_PUBLIC_R2_BASE || "https://storage.stats47.jp";
const STATE_DIR = path.resolve(__dirname, "../../state");
const FORCE_DATE = process.env.IG_FORCE_DATE; // YYYY-MM-DD

// トークン検証は「当日エントリあり」確定後 (main 内) に行う。
// エントリ無し日や IG_FORCE_DATE でのファイル解決テストはトークン不要で exit 0 できる。
function assertToken() {
  if (!TOKEN || !IG_USER_ID) {
    console.error("❌ INSTAGRAM_ACCESS_TOKEN または INSTAGRAM_BUSINESS_ACCOUNT_ID が未設定");
    process.exit(1);
  }
}

function getJstDate() {
  if (FORCE_DATE) return FORCE_DATE;
  const now = new Date();
  // UTC + 9 hours = JST
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(0, 10);
}

/**
 * スケジュールファイルの解決。
 * - IG_SCHEDULE_FILE があればそれを使う (後方互換・テスト用)
 * - 無ければ instagram-w*-schedule.json を全走査し、当日 (JST) のエントリを
 *   含むファイルを自動選択する。旧実装はデフォルトが特定週 (w19 等) に固定され、
 *   週が替わるたびに手編集が必要 = 更新忘れで cron が空振りする事故源だった
 *   (実害: w20 期間中も w19 を読み続け 2026-06-08 以降の自動投稿が発火せず)。
 */
function resolveScheduleFile(today) {
  if (process.env.IG_SCHEDULE_FILE) {
    const f = path.resolve(process.env.IG_SCHEDULE_FILE);
    console.log(`[post-from-schedule] schedule file (env 指定): ${f}`);
    return fs.existsSync(f) ? f : null;
  }
  const candidates = fs
    .readdirSync(STATE_DIR)
    .filter((f) => /^instagram-w\d+-schedule\.json$/.test(f))
    .sort();
  for (const name of candidates) {
    const f = path.join(STATE_DIR, name);
    try {
      const entries = JSON.parse(fs.readFileSync(f, "utf-8"));
      if (Array.isArray(entries) && entries.some((e) => e.date === today)) {
        console.log(`[post-from-schedule] schedule file (自動選択): ${name}`);
        return f;
      }
    } catch {
      console.log(`[post-from-schedule] parse 失敗 skip: ${name}`);
    }
  }
  console.log(
    `[post-from-schedule] 当日 (${today}) を含む schedule ファイルなし (走査: ${candidates.join(", ") || "0件"})`,
  );
  return null;
}

function getJstTime() {
  if (process.env.IG_FORCE_TIME) return process.env.IG_FORCE_TIME; // test 用 "HH:MM"
  const jst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(11, 16); // "HH:MM"
}

/** ig-posted-log.jsonl から投稿済み (date|content_key) セットを作る (同日多重投稿の防止)。 */
function loadPostedSet() {
  const logPath = path.join(STATE_DIR, "ig-posted-log.jsonl");
  const set = new Set();
  if (!fs.existsSync(logPath)) return set;
  for (const line of fs.readFileSync(logPath, "utf-8").trim().split("\n")) {
    try {
      const j = JSON.parse(line);
      if (j.date && j.content_key) set.add(`${j.date}|${j.content_key}`);
    } catch {
      /* 壊れた行は無視 */
    }
  }
  return set;
}

/**
 * 当日エントリのうち「time (JST, 既定 "08:00") が現在時刻以前」かつ「未投稿
 * (ig-posted-log に無い)」の最早 1 件を返す。
 * 1 日複数本対応: cron を 1 日複数回発火させ、各実行が 1 件だけ消化する。
 * 既投稿分は workflow が commit する ig-posted-log で除外されるため二重投稿しない。
 * 失敗した枠は次の cron 実行が繰り上げて消化する (同日中のみ)。
 */
async function findTodayEntry() {
  const today = getJstDate();
  const nowTime = getJstTime();
  console.log(`[post-from-schedule] today (JST): ${today} ${nowTime}`);
  const file = resolveScheduleFile(today);
  if (!file) return null;
  const posted = loadPostedSet();
  const due = JSON.parse(fs.readFileSync(file, "utf-8"))
    .filter((e) => e.date === today)
    .map((e) => ({ ...e, time: e.time || "08:00" })) // time 無しの旧形式は朝枠 (08:03 cron) で配信
    .sort((a, b) => a.time.localeCompare(b.time))
    .filter((e) => !posted.has(`${e.date}|${e.content_key}`));
  if (!due.length) return null;
  const next = due.find((e) => e.time <= nowTime);
  if (!next) {
    console.log(
      `[post-from-schedule] 未投稿 ${due.length} 件はすべて time > ${nowTime} (次: ${due[0].time})、skip`,
    );
    return null;
  }
  return next;
}

async function fetchCaption(domain, contentKey) {
  const url = `${PUBLIC_R2_BASE}/sns/${domain}/${contentKey}/instagram/caption.txt`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`caption fetch failed (${res.status}): ${url}`);
  return (await res.text()).trim();
}

function mediaUrlFor(type, domain, contentKey) {
  if (type === "reels") {
    return `${PUBLIC_R2_BASE}/sns/${domain}/${contentKey}/instagram/reel.mp4`;
  }
  // image: 1 枚目の slide を採用
  return `${PUBLIC_R2_BASE}/sns/${domain}/${contentKey}/instagram/stills/slide-1-cover-1080x1350.png`;
}

async function postReels({ contentKey, caption, videoUrl, domain }) {
  // カバー画像が R2 に存在するか確認（存在すれば cover_url で指定）
  const coverUrl = `${PUBLIC_R2_BASE}/sns/${domain}/${contentKey}/instagram/stills/cover.png`;
  let useCoverUrl = false;
  try {
    const headRes = await fetch(coverUrl, { method: "HEAD" });
    useCoverUrl = headRes.ok;
    console.log(`🖼️  cover_url: ${useCoverUrl ? coverUrl : "なし（先頭フレーム使用）"}`);
  } catch {
    // cover なしで続行
  }

  console.log(`📦 reels container 作成...`);
  const containerParams = {
    media_type: "REELS",
    video_url: videoUrl,
    caption,
    access_token: TOKEN,
    ...(useCoverUrl && { cover_url: coverUrl }),
  };
  const containerRes = await fetch(
    `https://graph.instagram.com/v21.0/${IG_USER_ID}/media`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(containerParams),
    },
  );
  const containerJson = await containerRes.json();
  if (!containerJson.id) {
    throw new Error(`container 作成失敗: ${JSON.stringify(containerJson)}`);
  }
  const containerId = containerJson.id;
  console.log(`  container id: ${containerId}`);

  console.log(`⏳ 動画処理 polling...`);
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    const statusRes = await fetch(
      `https://graph.instagram.com/v21.0/${containerId}?fields=status_code&access_token=${TOKEN}`,
    );
    const statusJson = await statusRes.json();
    console.log(`  status (${i + 1}/60): ${statusJson.status_code}`);
    if (statusJson.status_code === "FINISHED") break;
    if (statusJson.status_code === "ERROR") {
      throw new Error(`container 処理失敗: ${JSON.stringify(statusJson)}`);
    }
    if (i === 59) throw new Error(`動画処理 timeout (5 分)`);
  }

  console.log(`🚀 publish...`);
  const publishRes = await fetch(
    `https://graph.instagram.com/v21.0/${IG_USER_ID}/media_publish`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        creation_id: containerId,
        access_token: TOKEN,
      }),
    },
  );
  const publishJson = await publishRes.json();
  if (!publishJson.id) {
    throw new Error(`publish 失敗: ${JSON.stringify(publishJson)}`);
  }

  const permalink = await fetchPermalink(publishJson.id);
  console.log(`✅ 投稿完了 media id: ${publishJson.id}`);
  console.log(`PERMALINK=${permalink}`);
  return { mediaId: publishJson.id, permalink };
}

async function fetchPermalink(mediaId) {
  try {
    const res = await fetch(
      `https://graph.instagram.com/v21.0/${mediaId}?fields=permalink&access_token=${TOKEN}`,
    );
    const json = await res.json();
    return json.permalink || `https://www.instagram.com/p/${mediaId}/`;
  } catch {
    return `https://www.instagram.com/p/${mediaId}/`;
  }
}

async function postImage({ contentKey, caption, imageUrl }) {
  console.log(`📦 image container 作成...`);
  const containerRes = await fetch(
    `https://graph.instagram.com/v21.0/${IG_USER_ID}/media`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        image_url: imageUrl,
        caption,
        access_token: TOKEN,
      }),
    },
  );
  const containerJson = await containerRes.json();
  if (!containerJson.id) {
    throw new Error(`container 作成失敗: ${JSON.stringify(containerJson)}`);
  }
  const containerId = containerJson.id;

  // 画像でも container が FINISHED になるまで待つ (reels より短い間隔で最大 30 回)
  console.log(`⏳ image 処理 polling...`);
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    const statusRes = await fetch(
      `https://graph.instagram.com/v21.0/${containerId}?fields=status_code&access_token=${TOKEN}`,
    );
    const statusJson = await statusRes.json();
    console.log(`  status (${i + 1}/30): ${statusJson.status_code}`);
    if (statusJson.status_code === "FINISHED") break;
    if (statusJson.status_code === "ERROR") {
      throw new Error(`container 処理失敗: ${JSON.stringify(statusJson)}`);
    }
    if (i === 29) throw new Error(`image 処理 timeout (90 秒)`);
  }

  console.log(`🚀 publish...`);
  const publishRes = await fetch(
    `https://graph.instagram.com/v21.0/${IG_USER_ID}/media_publish`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        creation_id: containerId,
        access_token: TOKEN,
      }),
    },
  );
  const publishJson = await publishRes.json();
  if (!publishJson.id) throw new Error(`publish 失敗: ${JSON.stringify(publishJson)}`);

  const permalink = await fetchPermalink(publishJson.id);
  console.log(`✅ 投稿完了 media id: ${publishJson.id}`);
  console.log(`PERMALINK=${permalink}`);
  return { mediaId: publishJson.id, permalink };
}

async function main() {
  const entry = await findTodayEntry();
  if (!entry) {
    console.log(`[post-from-schedule] 今日の予定なし、skip`);
    process.exit(0);
  }

  console.log(`[post-from-schedule] 投稿対象: ${JSON.stringify(entry)}`);
  if (!process.env.IG_DRY_RUN) {
    assertToken(); // 投稿実行が確定してからトークン検証 (エントリ無し日はトークン不要)
  }
  // GHA が grep で取得できるよう構造化ログを出力
  console.log(`DOMAIN=${entry.domain}`);

  const caption = await fetchCaption(entry.domain, entry.content_key);
  console.log(`📝 caption (先頭 80): ${caption.slice(0, 80)}...`);

  const mediaUrl = mediaUrlFor(entry.type, entry.domain, entry.content_key);
  // 公開 URL の到達確認
  const headRes = await fetch(mediaUrl, { method: "HEAD" });
  if (!headRes.ok) {
    throw new Error(`media URL 到達不能 (${headRes.status}): ${mediaUrl}`);
  }
  console.log(`✅ media URL OK: ${mediaUrl}`);

  if (process.env.IG_DRY_RUN) {
    console.log(
      `🧪 IG_DRY_RUN=1: caption/media 検証まで実施、実投稿せず終了 (${entry.content_key} time=${entry.time})`,
    );
    return;
  }

  if (entry.type === "reels") {
    await postReels({ contentKey: entry.content_key, caption, videoUrl: mediaUrl, domain: entry.domain });
  } else {
    await postImage({ contentKey: entry.content_key, caption, imageUrl: mediaUrl });
  }
}

main().catch((err) => {
  console.error(`❌ ${err.message || err}`);
  process.exit(1);
});
