#!/usr/bin/env node
/**
 * kdp-batch.mjs — 全書籍を 1 つのブラウザで順に処理する (draft / verify / publish)。
 *
 *   node .claude/scripts/kdp/kdp-batch.mjs --phase draft                 # 未完の下書きを完成させる (冪等)
 *   node .claude/scripts/kdp/kdp-batch.mjs --phase verify                # read-back 検証のみ (書き込みなし)
 *   node .claude/scripts/kdp/kdp-batch.mjs --phase publish --commit      # ★公開 (verify 通過本のみ・要オーナー承認)
 *   node .claude/scripts/kdp/kdp-batch.mjs --phase status                # 公開後の審査状態 + ASIN 回収 (listed 含む)
 *   ... --ids K-S1-01,K-S1-02                                            # 対象を絞る (既定 = 全冊)
 *
 * 設計:
 *   - フローの実体は lib/kdp-flow.mjs (単発の kdp-publish.mjs と共有・ドリフト防止)
 *   - 1 冊の失敗で止めない (partial-publish)。最後に機械可読な集計を出し、
 *     **1 冊でも失敗があれば exit 1** (silent-green 防止)
 *   - publish は verify を内蔵する: read-back 全項目 PASS の本だけ公開する
 *   - 公開済み (status=listed) はどの phase でも触らない
 */
import { launchContext, waitForLogin, assertAccount, readListings, resolveAsset, writeBackKdpState, sleep } from "./lib/kdp-session.mjs";
import { ensureDraft, verifyDraft, publishDraft, readBookshelfState } from "./lib/kdp-flow.mjs";

const argv = process.argv.slice(2);
const getArg = (n) => {
  const i = argv.indexOf(n);
  return i >= 0 ? argv[i + 1] : null;
};
const PHASE = getArg("--phase") || "verify";
const COMMIT = argv.includes("--commit");
if (!["draft", "verify", "publish", "status"].includes(PHASE)) {
  console.error(`ABORT: --phase は draft|verify|publish (指定: ${PHASE})`);
  process.exit(1);
}
if (PHASE === "publish" && !COMMIT) {
  console.error("ABORT: --phase publish には --commit が必須 (実公開・オーナー承認の明示)");
  process.exit(1);
}

const listings = readListings();
const wanted = getArg("--ids")?.split(",").map((s) => s.trim()).filter(Boolean);
const ids = Object.keys(listings)
  .filter((id) => (wanted ? wanted.includes(id) : true))
  // status phase は公開済みの後追い (ASIN 回収・審査状態) なので listed も対象。他は触らない。
  .filter((id) => (PHASE === "status" ? true : listings[id].status !== "listed"))
  .sort();
if (!ids.length) {
  console.log("[batch] 対象なし (全冊 listed か --ids が空集合)");
  process.exit(0);
}
console.log(`[batch] phase=${PHASE} 対象 ${ids.length} 冊: ${ids.join(", ")}`);

const results = [];
const ctx = await launchContext({ headless: false });
try {
  const page = ctx.pages()[0] || (await ctx.newPage());
  page.on("dialog", async (d) => {
    try {
      await d.accept();
    } catch {}
  });
  const lg = await waitForLogin(page, { tag: "[batch]" });
  if (!lg.ok) {
    console.error("ABORT:", lg.reason);
    process.exit(2);
  }
  const acc = await assertAccount(page, { tag: "[batch]" });
  if (!acc.ok) {
    console.error("ABORT:", acc.reason);
    process.exit(2);
  }

  let consecutiveFails = 0;
  for (const id of ids) {
    // ★連続失敗ブレーカ (2026-08-13 の事故から)。系統的な失敗 (レート制限・ブラウザ死亡) に
    //   入ったまま回し続けると残り全冊を無駄に焼く (実際に 20 冊が Target closed で全滅した)。
    if (consecutiveFails >= 3) {
      results.push({ id, ok: false, detail: "skip (直前 3 冊連続失敗のため中断 — 原因を直してから再実行)" });
      continue;
    }
    const lst = listings[id];
    console.log(`\n===== ${id} ${lst.title.slice(0, 30)} =====`);
    try {
      if (PHASE === "verify") {
        const v = await verifyDraft(page, lst, { tag: "[verify]" });
        results.push({ id, ok: v.ok, detail: v.ok ? "全項目 PASS" : v.problems.join(" / ") });
      } else if (PHASE === "draft") {
        const epub = resolveAsset(lst.epubPath);
        if (!epub.ok) throw new Error(epub.reason);
        const cover = resolveAsset(lst.coverPath);
        const r = await ensureDraft(page, id, lst, {
          epubAbs: epub.abs,
          coverAbs: cover.ok ? cover.abs : null,
          tag: "[kdp]",
        });
        results.push({
          id,
          ok: r.ok,
          detail: r.ok ? (r.already ? "既に完成 (verify PASS)" : "下書き完成 (verify PASS)") : r.warnings.join(" / "),
        });
      } else if (PHASE === "status") {
        // 公開後の後追い: ASIN未割当でも本棚の審査/販売状態をlistingsへ書き戻す。
        if (!lst.draftId) {
          writeBackKdpState(id, { status: "未作成", asin: "" });
          results.push({ id, ok: true, detail: "未作成" });
          continue;
        }
        const shelf = await readBookshelfState(page, lst.draftId, {
          asin: lst.asin || "",
          title: lst.title || "",
        });
        if (!shelf.found) {
          results.push({ id, ok: false, detail: "本棚に見つからず" });
          continue;
        }
        writeBackKdpState(id, shelf);
        results.push({ id, ok: true, detail: `${shelf.status}${shelf.asin ? ` / ${shelf.asin}` : ""}` });
      } else {
        // publish: verify → PASS のみ公開。
        const v = await verifyDraft(page, lst, { tag: "[verify]" });
        if (!v.ok) {
          results.push({ id, ok: false, detail: `verify 不合格のため公開せず: ${v.problems.join(" / ")}` });
          continue;
        }
        const pub = await publishDraft(page, id, lst, { tag: "[publish]" });
        results.push({ id, ok: pub.ok, detail: pub.ok ? `公開確定 (${pub.status}${pub.asin ? ` / ${pub.asin}` : ""})` : pub.reason });
      }
    } catch (e) {
      results.push({ id, ok: false, detail: `例外: ${e instanceof Error ? e.message : String(e)}` });
    }
    const last = results[results.length - 1];
    consecutiveFails = last?.ok ? 0 : consecutiveFails + 1;
    // ★作成数制限は口座の状態なので、以降の全冊が同じ理由で落ちる。
    //   1 冊ごとに details を埋め直してから気づくのは 3〜4 分 × 冊数の純粋な無駄
    //   (ブレーカでも 3 冊ぶん焼く)。名指しで検出したら即打ち切る。
    if (!last?.ok && /作成数制限/.test(last?.detail || "")) {
      console.log("[batch] KDP の作成数制限に到達 — 以降をスキップして終了 (枠が空いてから再実行)");
      for (const rest of ids.slice(ids.indexOf(id) + 1)) {
        results.push({ id: rest, ok: false, detail: "skip (作成数制限)" });
      }
      break;
    }
    // 新規タイトルの連投は KDP 側の作成制限に当たる疑いがあるため間隔を空ける。
    await sleep(PHASE === "status" ? 1000 : 15000);
  }
} finally {
  await ctx.close();
}

// ── 集計 (機械可読 + 人間可読) ──
const okN = results.filter((r) => r.ok).length;
console.log(`\n[batch] ${PHASE} 結果: ${okN}/${results.length} 成功`);
for (const r of results) console.log(`  ${r.ok ? "✅" : "❌"} ${r.id}  ${r.detail}`);
process.exit(okN === results.length ? 0 : 1);
