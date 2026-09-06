#!/usr/bin/env node
/**
 * kdp-publish.mjs — KDP 電子書籍を kdp-listings.json の内容から出品する Playwright オペレータ (単発)。
 * coconala-publish.mjs と同じ安全弁 (account assert / draft-first / --commit gate / 偽成功を報告しない)。
 *
 *   node .claude/scripts/kdp/kdp-publish.mjs --id K-S1-01 --probe     # 出品フォームの構造を dump (セレクタ調整用・書き込みなし)
 *   node .claude/scripts/kdp/kdp-publish.mjs --id K-S1-01             # 下書きを完成させる (既定・冪等)
 *   node .claude/scripts/kdp/kdp-publish.mjs --id K-S1-01 --verify    # read-back 検証のみ (書き込みなし)
 *   node .claude/scripts/kdp/kdp-publish.mjs --id K-S1-01 --commit    # 公開 (★実公開・要オーナー承認)
 *
 * ★フローの実体は lib/kdp-flow.mjs (kdp-batch.mjs と共有・ドリフト防止)。
 *   - ensureDraft: verify で欠けた項目だけ埋める (details から全部やり直さない)
 *   - publishDraft: verify PASS → 公開 → **本棚 read-back** で確定
 * ★税務情報 (Tax interview)・銀行口座が未完了だと KDP は公開させない。これは人間が事前に完了させる。
 * ★KU (KDP Select 独占) 登録は kdp-listings.json の kuEnrolled=false を尊重 (当面 未登録=販売のみ)。
 */
import { writeFileSync } from "node:fs";
import {
  ROOT, launchContext, waitForLogin, assertAccount, readListings, resolveAsset, shotPath, sleep,
} from "./lib/kdp-session.mjs";
import { ensureDraft, verifyDraft, publishDraft } from "./lib/kdp-flow.mjs";
import { assertKindleReleaseReady } from "./lib/kdp-release-gate.mjs";

const argv = process.argv.slice(2);
const getArg = (n) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : null; };
const ID = getArg("--id");
const COMMIT = argv.includes("--commit");
const VERIFY = argv.includes("--verify");
const PROBE = argv.includes("--probe");
const UPDATE = argv.includes("--update");
if (!ID) { console.error("--id <K-S1-01> required"); process.exit(1); }

const listings = readListings();
const lst = listings[ID];
if (!lst) { console.error(`ABORT: kdp-listings.json に "${ID}" がありません。明示版の入稿提案を作り、独立レビュー・実機確認・保全・承認後に対象IDの公開台帳を確定してください。`); process.exit(1); }
if (UPDATE && lst.status !== "listed") { console.error("ABORT: --update は既刊 (status=listed) 専用です"); process.exit(1); }
if (!UPDATE && lst.status === "listed" && !VERIFY && !PROBE) {
  console.error("ABORT: 既刊を修正する場合は --update を明示してください");
  process.exit(1);
}

// 資産 (EPUB/カバー) の存在をブラウザ起動前に確認 (中断で orphan 下書きを残さない)。
const epub = resolveAsset(lst.epubPath);
if (!epub.ok) { console.error(`ABORT: ${epub.reason}`); process.exit(1); }
const cover = resolveAsset(lst.coverPath);
if (!cover.ok) console.warn(`[warn] カバー未検出 (${lst.coverPath}) — KDP Cover Creator で作成可`);

// 出品前チェック (KDP 制約)。タイトル/キーワードの明白な逸脱を起動前に弾く。
if (!lst.title?.trim()) { console.error("ABORT: title 空"); process.exit(1); }
if (lst.keywords.length > 7) { console.error("ABORT: keywords は最大 7"); process.exit(1); }
if (COMMIT && lst.kuEnrolled === undefined) { console.error("ABORT: kuEnrolled 未設定"); process.exit(1); }

if (COMMIT || UPDATE) {
  const archive = assertKindleReleaseReady(ROOT, ID, lst);
  if (!archive.ok) {
    console.error(`ABORT: ${archive.reason}。先に Kindle archive --push を実行してください`);
    process.exit(1);
  }
  console.log(`[prep] R2 archive revision=${archive.revision} verifiedAt=${archive.verifiedAt}`);
}

const MODE = PROBE ? "PROBE(構造dump)" : UPDATE ? `UPDATE(${COMMIT ? "再公開" : "修正下書き"})` : COMMIT ? "COMMIT(公開)" : VERIFY ? "VERIFY(検証のみ)" : "DRAFT(下書き)";
console.log(`[prep] KDP ${MODE} id=${ID} "${lst.title}"`);

const ctx = await launchContext({ headless: false });
try {
  const page = ctx.pages()[0] || (await ctx.newPage());
  page.on("dialog", async (d) => { try { await d.accept(); } catch {} });

  const lg = await waitForLogin(page, { tag: "[kdp]" });
  if (!lg.ok) { console.error("ABORT:", lg.reason); process.exit(2); }
  const acc = await assertAccount(page, { tag: "[kdp]" });
  if (!acc.ok) { console.error("ABORT:", acc.reason); process.exit(2); }

  if (PROBE) {
    const url = lst.draftId
      ? `https://kdp.amazon.co.jp/ja_JP/title-setup/kindle/${lst.draftId}/details`
      : "https://kdp.amazon.co.jp/ja_JP/title-setup/kindle/new/details";
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 }).catch(() => {});
    try { await page.waitForLoadState("networkidle", { timeout: 20000 }); } catch {}
    await sleep(3000);
    const structure = await page.evaluate(() => {
      const q = (sel) => Array.from(document.querySelectorAll(sel));
      const desc = (e) => ({
        tag: e.tagName, id: e.id || null, name: e.getAttribute("name") || null,
        type: e.getAttribute("type") || null, placeholder: e.getAttribute("placeholder") || null,
        label: e.getAttribute("aria-label") || null, text: (e.textContent || "").trim().slice(0, 40) || null,
      });
      return {
        url: location.href,
        inputs: q("input").map(desc).slice(0, 60),
        textareas: q("textarea").map(desc).slice(0, 20),
        buttons: q('button,[role="button"]').map(desc).slice(0, 40),
        labels: q("label").map((l) => (l.textContent || "").trim().slice(0, 50)).filter(Boolean).slice(0, 60),
      };
    });
    // ★出力先は shotPath() 経由 (mkdir 内包。素の join は .local/kdp-debug 未作成で ENOENT)。
    const out = shotPath(`probe-${ID}.json`);
    writeFileSync(out, JSON.stringify(structure, null, 2));
    await page.screenshot({ path: shotPath(`probe-${ID}.png`), fullPage: true }).catch(() => {});
    console.log(`[probe] フォーム構造を dump: ${out}`);
    process.exit(0);
  }

  if (VERIFY) {
    const v = await verifyDraft(page, lst, { tag: "[verify]" });
    console.log(v.ok ? "[kdp] ✅ verify 全項目 PASS" : `[kdp] ❌ verify 不合格: ${v.problems.join(" / ")}`);
    process.exit(v.ok ? 0 : 1);
  }

  // 下書きを完成 (冪等) — COMMIT でも先にここを通す。
  const r = await ensureDraft(page, ID, lst, {
    epubAbs: epub.abs,
    coverAbs: cover.ok ? cover.abs : null,
    forceAll: UPDATE,
    tag: "[kdp]",
  });
  await page.screenshot({ path: shotPath(`details-${ID}.png`) }).catch(() => {});
  if (!r.ok) {
    console.error(`[kdp] ❌ 下書きが完成していない: ${r.warnings.join(" / ")}`);
    process.exit(3);
  }
  console.log(`[kdp] ✅ 下書き完成 (verify PASS${r.already ? "・変更なし" : ""})`);

  if (!COMMIT) {
    console.log("   公開は内容を目視確認のうえ --commit + オーナー承認で実行してください。");
    process.exit(0);
  }

  // COMMIT: 公開 (要オーナー承認)。verify PASS は上で確定済み。
  const pub = await publishDraft(page, ID, lst, { tag: "[kdp]" });
  if (pub.ok) {
    console.log(`[kdp] ✅ 公開手続き完了 (本棚 status=${pub.status}${pub.asin ? ` / asin=${pub.asin}` : " / ASIN 割当待ち"})`);
    console.log("   ※ KDP の審査 (最大72時間) 後に販売開始。");
  } else {
    console.error(`[kdp] ⚠ 公開の確定を確認できませんでした (${pub.reason}). 「公開した」とは報告しません。`);
    process.exitCode = 3;
  }
} finally {
  await ctx.close();
}
