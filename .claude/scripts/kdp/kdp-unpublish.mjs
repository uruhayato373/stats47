#!/usr/bin/env node
/**
 * kdp-unpublish.mjs — KDP 本棚で販売中の本を「販売停止」にする (stats47)。
 *
 * 用途 (2026-09-19): 全冊監査で取り下げを決めた S2/S3/S4 の 10 冊 (`kdp-listings.json` の `withdrawal`)。
 * 対象は **withdrawal を持ち kdpStatus=live の listing だけ**。それ以外の id は拒否する。
 *
 *   node .claude/scripts/kdp/kdp-unpublish.mjs --id K-S2-01 --probe        # メニュー・確認ダイアログの構造を採取 (確定しない)
 *   node .claude/scripts/kdp/kdp-unpublish.mjs --id K-S2-01 --commit       # ★実行 (outward-facing・オーナー指示のうえで)
 *   node .claude/scripts/kdp/kdp-unpublish.mjs --all-withdrawn --commit    # withdrawal 付き live 全冊
 *
 * 安全境界 (kdp-session / kdp-flow と同じ):
 *   - account assert に失敗したら何もしない。
 *   - 本棚の行は ASIN で特定し、行テキストに ASIN と題名の先頭が両方無ければその本は触らない。
 *   - 成功判定は「ボタンを押せた」ではなく **本棚 read-back で status が「販売中」でなくなった**こと。
 *   - --commit 無しでは確認ダイアログを閉じる (Escape / キャンセル) だけで、確定ボタンは押さない。
 *   - 1 冊でも失敗したら残りを止める (誤操作の連鎖を避ける)。
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  DEBUG_DIR,
  assertAccount,
  launchContext,
  readListings,
  sleep,
  waitForLogin,
  writeBackKdpState,
} from "./lib/kdp-session.mjs";

const BASE = "https://kdp.amazon.co.jp/ja_JP";
const args = process.argv.slice(2);
const getArg = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const COMMIT = args.includes("--commit");
const PROBE = args.includes("--probe");
const ALL = args.includes("--all-withdrawn");
const ONE = getArg("--id");

if (!ALL && !ONE) {
  console.error("usage: --id <K-..> | --all-withdrawn  [--probe] [--commit]");
  process.exit(2);
}
if (!PROBE && !COMMIT) {
  console.error("ABORT: --probe (採取のみ) か --commit (実行) のどちらかを明示する");
  process.exit(2);
}

const listings = readListings();
const targets = (ALL ? Object.keys(listings) : [ONE]).filter((id) => {
  const l = listings[id];
  if (!l) {
    console.error(`skip ${id}: listing なし`);
    return false;
  }
  if (!l.withdrawal) {
    console.error(`skip ${id}: withdrawal が無い (取り下げ対象ではない)`);
    return false;
  }
  if (l.kdpStatus !== "live") {
    console.error(`skip ${id}: kdpStatus=${l.kdpStatus} (販売中でない)`);
    return false;
  }
  if (!l.asin) {
    console.error(`skip ${id}: ASIN 未回収`);
    return false;
  }
  return true;
});
if (targets.length === 0) {
  console.error("ABORT: 対象 0 冊");
  process.exit(1);
}
console.log(`[unpublish] 対象 ${targets.length} 冊: ${targets.join(", ")} (${COMMIT ? "★COMMIT" : "probe"})`);

const ts = new Date().toISOString().replace(/[:.]/g, "-");
const outDir = join(DEBUG_DIR, `unpublish-${ts}`);
mkdirSync(outDir, { recursive: true });

const MENU_ITEM = /販売停止|出版停止|Unpublish/;
const CANCEL_BTN = /キャンセル|Cancel|閉じる/;
const LIVE = /販売中|出版済み|ライブ/;

/** 本棚でその ASIN の行を見つけ、行テキスト・status・行内ボタンを返す (無ければ null)。 */
async function locateRow(page, lst) {
  await page.goto(`${BASE}/bookshelf`, { waitUntil: "domcontentloaded", timeout: 60000 });
  try {
    await page.waitForLoadState("networkidle", { timeout: 20000 });
  } catch {}
  await sleep(5000);
  const box = page.locator('input[type="search"], input[placeholder*="検索"], #podbookshelf-search-input').first();
  if (await box.count()) {
    await box.fill(lst.asin, { timeout: 10000 });
    await box.press("Enter").catch(() => {});
    await sleep(7000);
  }
  return page.evaluate(
    ({ asin, title }) => {
      const STATUS = /変更内容をレビュー中|変更のレビュー中|出版準備中|公開準備中|レビュー中|審査中|処理中|販売中|出版済み|ライブ|下書き|販売停止/;
      const rows = [...document.querySelectorAll("tr, [role=row], article, li, div")]
        .filter((e) => {
          const t = e.innerText || "";
          return t.includes(asin) && STATUS.test(t);
        })
        .sort((a, b) => (a.innerText || "").length - (b.innerText || "").length);
      let row = rows[0];
      if (!row) return null;
      // ASIN と status を含む最小要素は題名を含まない小箱 (2026-09-19 実測) → 題名が現れるまで遡る。
      for (let i = 0; i < 12 && row.parentElement && !(row.innerText || "").includes(title.slice(0, 8)); i++) {
        row = row.parentElement;
      }
      const text = (row.innerText || "").trim();
      const buttons = [...row.querySelectorAll("button, [role=button], a")].map((b, i) => ({
        i,
        text: (b.innerText || "").trim().slice(0, 40),
        aria: b.getAttribute("aria-label") || "",
        title: b.getAttribute("title") || "",
        id: b.id || "",
        cls: (b.className || "").toString().slice(0, 80),
      }));
      row.setAttribute("data-kdp-unpublish-row", asin);
      return {
        text: text.slice(0, 300),
        status: (text.match(STATUS) || [])[0] || "不明",
        titleOk: text.includes(title.slice(0, 8)),
        buttons,
      };
    },
    { asin: lst.asin, title: lst.title },
  );
}

const ctx = await launchContext({ headless: false });
const page = ctx.pages()[0] ?? (await ctx.newPage());
const results = [];
try {
  await waitForLogin(page, { waitMinutes: 8, tag: "[unpublish]" });
  const acct = await assertAccount(page, { tag: "[unpublish]" });
  if (!acct.ok) throw new Error("account assert failed");

  for (const id of targets) {
    const lst = listings[id];
    const tag = `[unpublish ${id}]`;
    const row = await locateRow(page, lst);
    if (!row) {
      console.error(`${tag} 本棚に ASIN ${lst.asin} の行が無い → 停止`);
      results.push({ id, ok: false, reason: "row-not-found" });
      break;
    }
    if (!row.titleOk) {
      console.error(`${tag} 行に題名の先頭が無い (${row.text.slice(0, 80)}) → 停止`);
      results.push({ id, ok: false, reason: "title-mismatch", row });
      break;
    }
    if (!LIVE.test(row.status)) {
      console.log(`${tag} status=${row.status} (販売中でない) → skip`);
      results.push({ id, ok: true, skipped: true, status: row.status });
      continue;
    }
    console.log(`${tag} 行を確認: status=${row.status} buttons=${row.buttons.length}`);

    // 行のアクションメニュー (「…」/ 本の操作) を開く。KDP の DOM は可変なので候補を並べる。
    const rowLoc = page.locator(`[data-kdp-unpublish-row="${lst.asin}"]`);
    const menuBtn = rowLoc
      .locator(
        'button[aria-label*="操作"], button[aria-label*="アクション"], button[aria-label*="menu" i], button[aria-label*="その他"], button:has-text("…"), button:has-text("..."), button[id*="action" i], button[class*="ellipsis" i], button[class*="dropdown" i], button[class*="menu" i]',
      )
      .first();
    let opened = false;
    if (await menuBtn.count()) {
      await menuBtn.click({ timeout: 10000 }).catch(() => {});
      await sleep(1500);
      opened = true;
    } else if (await rowLoc.getByText(MENU_ITEM).first().count()) {
      opened = true; // 行内に直接「販売停止」がある形
    }
    await page.screenshot({ path: join(outDir, `${id}-1-menu.png`) }).catch(() => {});
    const menuDump = await page.evaluate(() =>
      [...document.querySelectorAll("[role=menu] *, [role=menuitem], [role=listbox] *, ul li, a, button")]
        .map((e) => (e.innerText || "").trim())
        .filter((t) => t && t.length < 40),
    );
    writeFileSync(join(outDir, `${id}-menu.json`), JSON.stringify({ row, opened, menuDump: [...new Set(menuDump)].slice(0, 200) }, null, 1));
    if (!opened) {
      console.error(`${tag} アクションメニューが見つからない → 停止 (dump: ${outDir})`);
      results.push({ id, ok: false, reason: "menu-not-found" });
      break;
    }

    // 2026-09-19 実測: 行の「...」(other-actions) を開くと `a#unpublish-<id>`「電子書籍の出版停止」が現れる。
    //   popover は行の外 (body 直下) に描画されるので、ページ全体で **表示中のもの 1 件** を取る。
    const byId = page.locator('a[id^="unpublish-"]:visible, [id^="unpublish-"]:visible');
    const visibleCount = await byId.count();
    if (visibleCount > 1) {
      console.error(`${tag} 表示中の出版停止リンクが ${visibleCount} 件 (行を特定できない) → 停止`);
      results.push({ id, ok: false, reason: "ambiguous-unpublish-link" });
      break;
    }
    const item = page.getByRole("menuitem", { name: MENU_ITEM }).first();
    const itemAlt = page.locator("[role=menu] a, [role=menu] button, [role=menu] li, ul li a, ul li button").filter({ hasText: MENU_ITEM }).first();
    const target = visibleCount === 1 ? byId.first() : (await item.count()) ? item : (await itemAlt.count()) ? itemAlt : null;
    if (!target) {
      console.error(`${tag} メニューに「販売停止」が無い → 停止 (dump: ${outDir})`);
      results.push({ id, ok: false, reason: "item-not-found" });
      break;
    }
    await target.click({ timeout: 10000 });
    await sleep(2500);
    await page.screenshot({ path: join(outDir, `${id}-2-dialog.png`) }).catch(() => {});
    // 2026-09-19 実測: 確認は a-popover のモーダル「電子書籍の出版を停止しますか?」、ボタンは「出版停止」「キャンセル」。
    //   非表示の別 popover (詳細情報の編集) が DOM に残っているので **表示中のもの**だけを見る。
    const dialogLoc = page.locator(".a-popover-modal:visible, [role=dialog]:visible, [role=alertdialog]:visible").last();
    const dialog = (await dialogLoc.count())
      ? {
          text: ((await dialogLoc.innerText().catch(() => "")) || "").trim().slice(0, 800),
          buttons: await dialogLoc.locator("button:visible, input[type=submit]:visible, .a-button-text:visible").allInnerTexts().then((a) => a.map((t) => t.trim()).filter(Boolean)).catch(() => []),
        }
      : null;
    writeFileSync(join(outDir, `${id}-dialog.json`), JSON.stringify(dialog, null, 1));
    if (!dialog || !/出版を停止|販売を停止|Unpublish/i.test(dialog.text)) {
      console.error(`${tag} 出版停止の確認ダイアログが出ない → 停止 (${dialog ? dialog.text.slice(0, 80) : "none"})`);
      results.push({ id, ok: false, reason: "dialog-not-found", dialog });
      break;
    }
    console.log(`${tag} ダイアログ: ${dialog.text.slice(0, 120).replace(/\n/g, " / ")} | buttons=${dialog.buttons.join(" | ")}`);

    const cancel = dialogLoc.getByRole("button", { name: CANCEL_BTN }).first();
    const confirm = dialogLoc.getByRole("button", { name: /^(出版停止|販売停止|Unpublish)$/ }).first();
    const confirmAlt = dialogLoc.locator(".a-button-text, button").filter({ hasText: /^(出版停止|販売停止|Unpublish)$/ }).first();
    const confirmBtn = (await confirm.count()) ? confirm : (await confirmAlt.count()) ? confirmAlt : null;

    if (!COMMIT) {
      if (await cancel.count()) await cancel.click().catch(() => {});
      else await page.keyboard.press("Escape").catch(() => {});
      await sleep(1000);
      console.log(`${tag} probe のみ (確定していない)。確定ボタン: ${confirmBtn ? "検出" : "未検出"}`);
      results.push({ id, ok: true, probe: true, dialog, confirmDetected: !!confirmBtn });
      continue;
    }

    // ★確定 (outward-facing)
    if (!confirmBtn) {
      console.error(`${tag} 確定ボタンが無い → 停止`);
      results.push({ id, ok: false, reason: "confirm-not-found", dialog });
      break;
    }
    await confirmBtn.click({ timeout: 10000 });
    await sleep(6000);
    await page.screenshot({ path: join(outDir, `${id}-3-after.png`) }).catch(() => {});
    // read-back: 本棚でその本の status が「販売中」でなくなったか
    const after = await locateRow(page, lst);
    const changed = !!after && !LIVE.test(after.status);
    console.log(`${tag} read-back: ${after ? after.status : "行なし"} → ${changed ? "OK (出版停止を受理)" : "NG (まだ販売中)"}`);
    if (after) writeBackKdpState(id, { status: after.status, asin: lst.asin });
    if (!changed) {
      results.push({ id, ok: false, reason: "still-live", after });
      break;
    }
    results.push({ id, ok: true, after: after.status });
  }
} finally {
  writeFileSync(join(outDir, "results.json"), JSON.stringify(results, null, 1));
  console.log(`[unpublish] 結果 ${results.filter((r) => r.ok).length}/${targets.length} → ${outDir}`);
  await ctx.close();
}
