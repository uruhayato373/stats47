#!/usr/bin/env node
/**
 * kdp-publish.mjs — KDP 電子書籍を kdp-listings.json の内容から出品する Playwright オペレータ。
 * coconala-publish.mjs と同じ安全弁 (account assert / draft-first / --commit gate / 偽成功を報告しない)。
 *
 *   node .claude/scripts/kdp/kdp-publish.mjs --id K-S1-01 --probe     # 出品フォームの構造を dump (初回のセレクタ調整用・書き込みなし)
 *   node .claude/scripts/kdp/kdp-publish.mjs --id K-S1-01             # 下書き作成のみ (既定・安全)
 *   node .claude/scripts/kdp/kdp-publish.mjs --id K-S1-01 --commit    # 公開 (★実公開・要オーナー承認)
 *
 * ★KDP の出品フォームは React SPA で DOM が変わりやすい。初回は必ず --probe で構造を確認し、
 *   .local/kdp-debug/ の dump/スクショを見てセレクタを詰めること (coconala の discover-categories 相当)。
 * ★税務情報 (Tax interview)・銀行口座が未完了だと KDP は公開させない。これは人間が事前に完了させる。
 * ★KU (KDP Select 独占) 登録は kdp-listings.json の kuEnrolled=false を尊重 (当面 未登録=販売のみ)。
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  launchContext, waitForLogin, assertAccount, readListings, writeBackListing,
  resolveAsset, shotPath, sleep, ROOT,
} from "./lib/kdp-session.mjs";

const argv = process.argv.slice(2);
const getArg = (n) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : null; };
const ID = getArg("--id");
const COMMIT = argv.includes("--commit");
const PROBE = argv.includes("--probe");
if (!ID) { console.error("--id <K-S1-01> required"); process.exit(1); }

const listings = readListings();
const lst = listings[ID];
if (!lst) { console.error(`ABORT: kdp-listings.json に "${ID}" が無い (先に products:kindle:kdp-listings --apply)`); process.exit(1); }

// 資産 (EPUB/カバー) の存在をブラウザ起動前に確認 (中断で orphan 下書きを残さない)。
const epub = resolveAsset(lst.epubPath);
if (!epub.ok) { console.error(`ABORT: ${epub.reason}`); process.exit(1); }
const cover = resolveAsset(lst.coverPath);
if (!cover.ok) console.warn(`[warn] カバー未検出 (${lst.coverPath}) — KDP Cover Creator で作成可`);

// 出品前チェック (KDP 制約)。タイトル/キーワードの明白な逸脱を起動前に弾く。
if (!lst.title?.trim()) { console.error("ABORT: title 空"); process.exit(1); }
if (lst.keywords.length > 7) { console.error("ABORT: keywords は最大 7"); process.exit(1); }
if (COMMIT && lst.kuEnrolled === undefined) { console.error("ABORT: kuEnrolled 未設定"); process.exit(1); }

console.log(`[prep] KDP ${PROBE ? "PROBE(構造dump)" : COMMIT ? "COMMIT(公開)" : "DRAFT(下書き)"} id=${ID} "${lst.title}"`);

const ctx = await launchContext({ headless: false });
try {
  const page = ctx.pages()[0] || (await ctx.newPage());
  page.on("dialog", async (d) => { try { await d.accept(); } catch {} });

  const lg = await waitForLogin(page, { tag: "[kdp]" });
  if (!lg.ok) { console.error("ABORT:", lg.reason); await ctx.close(); process.exit(2); }
  const acc = await assertAccount(page, { tag: "[kdp]" });
  if (!acc.ok) { console.error("ABORT:", acc.reason); await ctx.close(); process.exit(2); }

  // 新規 Kindle 本の作成ページへ (KDP の入口 URL)。
  await page.goto("https://kdp.amazon.co.jp/ja_JP/title-setup/kindle/new/details", { waitUntil: "domcontentloaded", timeout: 60000 }).catch(() => {});
  try { await page.waitForLoadState("networkidle", { timeout: 20000 }); } catch {}
  await sleep(3000);

  if (PROBE) {
    // フォーム構造を dump (label/input/textarea/button の一覧) + スクショ。セレクタ調整用。
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
    const out = join(ROOT, ".local/kdp-debug", `probe-${ID}.json`);
    writeFileSync(out, JSON.stringify(structure, null, 2));
    await page.screenshot({ path: shotPath(`probe-${ID}.png`), fullPage: true }).catch(() => {});
    console.log(`[probe] フォーム構造を dump: ${out} / スクショ: .local/kdp-debug/probe-${ID}.png`);
    console.log("[probe] この構造を見て kdp-form の label/セレクタを確定してから本番 (--commit なし→ --commit) へ。");
    await ctx.close();
    process.exit(0);
  }

  // ── ベストエフォートのフォーム充填 (KDP DOM は変わりやすい。失敗フィールドは記録して継続) ──
  const { fillKdpDetails, uploadKdpContent, setKdpPricing, saveDraft, publishBook } =
    await import("./lib/kdp-form.mjs");

  const filled = await fillKdpDetails(page, lst, { tag: "[kdp]" });
  filled.log.forEach((l) => console.log("   ", l));
  await page.screenshot({ path: shotPath(`details-${ID}.png`) }).catch(() => {});

  const uploaded = await uploadKdpContent(page, { epubAbs: epub.abs, coverAbs: cover.ok ? cover.abs : null, tag: "[kdp]" });
  uploaded.log.forEach((l) => console.log("   ", l));

  const priced = await setKdpPricing(page, lst, { tag: "[kdp]" });
  priced.log.forEach((l) => console.log("   ", l));

  // 記入不備が検出されたら公開しない (偽成功を報告しない)。
  const problems = [...filled.warnings, ...uploaded.warnings, ...priced.warnings];
  if (problems.length) {
    console.log("[kdp] ⚠ 未充填/不明フィールド:");
    problems.forEach((w) => console.log("    -", w));
  }

  if (!COMMIT) {
    const r = await saveDraft(page, { tag: "[kdp]" });
    console.log(`[kdp] ${r.ok ? "✅ 下書き保存" : "⚠ 下書き保存の確認不可"} (url=${page.url()})`);
    console.log("   公開は内容を目視確認のうえ --commit + オーナー承認で実行してください。");
    await ctx.close();
    process.exit(r.ok ? 0 : 3);
  }

  // COMMIT: 公開 (要オーナー承認)。税務/KU 未完了だと KDP 側で弾かれる。
  if (problems.length) {
    console.error("[kdp] ABORT: 未充填フィールドがあるため公開しません (先に下書きで解消)。");
    await ctx.close();
    process.exit(3);
  }
  const pub = await publishBook(page, { tag: "[kdp]" });
  await page.screenshot({ path: shotPath(`publish-${ID}.png`) }).catch(() => {});
  if (pub.ok) {
    writeBackListing(ID, pub.asin || null);
    console.log(`[kdp] ✅ 公開手続き完了 (asin=${pub.asin || "取得待ち"}). kdp-listings.json を listed に更新。`);
    console.log("   ※ KDP の審査 (最大72時間) 後に販売開始。ASIN/販売状態はマイページで確認。");
  } else {
    console.error(`[kdp] ⚠ 公開の確定を確認できませんでした (${pub.reason || "unknown"}). 「公開した」とは報告しません。`);
    process.exitCode = 3;
  }
} finally {
  await ctx.close();
}
