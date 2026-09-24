#!/usr/bin/env node
/**
 * GitHub Actions 用 IG 予約投稿スクリプト
 *
 * `.claude/state/instagram-w*-schedule.json` を読み、前日・今日 (JST) の未投稿
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
 * 前日の未投稿も拾う (2026-09-24〜。cron が日付をまたいで遅れた夜枠を落とさないため)。
 *
 * type: "image" (既定) | "reels" | "carousel" (2026-09-23〜)。carousel は
 * slides (instagram/stills/ 直下のファイル名、表示順) を必須とする。R2 は公開 URL で
 * 一覧できないため、枚数と順序はエントリが明示する。
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

/** JST の日付文字列 (YYYY-MM-DD) を days 日ずらす */
function shiftDate(date, days) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * 指定日のエントリを予約ファイルから集める。
 * - IG_SCHEDULE_FILE があればそれだけを読む (後方互換・テスト用)
 * - 無ければ instagram-w*-schedule.json を全走査する。旧実装は特定週のファイルに固定され、
 *   週が替わるたびに手編集が必要 = 更新忘れで cron が空振りする事故源だった
 *   (実害: w20 期間中も w19 を読み続け 2026-06-08 以降の自動投稿が発火せず)。
 *   前日と当日が別の週ファイルにまたがっても拾えるよう、1 ファイルに絞らず集める。
 */
function loadScheduleEntries(dates) {
  const wanted = new Set(dates);
  let files;
  if (process.env.IG_SCHEDULE_FILE) {
    const f = path.resolve(process.env.IG_SCHEDULE_FILE);
    console.log(`[post-from-schedule] schedule file (env 指定): ${f}`);
    files = fs.existsSync(f) ? [f] : [];
  } else {
    files = fs
      .readdirSync(STATE_DIR)
      .filter((f) => /^instagram-w\d+-schedule\.json$/.test(f))
      .sort()
      .map((f) => path.join(STATE_DIR, f));
  }
  const entries = [];
  for (const f of files) {
    try {
      const raw = JSON.parse(fs.readFileSync(f, "utf-8"));
      const hits = (Array.isArray(raw) ? raw : []).filter((e) => wanted.has(e.date));
      if (hits.length) console.log(`[post-from-schedule] schedule file: ${path.basename(f)} (${hits.length} 件)`);
      entries.push(...hits);
    } catch {
      console.log(`[post-from-schedule] parse 失敗 skip: ${path.basename(f)}`);
    }
  }
  if (!entries.length) {
    console.log(`[post-from-schedule] ${dates.join(" / ")} を含む schedule エントリなし (走査 ${files.length} ファイル)`);
  }
  return entries;
}

/**
 * 次に投稿する 1 件を選ぶ (純粋関数)。
 * - 前日の未投稿は時刻を問わず対象。GitHub Actions の cron は数時間遅れて発火し、夜枠 (19:03) の実行が
 *   日付をまたぐと当日分だけを見る実装では前日の 19:00 枠が投稿されずに消えていた
 *   (2026-09 に 3 週で 3 回、00:44〜01:24 JST に発火)。拾うのは前日まで (それより古いものは出さない)
 * - 当日は time (既定 "08:00") が現在時刻以前のものだけ
 * - 未投稿 = posted に `date|content_key` が無い。古い日付・早い時刻を先に出す
 */
function selectDueEntry(entries, { today, yesterday, nowTime, posted }) {
  const normalized = entries
    .map((e) => ({ ...e, time: e.time || "08:00" })) // time 無しの旧形式は朝枠 (08:03 cron) で配信
    .filter((e) => !posted.has(`${e.date}|${e.content_key}`));
  const due = normalized
    .filter((e) => e.date === yesterday || (e.date === today && e.time <= nowTime))
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const upcoming = normalized
    .filter((e) => e.date === today && e.time > nowTime)
    .sort((a, b) => a.time.localeCompare(b.time));
  return { next: due[0] ?? null, upcoming };
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

/** 前日の未投稿と、当日で time が現在時刻以前の未投稿から最早の 1 件を返す (選び方は selectDueEntry)。 */
async function findTodayEntry() {
  const today = getJstDate();
  const yesterday = shiftDate(today, -1);
  const nowTime = getJstTime();
  console.log(`[post-from-schedule] today (JST): ${today} ${nowTime}`);
  const entries = loadScheduleEntries([yesterday, today]);
  if (!entries.length) return null;
  const { next, upcoming } = selectDueEntry(entries, { today, yesterday, nowTime, posted: loadPostedSet() });
  if (!next && upcoming.length) {
    console.log(
      `[post-from-schedule] 未投稿 ${upcoming.length} 件はすべて time > ${nowTime} (次: ${upcoming[0].time})、skip`,
    );
  }
  if (next && next.date !== today) {
    console.log(`[post-from-schedule] 前日 (${next.date} ${next.time}) の未投稿を繰り越して投稿する`);
  }
  return next;
}

async function fetchCaption(domain, contentKey) {
  const url = `${PUBLIC_R2_BASE}/sns/${domain}/${contentKey}/instagram/caption.txt`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`caption fetch failed (${res.status}): ${url}`);
  return (await res.text()).trim();
}

/** Graph API のカルーセル子要素数 (既存 post-instagram.ts の上限 10 と同じ) */
const CAROUSEL_MIN_SLIDES = 2;
const CAROUSEL_MAX_SLIDES = 10;
/** stills/ 直下のファイル名だけを許す (パス区切り・相対参照で別 prefix を指させない) */
const SLIDE_FILE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*\.(png|jpe?g)$/;

/**
 * carousel エントリの子画像 URL を表示順で返す。slides が不正なら throw し、
 * コンテナを 1 つも作らないうちに止める (途中まで作った子コンテナを残さない)。
 */
function carouselUrlsFor(entry) {
  const slides = entry.slides;
  if (
    !Array.isArray(slides) ||
    slides.length < CAROUSEL_MIN_SLIDES ||
    slides.length > CAROUSEL_MAX_SLIDES
  ) {
    throw new Error(
      `carousel の slides は ${CAROUSEL_MIN_SLIDES}〜${CAROUSEL_MAX_SLIDES} 件必要: ${entry.content_key}`,
    );
  }
  if (new Set(slides).size !== slides.length) {
    throw new Error(`carousel の slides に重複があります: ${entry.content_key}`);
  }
  for (const file of slides) {
    if (typeof file !== "string" || !SLIDE_FILE_PATTERN.test(file)) {
      throw new Error(`carousel の slides は stills/ 直下の画像ファイル名のみ: ${file}`);
    }
  }
  return slides.map(
    (file) => `${PUBLIC_R2_BASE}/sns/${entry.domain}/${entry.content_key}/instagram/stills/${file}`,
  );
}

/** 投稿台帳 (posts.json) の post_type。カルーセルと単枚画像の成績を分けて測るために区別する */
function ledgerPostTypeFor(entry) {
  return entry.type === "carousel" ? "carousel" : "original";
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

/** 子コンテナ → カルーセルコンテナ → FINISHED 待ち → publish (post-instagram.ts と同じ手順) */
async function postCarousel({ caption, imageUrls }) {
  const childIds = [];
  for (const [i, imageUrl] of imageUrls.entries()) {
    const res = await fetch(`https://graph.instagram.com/v21.0/${IG_USER_ID}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        image_url: imageUrl,
        is_carousel_item: "true",
        access_token: TOKEN,
      }),
    });
    const json = await res.json();
    if (!json.id) throw new Error(`子コンテナ作成失敗 (${i + 1}/${imageUrls.length}): ${JSON.stringify(json)}`);
    childIds.push(json.id);
    console.log(`  📸 child ${i + 1}/${imageUrls.length}: ${json.id}`);
  }

  console.log(`📦 carousel container 作成...`);
  const containerRes = await fetch(`https://graph.instagram.com/v21.0/${IG_USER_ID}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      media_type: "CAROUSEL",
      children: childIds.join(","),
      caption,
      access_token: TOKEN,
    }),
  });
  const containerJson = await containerRes.json();
  if (!containerJson.id) {
    throw new Error(`carousel container 作成失敗: ${JSON.stringify(containerJson)}`);
  }
  const containerId = containerJson.id;

  console.log(`⏳ carousel 処理 polling...`);
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    const statusRes = await fetch(
      `https://graph.instagram.com/v21.0/${containerId}?fields=status_code&access_token=${TOKEN}`,
    );
    const statusJson = await statusRes.json();
    console.log(`  status (${i + 1}/30): ${statusJson.status_code}`);
    if (statusJson.status_code === "FINISHED") break;
    if (statusJson.status_code === "ERROR" || statusJson.status_code === "EXPIRED") {
      throw new Error(`carousel 処理失敗: ${JSON.stringify(statusJson)}`);
    }
    if (i === 29) throw new Error(`carousel 処理 timeout (150 秒)`);
  }

  console.log(`🚀 publish...`);
  const publishRes = await fetch(`https://graph.instagram.com/v21.0/${IG_USER_ID}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ creation_id: containerId, access_token: TOKEN }),
  });
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
  // POST_DATE はエントリの予約日。前日分を繰り越したとき実行日で記録すると、次の実行が
  // 同じエントリを未投稿と判定して二重投稿するため、posted-log にはこの値を書く
  console.log(`POST_DATE=${entry.date}`);
  console.log(`DOMAIN=${entry.domain}`);
  console.log(`POST_TYPE=${ledgerPostTypeFor(entry)}`);

  const caption = await fetchCaption(entry.domain, entry.content_key);
  console.log(`📝 caption (先頭 80): ${caption.slice(0, 80)}...`);

  const mediaUrls =
    entry.type === "carousel"
      ? carouselUrlsFor(entry)
      : [mediaUrlFor(entry.type, entry.domain, entry.content_key)];
  // 公開 URL の到達確認 (カルーセルは全枚。1 枚でも欠けたらコンテナを作る前に止める)
  for (const url of mediaUrls) {
    const headRes = await fetch(url, { method: "HEAD" });
    if (!headRes.ok) {
      throw new Error(`media URL 到達不能 (${headRes.status}): ${url}`);
    }
    console.log(`✅ media URL OK: ${url}`);
  }
  const [mediaUrl] = mediaUrls;

  if (process.env.IG_DRY_RUN) {
    console.log(
      `🧪 IG_DRY_RUN=1: caption/media 検証まで実施、実投稿せず終了 (${entry.content_key} time=${entry.time})`,
    );
    return;
  }

  if (entry.type === "reels") {
    await postReels({ contentKey: entry.content_key, caption, videoUrl: mediaUrl, domain: entry.domain });
  } else if (entry.type === "carousel") {
    await postCarousel({ caption, imageUrls: mediaUrls });
  } else {
    await postImage({ contentKey: entry.content_key, caption, imageUrl: mediaUrl });
  }
}

module.exports = { carouselUrlsFor, ledgerPostTypeFor, selectDueEntry, shiftDate };

if (require.main === module) {
  main().catch((err) => {
    console.error(`❌ ${err.message || err}`);
    process.exit(1);
  });
}
