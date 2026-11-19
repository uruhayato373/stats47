/**
 * IG 投稿を投稿台帳 (posts.json) へ記録するときの判定。
 *
 * ## なぜこれが要るか
 *
 * `.claude/rules/sns-content-standards.md` §3 は **posts.json を全 SNS 投稿の SSOT**
 * と定め、書込口を `sns-posts-store.cjs` / `/mark-sns-posted` のみに限っている。
 * しかし `post-instagram-scheduled.yml` は投稿後に `ig-posted-log.jsonl` へ append
 * するだけで posts.json に一切触れておらず、**cron 投稿が台帳に載らない**状態が
 * 2026-05-18 から続いていた (2026-08-03 実測で log にしか無い投稿が 94 件)。
 *
 * 台帳に無い投稿は `/update-sns-metrics` の対象にならないため、**主力チャネルの
 * リーチ・保存率が計測できない**。ig-posted-log は二重投稿の防止だけが役割で、
 * SSOT ではない (rules に記載が無い)。
 *
 * ## 判定を純粋関数に切る理由
 *
 * 既存 posted と重複させない・scheduled があれば昇格させる、の 2 点を取り違えると
 * 台帳が二重行で汚れる。IO から切り離してテストで固定する。
 */

/**
 * ログ 1 行 / workflow の出力から、台帳に対して何をすべきかを決める。
 * postType は実際に投稿した形式 (carousel 等)。省略時は従来どおり "original"。
 */
function decideLedgerAction({ domain, contentKey, permalink, postedAt, postType, existing }) {
  if (!domain || !contentKey) {
    return { action: "skip", reason: "missing-key" };
  }
  const same = (existing ?? []).filter(
    (p) =>
      p.platform === "instagram" &&
      p.domain === domain &&
      p.content_key === contentKey &&
      !p.deleted_at,
  );

  // 既に posted なら何もしない (再実行・backfill の再走で二重行を作らない)
  const posted = same.find((p) => p.status === "posted");
  if (posted) {
    // permalink だけ欠けている行は補完する (log が唯一 URL を持っている場合がある)
    if (permalink && !posted.post_url) {
      return { action: "update", id: posted.id, patch: { post_url: permalink }, reason: "fill-url" };
    }
    return { action: "skip", reason: "already-posted" };
  }

  // scheduled / draft があれば posted へ昇格させる (新規行を足すと予約が宙に浮く)
  const pending = same.find((p) => p.status === "scheduled" || p.status === "draft");
  if (pending) {
    return {
      action: "update",
      id: pending.id,
      patch: {
        status: "posted",
        posted_at: postedAt,
        ...(permalink ? { post_url: permalink } : {}),
        ...(postType ? { post_type: postType } : {}),
      },
      reason: "promote",
    };
  }

  return {
    action: "insert",
    record: {
      platform: "instagram",
      post_type: postType || "original", // 空文字 (workflow の grep 失敗) も未指定として扱う
      domain,
      content_key: contentKey,
      post_url: permalink ?? null,
      status: "posted",
      posted_at: postedAt,
    },
    reason: "new",
  };
}

/** ig-posted-log.jsonl の本文を行オブジェクトへ。壊れた行は落とす (log は追記専用で修復しない)。 */
function parsePostedLog(text) {
  const out = [];
  for (const line of String(text).split("\n")) {
    const t = line.trim();
    if (!t) continue;
    try {
      const e = JSON.parse(t);
      if (e && e.content_key) out.push(e);
    } catch {
      /* 壊れた行は無視する */
    }
  }
  return out;
}

const SHORTCODE = /\/(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/;
const shortcodeOf = (url) => (String(url || "").match(SHORTCODE) || [])[1] ?? null;
const normCaption = (s) => String(s || "").replace(/\r\n/g, "\n").trim();

/**
 * Graph API の media 一覧 ({id, permalink, caption}) と台帳の Instagram 行を結び付ける。
 * Instagram の permalink の shortcode は media_id ではなく、相互に変換できないため API の一覧で照合する。
 *   1. 台帳に post_url がある行: permalink の shortcode が一致する media の id を external_id にする
 *   2. post_url の無い posted 行: 本文が完全一致し、台帳側・media 側とも 1 件だけのときに限り
 *      external_id と post_url を入れる (同じ本文が複数あると取り違えるので推定しない)
 * 既に別の external_id を持つ行は上書きせず conflicts に出す。
 * 戻り値: { patches: [{id, patch}], mediaToId: Map<media_id, 台帳 id>, conflicts, unmatchedRows }
 */
function matchIgMediaToLedger(posts, media) {
  const igRows = posts.filter((p) => p.platform === "instagram");
  const byShortcode = new Map(media.map((m) => [shortcodeOf(m.permalink), m]).filter(([k]) => k));
  const mediaToId = new Map();
  const patches = [];
  const conflicts = [];
  const take = (row, m, extra = {}) => {
    if (row.external_id && row.external_id !== m.id) {
      conflicts.push({ id: row.id, external_id: row.external_id, media_id: m.id });
      return;
    }
    mediaToId.set(m.id, row.id);
    if (!row.external_id || Object.keys(extra).length) patches.push({ id: row.id, patch: { external_id: m.id, ...extra } });
  };

  for (const row of igRows) {
    const m = byShortcode.get(shortcodeOf(row.post_url));
    if (m) take(row, m);
  }

  const used = new Set(mediaToId.keys());
  const freeMedia = media.filter((m) => !used.has(m.id) && normCaption(m.caption));
  const orphanRows = igRows.filter((r) => !r.post_url && r.status === "posted" && !r.deleted_at && normCaption(r.caption));
  const countBy = (items, key) => items.reduce((acc, x) => acc.set(key(x), (acc.get(key(x)) ?? 0) + 1), new Map());
  const mediaCount = countBy(freeMedia, (m) => normCaption(m.caption));
  const rowCount = countBy(orphanRows, (r) => normCaption(r.caption));
  const unmatchedRows = [];
  for (const row of orphanRows) {
    const c = normCaption(row.caption);
    const m = mediaCount.get(c) === 1 && rowCount.get(c) === 1 ? freeMedia.find((x) => normCaption(x.caption) === c) : null;
    if (m) take(row, m, { post_url: m.permalink });
    else unmatchedRows.push(row.id);
  }
  return { patches, mediaToId, conflicts, unmatchedRows };
}

module.exports = { decideLedgerAction, parsePostedLog, matchIgMediaToLedger, shortcodeOf };
