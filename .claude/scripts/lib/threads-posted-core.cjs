"use strict";

/**
 * Threads の公開済み確認の判定 (純粋関数)。IO は .claude/scripts/sns/verify-threads-posted.cjs が持つ。
 *
 * 台帳 (posts.json) の Threads 行のうち予約時刻を過ぎたもの (status draft / scheduled) を、
 * 自アカウントの公開プロフィールで見えた投稿のまとまりの文字 (ユーザー名・時刻の後に本文が続く) が
 * 本文の 1 行目を含むかで突き合わせ、一致したものだけ
 * posted + permalink にする。時刻の経過だけでは posted にしない (X と同じ方針。memory
 * feedback_x_post_url_integrity)。draft も対象にするのは、launchd の自動補充が台帳を書かず
 * 予約済みを .local の記録ファイルだけに残すため。
 */

/** 本文比較用の正規化: NFC、URL と空白・ゼロ幅文字を除く */
function normalizeText(s) {
  return String(s || "")
    .normalize("NFC")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[\s​-‍﻿]/g, "");
}

/** 照合キー: 本文の最初の空でない行 (投稿ごとに固有の見出し文)。短すぎる行は使わない */
function fingerprint(caption) {
  const line = String(caption || "")
    .split("\n")
    .map((l) => normalizeText(l))
    .find((l) => l.length > 0);
  return line && line.length >= 8 ? line : null;
}

/**
 * @param {Array<{id:number,platform:string,status:string,caption:string,scheduled_at:string,deleted_at?:string}>} rows
 * @param {Array<{permalink:string,text:string,publishedAt?:string|null}>} scraped
 * @param {Date} now
 * @returns {{ updates: Array<{id:number,post_url:string,posted_at:string}>, overdue: number[] }}
 *   updates: posted にする行 / overdue: 予約時刻から 24 時間以上たっても見つからない行
 */
function matchPosted(rows, scraped, now) {
  const due = rows.filter(
    (r) =>
      r.platform === "threads" &&
      !r.deleted_at &&
      (r.status === "draft" || r.status === "scheduled") &&
      Date.parse(r.scheduled_at) <= now.getTime(),
  );
  const pool = scraped.map((p) => ({ ...p, norm: normalizeText(p.text), used: false }));
  const updates = [];
  const overdue = [];
  for (const r of due) {
    const fp = fingerprint(r.caption);
    const hit = fp ? pool.find((p) => !p.used && p.norm.includes(fp)) : null;
    if (hit) {
      hit.used = true;
      updates.push({ id: r.id, post_url: hit.permalink, posted_at: hit.publishedAt || r.scheduled_at });
    } else if (now.getTime() - Date.parse(r.scheduled_at) >= 24 * 3600e3) {
      overdue.push(r.id);
    }
  }
  return { updates, overdue };
}

module.exports = { normalizeText, fingerprint, matchPosted };
