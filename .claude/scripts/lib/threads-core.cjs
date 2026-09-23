"use strict";

/**
 * Threads 予約投稿の判定ロジック (純粋関数)。IO は .claude/scripts/threads/post-from-schedule.cjs が持つ。
 *
 * ## なぜ純粋関数に切るか
 *
 * 予約投稿の事故は「二重投稿」「上限超過で API が途中まで進む」「古い予約が遅れて出る」の 3 つで、
 * どれも外部に出てから気づく。判定を IO から切り離し、node:test で固定する
 * (テスト: .claude/scripts/lib/__tests__/threads-core.test.cjs)。
 *
 * ## Threads API の仕様値 (公式・アクセス日 2026-09-23)
 *
 * - 本文は 500 文字まで。絵文字は UTF-8 のバイト数で数える
 *   https://developers.facebook.com/docs/threads/posts
 * - 本文中のリンクは 5 個まで (同上)
 * - alt_text は 1,000 文字まで
 *   https://developers.facebook.com/docs/threads/reference/publishing/
 * - 画像は JPEG / PNG (https://developers.facebook.com/docs/threads/posts)
 * - API 公開は 24 時間の移動窓で 250 件まで
 *   https://developers.facebook.com/docs/threads/overview
 * - コンテナ作成 API に予約公開のパラメータは無い
 *   https://developers.facebook.com/docs/threads/reference/publishing/
 *   → 予約は schedule JSON + GitHub Actions cron で代替する (IG と同じ方式)
 *
 * 絵文字以外の文字 (日本語を含む) を 1 文字と数えるかは公式に明記が無い (未確認)。
 * ここでは「絵文字を含む書記素は UTF-8 バイト数、それ以外はコードポイント数」で数える。
 */

/** 本文の上限 (公式) */
const THREADS_TEXT_MAX = 500;
/** 本文中のリンク数上限 (公式) */
const THREADS_LINK_MAX = 5;
/** alt_text の上限 (公式) */
const THREADS_ALT_TEXT_MAX = 1000;
/**
 * stats47 側の 1 日 (JST) あたり投稿上限。API 上限 (250 / 24h) ではなく運用上の保守値。
 * sns-content-standards.md §1 に Threads の行が入ったら、その値に合わせて変える。
 */
const THREADS_DAILY_MAX = 3;
/** 予定時刻からこれ以上遅れた予約は出さない (古い予約が数日後に出る事故を防ぐ) */
const MAX_LATENESS_MINUTES = 360;
/** 投稿前の重複確認で見る自アカウントの直近投稿の範囲 */
const REMOTE_DUPLICATE_WINDOW_HOURS = 48;
/** 画像は R2 公開ドメインの URL だけを許す */
const R2_PUBLIC_BASE = "https://storage.stats47.jp/";

const ENTRY_TYPES = new Set(["text", "image"]);
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const DOMAIN_PATTERN = /^[a-z0-9][a-z0-9-]*$/;
const CONTENT_KEY_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const IMAGE_PATH_PATTERN = /\.(png|jpe?g)$/i;
const STATS47_HOSTS = new Set(["stats47.jp", "www.stats47.jp"]);

const EMOJI_PATTERN = /\p{Extended_Pictographic}|\p{Regional_Indicator}|\u20E3/u;
const graphemes = new Intl.Segmenter("ja", { granularity: "grapheme" });

/**
 * Threads の数え方で本文長を返す。絵文字を含む書記素 (ZWJ 連結・国旗・keycap を 1 まとまりとして) は
 * UTF-8 バイト数、それ以外はコードポイント数で数える。
 */
function countThreadsText(text) {
  let n = 0;
  for (const { segment } of graphemes.segment(String(text ?? ""))) {
    n += EMOJI_PATTERN.test(segment) ? Buffer.byteLength(segment, "utf8") : Array.from(segment).length;
  }
  return n;
}

/** 本文中の URL を出現順に返す (ASCII の URL 文字だけを拾い、直後の日本語を巻き込まない)。 */
function extractUrls(text) {
  const found = String(text ?? "").match(/https?:\/\/[A-Za-z0-9\-._~:/?#[\]@!$&'()*+,;=%]+/g) || [];
  return found.map((u) => u.replace(/[.,;:!?)\]']+$/, ""));
}

/**
 * stats47.jp へのリンクが UTM (utm_source=threads / utm_medium=social / utm_campaign 有り) を
 * 持つかを検査する (sns-content-standards.md §4)。違反した URL の説明を返す。
 */
function findUtmViolations(text) {
  const out = [];
  for (const raw of extractUrls(text)) {
    let url;
    try {
      url = new URL(raw);
    } catch {
      out.push(`URL として解釈できない: ${raw}`);
      continue;
    }
    if (!STATS47_HOSTS.has(url.hostname)) continue;
    const p = url.searchParams;
    if (p.get("utm_source") !== "threads" || p.get("utm_medium") !== "social" || !p.get("utm_campaign")) {
      out.push(`stats47.jp リンクに utm_source=threads&utm_medium=social&utm_campaign が無い: ${raw}`);
    }
  }
  return out;
}

/** 予定時刻 (JST の date + time) を UTC ミリ秒へ。不正なら NaN。 */
function scheduledAtMs(entry) {
  if (!entry || !DATE_PATTERN.test(entry.date || "") || !TIME_PATTERN.test(entry.time || "")) return NaN;
  const ms = Date.parse(`${entry.date}T${entry.time}:00+09:00`);
  // 2026-02-30 のような存在しない日付は Date が繰り上げるので、往復して一致を確かめる
  if (Number.isNaN(ms)) return NaN;
  const back = new Date(ms + 9 * 3600 * 1000).toISOString();
  return back.slice(0, 10) === entry.date && back.slice(11, 16) === entry.time ? ms : NaN;
}

/** 1 エントリを投稿前に検査する。errors が空なら投稿してよい。 */
function validateEntry(entry) {
  const errors = [];
  if (!entry || typeof entry !== "object") {
    return { errors: ["エントリがオブジェクトではない"], textLength: 0, linkCount: 0 };
  }
  if (Number.isNaN(scheduledAtMs(entry))) {
    errors.push(`date (YYYY-MM-DD) / time (HH:MM, JST) が不正: ${entry.date} ${entry.time}`);
  }
  if (!DOMAIN_PATTERN.test(entry.domain || "")) errors.push(`domain が不正: ${entry.domain}`);
  if (!CONTENT_KEY_PATTERN.test(entry.content_key || "")) {
    errors.push(`content_key が不正: ${entry.content_key}`);
  }
  if (!ENTRY_TYPES.has(entry.type)) errors.push(`type は text / image のみ: ${entry.type}`);

  const text = typeof entry.text === "string" ? entry.text : "";
  // 画像投稿も本文必須: 本文が無いと投稿前の重複確認 (自アカウント直近投稿との照合) ができない
  if (!text.trim()) errors.push("text が空");
  const textLength = countThreadsText(text);
  if (textLength > THREADS_TEXT_MAX) {
    errors.push(`text が ${textLength} 文字で上限 ${THREADS_TEXT_MAX} を超える`);
  }
  const links = new Set(extractUrls(text));
  if (links.size > THREADS_LINK_MAX) {
    errors.push(`リンクが ${links.size} 個で上限 ${THREADS_LINK_MAX} を超える`);
  }
  errors.push(...findUtmViolations(text));

  if (entry.type === "image") {
    const u = entry.image_url;
    if (typeof u !== "string" || !u.startsWith(R2_PUBLIC_BASE)) {
      errors.push(`image_url は ${R2_PUBLIC_BASE} 配下の公開 URL のみ: ${u}`);
    } else {
      let pathname = "";
      try {
        pathname = new URL(u).pathname;
      } catch {
        errors.push(`image_url が URL として不正: ${u}`);
      }
      if (pathname && (!IMAGE_PATH_PATTERN.test(pathname) || pathname.split("/").includes(".."))) {
        errors.push(`image_url は .png / .jpg / .jpeg のみ: ${u}`);
      }
    }
    if (entry.alt_text != null) {
      if (typeof entry.alt_text !== "string") errors.push("alt_text は文字列");
      else if (Array.from(entry.alt_text).length > THREADS_ALT_TEXT_MAX) {
        errors.push(`alt_text が上限 ${THREADS_ALT_TEXT_MAX} 文字を超える`);
      }
    }
  } else if (entry.type === "text") {
    if (entry.image_url != null) errors.push("type=text に image_url がある (image にするか削除する)");
    if (entry.alt_text != null) errors.push("type=text に alt_text がある");
  }
  return { errors, textLength, linkCount: links.size };
}

/**
 * schedule JSON 全体の検査。形式は { "entries": [ ... ] }。
 * domain + content_key は台帳の重複判定キーなので、schedule 内で重複させない
 * (重複すると 2 件目は「投稿済み」と判定されて永遠に出ない)。
 */
function validateSchedule(data) {
  const errors = [];
  const entries = data && Array.isArray(data.entries) ? data.entries : null;
  if (!entries) return { errors: ['schedule は { "entries": [...] } 形式'], entries: [] };
  const seen = new Map();
  entries.forEach((e, i) => {
    const key = `${e?.domain}|${e?.content_key}`;
    if (seen.has(key)) errors.push(`domain+content_key が重複: ${key} (#${seen.get(key)} と #${i})`);
    else seen.set(key, i);
  });
  return { errors, entries };
}

function isActivePost(p) {
  return p && p.platform === "threads" && !p.deleted_at;
}

/** 台帳で domain + content_key + platform=threads が posted なら投稿済み。 */
function isAlreadyPosted(ledger, entry) {
  return (ledger ?? []).some(
    (p) =>
      isActivePost(p) &&
      p.status === "posted" &&
      p.domain === entry.domain &&
      p.content_key === entry.content_key,
  );
}

/** nowMs と同じ JST 日付に posted になった Threads 投稿の件数。 */
function countPostedOnJstDay(ledger, nowMs) {
  const day = (ms) => new Date(ms + 9 * 3600 * 1000).toISOString().slice(0, 10);
  const today = day(nowMs);
  return (ledger ?? []).filter((p) => {
    if (!isActivePost(p) || p.status !== "posted" || !p.posted_at) return false;
    const ms = Date.parse(p.posted_at);
    return !Number.isNaN(ms) && day(ms) === today;
  }).length;
}

/**
 * 各エントリを posted / due / upcoming / missed / invalid に分類し、今回投稿する 1 件を選ぶ。
 * due = 予定時刻を過ぎ、遅れが MAX_LATENESS_MINUTES 以内で、台帳に posted が無い。
 * 1 回の実行で出すのは最早の 1 件だけ (連投を作らない)。
 */
function planRun(entries, { nowMs, ledger, maxLatenessMinutes = MAX_LATENESS_MINUTES }) {
  const rows = (entries ?? []).map((entry, index) => {
    const at = scheduledAtMs(entry);
    let state;
    if (Number.isNaN(at)) state = "invalid";
    else if (isAlreadyPosted(ledger, entry)) state = "posted";
    else if (at > nowMs) state = "upcoming";
    else if (nowMs - at > maxLatenessMinutes * 60 * 1000) state = "missed";
    else state = "due";
    return { index, entry, state, scheduledAtMs: at };
  });
  const due = rows.filter((r) => r.state === "due").sort((a, b) => a.scheduledAtMs - b.scheduledAtMs);
  return { rows, next: due[0] ?? null };
}

const normalizeText = (t) => String(t ?? "").replace(/\r\n/g, "\n").trim();

/**
 * 自アカウントの直近投稿に同じ本文があれば返す。
 * 公開後に台帳の commit-back が落ちると、次の cron は台帳だけを見て二重投稿する。
 * それを API 側の実投稿と照合して止める (見つかった場合は台帳だけ補完する)。
 */
function findRemoteDuplicate(entry, remotePosts, { nowMs, windowHours = REMOTE_DUPLICATE_WINDOW_HOURS }) {
  const want = normalizeText(entry.text);
  if (!want) return null;
  return (
    (remotePosts ?? []).find((p) => {
      if (normalizeText(p.text) !== want) return false;
      const ms = Date.parse(p.timestamp);
      return !Number.isNaN(ms) && nowMs - ms <= windowHours * 3600 * 1000;
    }) ?? null
  );
}

/**
 * 公開後に台帳へ何をするかを決める。posted があれば何もしない、scheduled / draft があれば昇格、
 * 無ければ新規行を作る (IG の ig-ledger-core と同じ方針)。
 */
function decideLedgerAction({ entry, permalink, postedAt, existing }) {
  const same = (existing ?? []).filter(
    (p) => isActivePost(p) && p.domain === entry.domain && p.content_key === entry.content_key,
  );
  if (same.some((p) => p.status === "posted")) return { action: "skip", reason: "already-posted" };

  const firstUtm = extractUrls(entry.text).find((u) => {
    try {
      return STATS47_HOSTS.has(new URL(u).hostname);
    } catch {
      return false;
    }
  });
  const fields = {
    status: "posted",
    posted_at: postedAt,
    post_url: permalink,
    post_type: entry.type,
    caption: entry.text,
    media_path: entry.type === "image" ? entry.image_url : null,
    has_link: extractUrls(entry.text).length > 0 ? 1 : 0,
    utm_url: firstUtm ?? null,
  };
  const pending = same.find((p) => p.status === "scheduled" || p.status === "draft");
  if (pending) return { action: "update", id: pending.id, patch: fields, reason: "promote" };
  return {
    action: "insert",
    record: { platform: "threads", domain: entry.domain, content_key: entry.content_key, ...fields },
    reason: "new",
  };
}

module.exports = {
  THREADS_TEXT_MAX,
  THREADS_LINK_MAX,
  THREADS_ALT_TEXT_MAX,
  THREADS_DAILY_MAX,
  MAX_LATENESS_MINUTES,
  REMOTE_DUPLICATE_WINDOW_HOURS,
  R2_PUBLIC_BASE,
  countThreadsText,
  extractUrls,
  findUtmViolations,
  scheduledAtMs,
  validateEntry,
  validateSchedule,
  isAlreadyPosted,
  countPostedOnJstDay,
  planRun,
  findRemoteDuplicate,
  decideLedgerAction,
};
