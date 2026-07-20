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

const require = createRequire(import.meta.url);
const core = require("./lib/a8-scout-core.mjs");
const PROJECT_ROOT = path.resolve(new URL(".", import.meta.url).pathname, "../../..");
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

// 候補 = approved かつ vertical 解決済み かつ blocklist 非該当。
const approved = Object.values(cat.entries).filter(
  (e) =>
    e.status === "approved" &&
    e.vertical &&
    !core.isBlocked({ name: e.name, genre: e.genre }, curated),
);

// vertical 別に priority (= 確定EPCバンド) 降順、tie は confirmRatePct 降順 → programId 昇順。
const byVertical = {};
for (const e of approved) {
  e._priority = core.computePriority(e, curated);
  e._ce = core.confirmedEpc(e);
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

if (!APPLY) {
  console.log("🧪 dry-run: catalog 未変更。--apply でフラグ + priority を書き込む。");
  process.exit(0);
}

// フラグと priority を catalog に刻む (既存の選定は一旦クリアして付け直す)。
const selectedIds = new Set(selected.map((e) => e.programId));
for (const e of Object.values(cat.entries)) {
  if (e.status !== "approved") continue;
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
