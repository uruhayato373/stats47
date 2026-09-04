/**
 * promote-scheduled-x.cjs — 予約時刻を過ぎた X の scheduled 投稿を posted に昇格する
 *
 * publish-x --from-queue は予約成功で status=scheduled にする (X 側が予約時刻に自動投稿)。
 * 予約時刻を過ぎ、実投稿 URL が確認済みの行だけ posted に昇格させる。
 * 時刻経過だけでは X 側の投稿成功を証明できないため、post_url が無い行は保留する。
 *
 * Usage:
 *   node .claude/scripts/sns/promote-scheduled-x.cjs --dry-run
 *   node .claude/scripts/sns/promote-scheduled-x.cjs --apply
 */

const path = require("node:path");
const store = require(path.resolve(__dirname, "../lib/sns-posts-store.cjs"));

function jstDate(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return (iso || "").slice(0, 10);
  return new Date(d.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function isVerifiedPostUrl(postUrl) {
  return /^https:\/\/(x\.com|twitter\.com)\//.test(postUrl || "");
}

function main() {
  const apply = process.argv.includes("--apply");
  const now = Date.now();
  const due = store
    .loadAll()
    .filter(
      (p) =>
        p.platform === "x" &&
        p.status === "scheduled" &&
        p.scheduled_at &&
        !p.deleted_at &&
        Date.parse(p.scheduled_at) <= now,
    );

  const verified = due.filter((p) => isVerifiedPostUrl(p.post_url));
  const unverified = due.filter((p) => !verified.includes(p));

  for (const p of verified) {
    console.log(`  id=${p.id}  ${p.content_key} [${p.template}]  ${p.scheduled_at} → posted`);
    if (apply) {
      store.updateById(p.id, {
        status: "posted",
        posted_at: jstDate(p.scheduled_at),
      });
    }
  }
  for (const p of unverified) {
    console.log(`  HOLD id=${p.id}  ${p.content_key}  ${p.scheduled_at} (post_url 未確認)`);
  }
  console.log(
    `\n[promote-scheduled-x] ${apply ? "昇格" : "dry-run"}: ${verified.length} 件` +
      ` / 保留 ${unverified.length} 件` +
      (apply ? "" : " (--apply で反映)"),
  );
}

module.exports = { isVerifiedPostUrl };

if (require.main === module) main();
