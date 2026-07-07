/**
 * promote-scheduled-x.cjs — 予約時刻を過ぎた X の scheduled 投稿を posted に昇格する
 *
 * publish-x --from-queue は予約成功で status=scheduled にする (X 側が予約時刻に自動投稿)。
 * 予約時刻を過ぎたら台帳上も posted に昇格させる。post_url は自動取得できないため空のまま
 * (後から /mark-sns-posted --url で補完可)。posted_at は予約時刻の JST 日付。
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

  for (const p of due) {
    console.log(`  id=${p.id}  ${p.content_key} [${p.template}]  ${p.scheduled_at} → posted`);
    if (apply) {
      store.updateById(p.id, { status: "posted", posted_at: jstDate(p.scheduled_at) });
    }
  }
  console.log(
    `\n[promote-scheduled-x] ${apply ? "昇格" : "dry-run"}: ${due.length} 件` +
      (apply ? "" : " (--apply で反映)"),
  );
}

main();
