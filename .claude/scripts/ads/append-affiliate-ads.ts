/**
 * append-affiliate-ads.ts — a8-catalog の harvested エントリを affiliate-ads-data.ts (SSOT) へ
 * 機械追記し、多段ゲートを通してから catalog を registered に昇格させる。
 *
 * ゲート順 (1 つでも fail → 実行前に保持した byte 列で SSOT を復元し中止。git checkout は使わない):
 *   1. tsc         : npx tsc --noEmit -p apps/web/tsconfig.json
 *   2. audit       : audit-affiliate-inventory.ts --check-size (canonical サイズ)
 *   3. export検証  : export-affiliate-ads-snapshot.ts --validate-only (vertical 整合)
 *   4. compliance  : audit-affiliate-compliance.ts --check (構造)
 *
 * 追記の純ロジックは a8-append-core.mjs、状態遷移は a8-scout-core.mjs に委譲。
 *
 * 使い方:
 *   npx tsx .claude/scripts/ads/append-affiliate-ads.ts            # dry-run (追記→ゲート→復元、確認のみ)
 *   npx tsx .claude/scripts/ads/append-affiliate-ads.ts --apply    # 実追記 (ゲート pass で永続化 + catalog registered)
 *
 * ★ commit / push は行わない (affiliate-manager / cron が担当)。本スクリプトは SSOT 変更 + ゲートまで。
 */
import * as path from "path";
import * as fs from "fs";
import { execFileSync } from "child_process";
import { createRequire } from "module";

import { AFFILIATE_OFFER_PROFILES } from "../../../apps/web/scripts/affiliate-offer-profiles-data";

const require = createRequire(import.meta.url);
const core = require("./lib/a8-scout-core.mjs");
const appendCore = require("./lib/a8-append-core.mjs");

const PROJECT_ROOT = path.resolve(__dirname, "../../..");
const ADS_DATA = path.join(PROJECT_ROOT, "apps/web/scripts/affiliate-ads-data.ts");
const CATALOG_PATH = path.join(PROJECT_ROOT, ".claude/state/ads/a8-catalog.json");

const APPLY = process.argv.includes("--apply");

function loadCatalog(): any {
  return JSON.parse(fs.readFileSync(CATALOG_PATH, "utf8"));
}
function saveCatalog(cat: any): void {
  cat.updatedAt = new Date().toISOString();
  fs.writeFileSync(CATALOG_PATH, JSON.stringify(cat, null, 2) + "\n", "utf8");
}

// ★ npx を経由しない (2026-07-28 修正)。Windows では `npx` = `npx.cmd` で
//   execFileSync が ENOENT、`.cmd` を明示しても Node 22 は shell 無しの `.cmd` 起動を
//   拒否して EINVAL になる (CVE-2024-27980 の緩和策)。`shell: true` は引数のクォート事故を
//   招くので使わず、**ローカルバイナリを node で直接起動**する。npx の解決を挟まない分速い。
const NODE = process.execPath;
const TSC = path.join(PROJECT_ROOT, "node_modules/typescript/bin/tsc");
const TSX = path.join(PROJECT_ROOT, "node_modules/tsx/dist/cli.mjs");

/** ゲート 1 本を実行。exit≠0 で throw。 */
function runGate(label: string, cmd: string, args: string[], env?: NodeJS.ProcessEnv): void {
  console.log(`  gate: ${label} ...`);
  execFileSync(cmd, args, { cwd: PROJECT_ROOT, stdio: "pipe", env: env ?? process.env });
  console.log(`  gate: ${label} ✅`);
}

function runAllGates(): void {
  runGate("tsc", NODE, [TSC, "--noEmit", "-p", "apps/web/tsconfig.json"]);
  runGate("audit-size", NODE, [TSX, ".claude/scripts/ads/audit-affiliate-inventory.ts", "--check-size"]);
  // export 検証は repository が server-only を読むため react-server condition が要る。
  runGate(
    "export-validate",
    NODE,
    [TSX, "apps/web/scripts/export-affiliate-ads-snapshot.ts", "--validate-only"],
    { ...process.env, NODE_OPTIONS: `${process.env.NODE_OPTIONS ?? ""} --conditions react-server`.trim() },
  );
  runGate("compliance", NODE, [TSX, ".claude/scripts/ads/audit-affiliate-compliance.ts", "--check"]);
}

/**
 * SSOT が実行前から dirty (git HEAD と差分あり) かを read-only で判定する。
 * dirty のまま --apply すると、ゲート失敗時の巻き戻しで**ユーザーの未コミット変更ごと**
 * 消すか、逆に残すかの区別がつかない。preflight で拒否する (doc 42 §9.2)。
 */
function isSsotDirty(): boolean {
  try {
    execFileSync("git", ["diff", "--quiet", "--", ADS_DATA], { cwd: PROJECT_ROOT, stdio: "pipe" });
    return false;
  } catch {
    return true;
  }
}

/**
 * ゲート失敗時の巻き戻し: **実行前に保持した byte 列**を atomic (tmp + rename) に書き戻す。
 * `git checkout --` は使わない — HEAD へ戻すため、実行前に存在した未コミット変更まで消す
 * (doc 42 §9.2 / §19。2026-07-28 の Phase 0 監査で指摘)。
 */
function restoreSsot(originalBytes: Buffer): void {
  const tmp = `${ADS_DATA}.rollback-tmp`;
  fs.writeFileSync(tmp, originalBytes);
  fs.renameSync(tmp, ADS_DATA);
  console.log("↩️  affiliate-ads-data.ts を実行前の内容 (byte 列) に復元しました。");
}

function nowStr(): string {
  const jst = new Date(Date.now() + 9 * 3600 * 1000);
  return jst.toISOString().slice(0, 19).replace("T", " ");
}

function main(): void {
  const cat = loadCatalog();
  const curated = core.loadCurated(); // priority 算出係数 (priorityBands)
  // register 対象 = harvested かつ vertical 解決済 (pending-vertical は対象外)。
  // 1 エントリから複数 draft (banner + text) を出せるので {entry, draft} に展開する。
  const targets: Array<{ entry: any; draft: any; fromPending?: boolean }> = [];
  for (const e of core.entriesByStatus(cat, "harvested")) {
    if (e.adDraft && e.vertical) targets.push({ entry: e, draft: e.adDraft });
  }
  // ★ pendingDrafts は **status を問わず**拾う。registered は状態機械上 harvested へ戻せない
  //   (registered → published|error のみ) ため、text 在庫の後追い登録はこの経路で行う。
  //   二重登録は a8mat 突合が防ぐ。
  for (const e of Object.values(cat.entries ?? {}) as any[]) {
    if (!Array.isArray(e.pendingDrafts) || !e.vertical) continue;
    for (const d of e.pendingDrafts) targets.push({ entry: e, draft: d, fromPending: true });
  }

  if (targets.length === 0) {
    console.log("register 対象 (harvested + vertical 解決済 + adDraft / pendingDrafts) がありません。");
    const pending = core.entriesByStatus(cat, "pending-vertical");
    if (pending.length) {
      console.log(`⏸  pending-vertical ${pending.length} 件 (--set-vertical で解決してから register):`);
      for (const p of pending) console.log(`    - ${p.programId} (${p.name})`);
    }
    return;
  }

  // 新規 active creative は、成果条件を確認済みの offer profile が先に存在するときだけ登録する。
  // 未分類profileの自動生成は action/friction の推測確定になるため fail-closed にする。
  const offerByRef = new Map(AFFILIATE_OFFER_PROFILES.map((profile) => [profile.programRef, profile]));
  const profileErrors: string[] = [];
  for (const { entry } of targets) {
    const programRef = `a8:${entry.programId}`;
    const profile = offerByRef.get(programRef);
    if (!profile) {
      profileErrors.push(`${programRef}: offer profile 不在`);
      continue;
    }
    if (["pending-classification", "blocked", "paused"].includes(profile.portfolioStatus)) {
      profileErrors.push(`${programRef}: portfolioStatus=${profile.portfolioStatus}`);
    }
    if (!profile.allowedVerticals.includes(entry.vertical)) {
      profileErrors.push(`${programRef}: vertical=${entry.vertical} は profile allowlist 外`);
    }
  }
  if (profileErrors.length > 0) {
    console.error(
      "🚨 active広告の登録前に affiliate-offer-profiles-data.ts で成果条件・負担・lane を確認してください:\n" +
        [...new Set(profileErrors)].map((error) => `  - ${error}`).join("\n"),
    );
    process.exit(1);
  }

  // ★ 実行前 byte 列を保持 (ゲート失敗時の巻き戻しはこれを書き戻す。git checkout は使わない)
  const originalBytes = fs.readFileSync(ADS_DATA);
  let src = originalBytes.toString("utf8");
  const v = appendCore.validateTail(src);
  if (!v.ok) {
    console.error(`🚨 SSOT の末尾構造が不正 (${v.error})。追記を中止します。`);
    process.exit(1);
  }
  if (APPLY && isSsotDirty()) {
    console.error(
      "🚨 affiliate-ads-data.ts に未コミットの差分があります。--apply は clean な状態でだけ実行できます\n" +
        "   (ゲート失敗時の巻き戻しで未コミット変更の帰属が曖昧になるため。先に commit してから再実行)。",
    );
    process.exit(1);
  }

  // 追記 (メモリ上)。id 衝突は逐次 uniqueId で解消。a8mat 一致は既登録として skip (二重登録防止=第5ゲート)。
  const registered: Array<{ programId: string; id: string; name: string }> = [];
  const skippedDup: Array<{ programId: string; name: string; a8mat: string }> = [];
  const existingA8mats: Set<string> = appendCore.extractA8mats(src);
  const stamp = nowStr();
  for (const { entry, draft: baseDraft } of targets) {
    const a8mat = appendCore.draftA8mat(baseDraft);
    if (a8mat && existingA8mats.has(a8mat)) {
      // 同一 a8mat が既に SSOT に在る = 既登録。追記せず catalog を registered 同期する。
      skippedDup.push({ programId: entry.programId, name: entry.name, a8mat });
      continue;
    }
    const ids = appendCore.extractIds(src);
    const id = appendCore.uniqueId(baseDraft.id, ids);
    // priority は catalog entry の確定EPC (EPC×確定率) からバンド式で決定的に算出 (buildAdDraft の
    // 既定値 50 を上書き)。targetRankingKeys があれば +bonus。高EPC案件を上位に出すための要。
    const priority = core.computePriority(entry, curated);
    const draft = { ...baseDraft, id, priority, createdAt: stamp, updatedAt: stamp };
    const literal = appendCore.renderEntry(draft, stamp);
    src = appendCore.insertEntry(src, literal);
    if (a8mat) existingA8mats.add(a8mat); // 同一バッチ内の重複も弾く
    registered.push({ programId: entry.programId, id, name: `${entry.name} [${baseDraft.adType}]` });
  }

  console.log(`追記対象 ${registered.length} 件 (a8mat 重複 skip ${skippedDup.length} 件):`);
  for (const r of registered) console.log(`  + ${r.id} (${r.name})`);
  for (const s of skippedDup) console.log(`  ⏭ 既登録 skip: ${s.name} (a8mat=${s.a8mat})`);

  if (!APPLY) {
    // dry-run: 一時ファイルに書いてゲートは実行しない (SSOT を触らない)。
    const tmp = path.join(PROJECT_ROOT, ".local/a8-append-preview.ts");
    fs.mkdirSync(path.dirname(tmp), { recursive: true });
    fs.writeFileSync(tmp, src, "utf8");
    console.log(`🧪 dry-run: プレビューを ${path.relative(PROJECT_ROOT, tmp)} に出力 (SSOT 未変更)。--apply で実追記。`);
    return;
  }

  // --apply: SSOT に追記があればゲート実行。全て a8mat 重複 skip なら SSOT 無変更 → ゲート省略。
  if (registered.length > 0) {
    fs.writeFileSync(ADS_DATA, src, "utf8");
    try {
      runAllGates();
    } catch (e) {
      console.error("🚨 ゲート失敗:", (e as Error).message);
      restoreSsot(originalBytes);
      process.exit(1);
    }
  }

  // catalog 同期: 追記分・a8mat 重複分いずれも registered に昇格 (重複分は既存 SSOT エントリで既に live)。
  // ★ 既に registered のエントリ (pendingDrafts 経由の text 追加) は遷移させない。
  //   registered → registered は状態機械が invalid transition として throw する。
  const cat2 = loadCatalog();
  const promote = (programId: string, meta: Record<string, unknown>) => {
    const e = cat2.entries[programId];
    if (!e || e.status === "registered" || e.status === "published") return;
    cat2.entries[programId] = core.transition(e, "registered", { at: new Date().toISOString(), ...meta });
  };
  for (const r of registered) promote(r.programId, { adId: r.id });
  for (const s of skippedDup) promote(s.programId, { note: `already-registered-a8mat:${s.a8mat}` });
  // 追記済みの pendingDrafts を消す (再実行で二重に積まないため。a8mat 突合でも防げるが状態を残さない)。
  let clearedPending = 0;
  for (const e of Object.values(cat2.entries ?? {}) as any[]) {
    if (Array.isArray(e.pendingDrafts) && e.pendingDrafts.length > 0) {
      clearedPending += e.pendingDrafts.length;
      delete e.pendingDrafts;
    }
  }
  saveCatalog(cat2);
  if (clearedPending > 0) console.log(`  pendingDrafts ${clearedPending} 件を消化`);
  console.log(
    `✅ SSOT 追記 ${registered.length} 件 + 既登録同期 ${skippedDup.length} 件を catalog registered。commit/push は affiliate-manager / cron。`,
  );
}

main();
