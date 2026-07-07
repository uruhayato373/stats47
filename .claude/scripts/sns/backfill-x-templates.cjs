/**
 * backfill-x-templates.cjs — 既存 X 投稿の template を決定的パターンマッチで推定 (1 回きり運用)
 *
 * posts.json の X 投稿は template 列が全 null で、勝ちパターン分析の学習データが無い。
 * caption の**構造マーカー**で template を決定的に推定し、`template` + `template_inferred: true`
 * を付与する。推定 (推測ではなく機械的マッチ) と実確定を区別するため、必ずフラグを立てる
 * (analyze-x-winning-patterns はこのフラグ付き行を信頼度 1 段下げて扱う)。
 *
 * マッチしない caption は null のまま残す (捏造しない = evidence-based-judgment)。
 * quote_rt は post_type から template=quote-rt を確定 (これは推定でなく確定なので flag なし)。
 *
 * Usage:
 *   node .claude/scripts/sns/backfill-x-templates.cjs --dry-run   # 推定結果一覧のみ (書き込まない)
 *   node .claude/scripts/sns/backfill-x-templates.cjs --apply     # updateById で付与
 */

const path = require("node:path");
const store = require(path.resolve(__dirname, "../lib/sns-posts-store.cjs"));

// 決定的マーカー (優先順)。§2-0 の template id に対応。
function inferTemplate(caption) {
  const c = caption || "";
  // versus: 対決構文
  if (/\bvs\b/i.test(c) || /対決|どっち/.test(c)) return "versus";
  // question: なぜ + 疑問符
  if (/なぜ/.test(c) && /[?？]/.test(c)) return "question";
  // paradox: 逆説・通説否定
  if (/実は|意外|通説|に反して|なのに.*(低|高|逆)/.test(c)) return "paradox";
  // number: 複数の数値 + 倍差の列挙
  const nums = (c.match(/[0-9０-９][0-9０-９,\.]*/g) || []).length;
  if (/倍/.test(c) && nums >= 3) return "number";
  // shock: 衝撃絵文字 / 倍差の一撃
  if (/🥇|😱|驚|衝撃/.test(c) || (/倍/.test(c) && nums >= 2)) return "shock";
  return null;
}

function main() {
  const args = process.argv.slice(2);
  const apply = args.includes("--apply");
  const dryRun = args.includes("--dry-run") || !apply;

  const xPosts = store
    .loadAll()
    .filter((p) => p.platform === "x" && !p.deleted_at);

  let inferred = 0;
  let confirmed = 0;
  let unmatched = 0;
  const rows = [];
  for (const p of xPosts) {
    if (p.template) continue; // 既に確定済みは触らない
    if (p.post_type === "quote_rt") {
      // 確定 (推定ではない)。flag は立てない。
      confirmed++;
      rows.push({ id: p.id, template: "quote-rt", inferred: false });
      if (apply) store.updateById(p.id, { template: "quote-rt" });
      continue;
    }
    const t = inferTemplate(p.caption);
    if (t) {
      inferred++;
      rows.push({ id: p.id, template: t, inferred: true, excerpt: (p.caption || "").slice(0, 40) });
      if (apply) store.updateById(p.id, { template: t, template_inferred: true });
    } else {
      unmatched++;
    }
  }

  for (const r of rows) {
    console.log(
      `  id=${r.id}  ${r.template}${r.inferred ? " (inferred)" : " (confirmed)"}` +
        (r.excerpt ? `  「${r.excerpt}…」` : ""),
    );
  }
  console.log(
    `\n[backfill-x-templates] ${apply ? "適用" : "dry-run"}: ` +
      `推定 ${inferred} / 確定(quote-rt) ${confirmed} / 未マッチ ${unmatched} (null 維持)`,
  );
  if (dryRun && !apply) {
    console.log("→ 問題なければ --apply で書き込み");
  }
}

main();
