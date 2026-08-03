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

/** ログ 1 行 / workflow の出力から、台帳に対して何をすべきかを決める。 */
function decideLedgerAction({ domain, contentKey, permalink, postedAt, existing }) {
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
      },
      reason: "promote",
    };
  }

  return {
    action: "insert",
    record: {
      platform: "instagram",
      post_type: "original",
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

module.exports = { decideLedgerAction, parsePostedLog };
