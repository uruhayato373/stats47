/**
 * select-for-register.mjs — catalog approved から「登録する案件」を vertical 別に精選する。
 *
 * 現行の配信構造は同 vertical×枠で priority 上位 1 banner + text 2 しか出ないため、全 134 件登録は
 * 無意味。vertical ごとに確定 EPC 上位 N (既定 4) を選び selectedForRegister フラグ + priority を刻む。
 * harvest はこのフラグ付き approved のみ処理する。
 *
 * blocklist 除外・vertical 解決済み・数値ありを条件にする。thin vertical を先に埋める並びで表示。
 *
 * 使い方:
 *   node .claude/scripts/ads/select-for-register.mjs [--per-vertical N] [--apply]
 *     既定 dry-run (選定結果を表示のみ)。--apply で catalog にフラグ + priority を書き込む。
 */
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const core = require("./lib/a8-scout-core.mjs");
const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const CATALOG = path.join(PROJECT_ROOT, ".claude/state/ads/a8-catalog.json");
const INVENTORY = path.join(PROJECT_ROOT, ".claude/state/ads/inventory-latest.json");

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const perVertical = (() => {
  const i = args.indexOf("--per-vertical");
  return i >= 0 ? Number(args[i + 1]) : 4;
})();

const curated = core.loadCurated();
const cat = JSON.parse(fs.readFileSync(CATALOG, "utf8"));
const thin = (() => {
  try {
    return new Set(JSON.parse(fs.readFileSync(INVENTORY, "utf8")).coverage?.thinVerticals ?? []);
  } catch {
    return new Set();
  }
})();

// blocklist 非該当の approved 全件。**vertical 未解決も含める**。
// 以前は候補条件に `e.vertical &&` があり、軸未解決の案件は確定EPC が計算されず
// 「実力を知られないまま永久に配線されない」盲点になっていた
// (2026-07-27 実測: ahamo が確定EPC 113円 = energy トップ 58円 の 2 倍でありながら未評価)。
// 指標は全件に刻み、選定だけを vertical 解決済みに限る。
const approvedAll = Object.values(cat.entries).filter(
  (e) => e.status === "approved" && !core.isBlocked({ name: e.name, genre: e.genre }, curated),
);

// 確定EPC と priority バンドは軸に依存しないので全件で算出する。
// あわせて、保存値が null の軸は curated の verticalKeywords で**再解決**する。
// これが無いと a8-curated.json にキーワードを足しても既存 catalog エントリには効かず、
// 追加が事実上 no-op になる (実測 2026-07-27: "ahamo" を energy に足しても保存値 null のまま選定外)。
// 決定的関数の再適用であって意味判断ではないので、ここで自動的に埋めてよい。
// 解決できないものは pending のまま残し、下の警告で晒す (偽の軸を付けない)。
let reresolved = 0;
for (const e of approvedAll) {
  e._priority = core.computePriority(e, curated);
  e._ce = core.confirmedEpc(e);
  if (!e.vertical) {
    const v = core.resolveVertical({ name: e.name, genre: e.genre }, curated);
    if (v) {
      e._reresolvedVertical = v;
      reresolved++;
    }
  }
}
if (reresolved > 0) {
  console.log(`ℹ️  verticalKeywords で軸を再解決: ${reresolved} 件 (保存値が null だったもの)`);
}

// vertical 別に priority (= 確定EPCバンド) 降順、tie は confirmRatePct 降順 → programId 昇順。
const approved = approvedAll.filter((e) => e.vertical || e._reresolvedVertical);
for (const e of approved) e.vertical ??= e._reresolvedVertical;
const byVertical = {};
for (const e of approved) {
  (byVertical[e.vertical] ??= []).push(e);
}
for (const v of Object.keys(byVertical)) {
  byVertical[v].sort(
    (a, b) =>
      b._priority - a._priority ||
      b._ce - a._ce ||
      (b.confirmRatePct || 0) - (a.confirmRatePct || 0) ||
      String(a.programId).localeCompare(String(b.programId)),
  );
}

// thin vertical を先に並べる (第1バッチ優先)。
const verticals = Object.keys(byVertical).sort((a, b) => (thin.has(b) ? 1 : 0) - (thin.has(a) ? 1 : 0));

const selected = [];
for (const v of verticals) {
  const top = byVertical[v].slice(0, perVertical);
  for (const e of top) selected.push(e);
  console.log(
    `\n[${v}${thin.has(v) ? " ★thin" : ""}] 上位 ${top.length}/${byVertical[v].length}:`,
  );
  for (const e of top) {
    console.log(`  pri${e._priority} 確定EPC${e._ce.toFixed(0)} cr${e.confirmRatePct || 0}% ${e.name.slice(0, 34)}`);
  }
}

console.log(`\n合計 選定 ${selected.length} 件 (${verticals.length} vertical × 最大 ${perVertical})`);

// ★盲点の自己申告: 軸未解決だが「配信中トップの最小値」を確定EPC で上回る案件を必ず晒す。
// これが無いと a8-curated.json の verticalKeywords 欠落が静かに機会損失になる
// (実測 2026-07-27: 23 件が軸未解決のまま放置され、うち ahamo は energy トップの 2 倍だった)。
// 正典: .claude/rules/affiliate-ads-standards.md §0 (意図軸ハブ) / §10 (scout パイプライン)。
const unresolved = approvedAll
  // deliveryDecision (no-fit / blocked-genre) は「解決済みの配信しない判断」なので警告に混ぜない
  // (2026-07-28: 全 25 件の明示判定を導入。未解決 = 判断がまだ無いものだけ)
  .filter((e) => !e.vertical && !e.deliveryDecision)
  .sort((a, b) => b._ce - a._ce);
if (unresolved.length > 0) {
  // 比較相手は **実際に配信中 (registered)** の各軸トップの中で最も弱い値。
  // approved 候補から取ると 0 円になり閾値が意味を失う (候補は配信されていない)。
  const deployedTopByVertical = {};
  for (const e of Object.values(cat.entries)) {
    if (e.status !== "registered" || !e.vertical) continue;
    const ce = core.confirmedEpc(e);
    deployedTopByVertical[e.vertical] = Math.max(deployedTopByVertical[e.vertical] ?? 0, ce);
  }
  const deployedTops = Object.values(deployedTopByVertical);
  const deployedFloor = deployedTops.length > 0 ? Math.min(...deployedTops) : 0;
  const worthWiring = unresolved.filter((e) => e._ce > deployedFloor);
  console.log(
    `\n⚠️  vertical 未解決 ${unresolved.length} 件 (選定対象外)。` +
      `うち確定EPC が配信中トップの最小値 ${deployedFloor.toFixed(0)}円 を上回る = ${worthWiring.length} 件`,
  );
  for (const e of worthWiring.slice(0, 10)) {
    console.log(`  確定EPC${e._ce.toFixed(0)}円 cr${e.confirmRatePct || 0}% ${e.name.slice(0, 42)}`);
  }
  if (worthWiring.length > 0) {
    console.log(
      "  → a8-curated.json の verticalKeywords に写像を追加して解決する (意図軸は affiliate-manager の判断)。",
    );
  }
}

if (!APPLY) {
  console.log("🧪 dry-run: catalog 未変更。--apply でフラグ + priority を書き込む。");
  process.exit(0);
}

// フラグと priority を catalog に刻む (既存の選定は一旦クリアして付け直す)。
const selectedIds = new Set(selected.map((e) => e.programId));
for (const e of Object.values(cat.entries)) {
  if (e.status !== "approved") continue;
  // 再解決した軸は追跡可能な形で残す (どのタイミングで誰が埋めたか分かるように history に note)。
  if (e._reresolvedVertical) {
    (e.history ??= []).push({
      to: "approved",
      at: new Date().toISOString(),
      note: `vertical-resolved-from-curated:${e._reresolvedVertical}`,
    });
    delete e._reresolvedVertical;
  }
  if (selectedIds.has(e.programId)) {
    e.selectedForRegister = true;
    e.priority = core.computePriority(e, curated);
  } else {
    delete e.selectedForRegister;
  }
}
cat.updatedAt = args.includes("--now") ? args[args.indexOf("--now") + 1] : cat.updatedAt;
fs.writeFileSync(CATALOG, JSON.stringify(cat, null, 2) + "\n", "utf8");
console.log(`✅ ${selected.length} 件に selectedForRegister + priority を刻印。次: a8-browser.ts harvest`);
