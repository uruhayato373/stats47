#!/usr/bin/env node
/**
 * kdp-drafts.mjs — KDP 本棚の下書きを一覧し、SSOT に紐づかないものを消す。
 *
 *   node .claude/scripts/kdp/kdp-drafts.mjs                 # 一覧 (削除しない)
 *   node .claude/scripts/kdp/kdp-drafts.mjs --prune         # 消す対象を表示 (dry-run)
 *   node .claude/scripts/kdp/kdp-drafts.mjs --prune --apply # 実際に削除
 *
 * ★なぜ要るか
 *   出品フォームの実装中、実行のたびに `new/details` から下書きを作っていたため、
 *   1 冊ぶんの試行で 5 件の空下書きが残った。放置すると本棚が使えなくなり、
 *   どれが本物か分からなくなる。
 *
 * ★消してよいのは「SSOT の draftId に載っていない下書き」だけ
 *   listings に記録された draftId と、公開済み (asin あり) の本は絶対に触らない。
 *   削除は不可逆なので、既定は dry-run。`--apply` を明示したときだけ実行する。
 */
import { launchContext, waitForLogin, assertAccount, readListings, shotPath, sleep } from "./lib/kdp-session.mjs";

const PRUNE = process.argv.includes("--prune");
const APPLY = process.argv.includes("--apply");
const BOOKSHELF = "https://kdp.amazon.co.jp/ja_JP/bookshelf";

const listings = readListings();
const keepIds = new Set(
  Object.values(listings)
    .map((l) => l.draftId)
    .filter(Boolean),
);

const ctx = await launchContext({ headless: false });
try {
  const page = ctx.pages()[0] || (await ctx.newPage());
  const lg = await waitForLogin(page, { tag: "[drafts]" });
  if (!lg.ok) {
    console.error("ABORT:", lg.reason);
    process.exit(2);
  }
  const acc = await assertAccount(page, { tag: "[drafts]" });
  if (!acc.ok) {
    console.error("ABORT:", acc.reason);
    process.exit(2);
  }

  await page.goto(BOOKSHELF, { waitUntil: "domcontentloaded", timeout: 60000 });
  await sleep(12000);

  // 本棚の行から「下書き」状態のものを拾う。
  const rows = await page.evaluate(() =>
    [...document.querySelectorAll("tr, li, div")]
      .map((el) => {
        const link = el.querySelector('a[href*="/title-setup/kindle/"]');
        if (!link) return null;
        const id = (/\/title-setup\/kindle\/([A-Z0-9]{8,})\//.exec(link.getAttribute("href") || "") || [])[1];
        if (!id) return null;
        const text = (el.innerText || "").trim();
        if (text.length > 600) return null; // 祖先の巨大コンテナを除く
        return { id, title: text.split("\n")[0].slice(0, 60), isDraft: /下書き/.test(text) };
      })
      .filter(Boolean),
  );
  // 同じ id が入れ子で複数拾えるので最短テキストのものに寄せる。
  const byId = new Map();
  for (const r of rows) if (!byId.has(r.id)) byId.set(r.id, r);
  const drafts = [...byId.values()].filter((r) => r.isDraft);

  console.log(`[drafts] 下書き ${drafts.length} 件 / SSOT に紐づく draftId ${keepIds.size} 件`);
  for (const d of drafts) {
    console.log(`  ${keepIds.has(d.id) ? "keep " : "prune"} ${d.id}  ${d.title}`);
  }

  if (!PRUNE) {
    console.log("[drafts] --prune で削除対象を表示、--prune --apply で実際に削除します。");
    process.exit(0);
  }

  const targets = drafts.filter((d) => !keepIds.has(d.id));
  if (!targets.length) {
    console.log("[drafts] 削除対象なし。");
    process.exit(0);
  }
  if (!APPLY) {
    console.log(`[drafts] dry-run: ${targets.length} 件が削除対象 (--apply で実行)`);
    process.exit(0);
  }

  // ★行のメニューは innerText が "..." のリンク (aria-label も data-action も持たない)。
  //   どの行のものかは DOM の位置関係でしか分からないので、トリガーの並び順と
  //   draftId の対応を先に作り、Playwright の実クリックで開く (evaluate の .click() は AUI に効かない)。
  //   セレクタでの後追いは当たらないので、evaluate 側で **目印属性を付けて**から Playwright で掴む。
  const tagTriggers = () => page.evaluate(() => {
    const trigs = [...document.querySelectorAll("a,button,[role=button]")].filter(
      (e) => (e.innerText || "").trim() === "...",
    );
    return trigs.map((t) => {
      let box = t;
      for (let i = 0; i < 12 && box?.parentElement; i++) {
        box = box.parentElement;
        const link = box.querySelector('a[href*="/title-setup/kindle/"]');
        if (link) {
          const m = /\/title-setup\/kindle\/([A-Z0-9]{8,})\//.exec(link.getAttribute("href") || "");
          if (m) {
            t.setAttribute("data-kdp-draft", m[1]);
            return m[1];
          }
        }
      }
      return null;
    });
  });

  let removed = 0;
  for (const t of targets) {
    // ★1 件消すたびに本棚が描き直され、付けた目印は消える。毎回付け直す
    //   (付け直さないと 2 件目以降がすべて「メニューを開けず」になる)。
    const triggerIds = await tagTriggers();
    await sleep(1500);
    if (!triggerIds.includes(t.id)) {
      console.log(`  ⚠ ${t.id}: 行メニューを特定できず (手動で削除してください)`);
      continue;
    }
    const trig = page.locator(`[data-kdp-draft="${t.id}"]`).first();
    const opened = await trig
      .click({ timeout: 10000 })
      .then(() => true)
      .catch(() => false);
    if (!opened) {
      console.log(`  ⚠ ${t.id}: メニューを開けず`);
      continue;
    }
    await sleep(2500);
    // ★メニュー項目は「下書きの削除」ではなく **「電子書籍の削除」** (実測 2026-08-12)。
    // ★可視のポップオーバーに絞る。ページ全体から探すと KDP が持つ**非表示のテンプレート**に
    //   先に当たり、クリックが timeout して「見つからず」に見える (メニューは実際は開いている)。
    const clicked = await page
      .locator(".a-popover:visible")
      .locator("text=電子書籍の削除")
      .first()
      .click({ timeout: 8000 })
      .then(() => true)
      .catch(() => false);
    if (!clicked) {
      console.log(`  ⚠ ${t.id}: 「電子書籍の削除」が見つからず`);
      await page.keyboard.press("Escape").catch(() => {});
      continue;
    }
    await sleep(2500);
    // 確認ダイアログ (同じ文言のボタンが出る)
    // 確認ダイアログ: 「よろしいですか？…復元することはできません」→ **OK**。
    //   ★ここを押さないと本は消えず、しかもモーダルが残るので次の行のメニューも開けなくなる
    //     (以前は押せていないのに ✓ を出し、同じ本を毎回「削除した」と報告していた)。
    const confirmed = await page
      .locator(".a-popover-modal:visible")
      .getByRole("button", { name: "OK", exact: true })
      .first()
      .click({ timeout: 10000 })
      .then(() => true)
      .catch(() => false);
    if (!confirmed) {
      console.log(`  ⚠ ${t.id}: 確認ダイアログの OK を押せず (削除していません)`);
      await page.keyboard.press("Escape").catch(() => {});
      continue;
    }
    await sleep(5000);
    // read-back: 本棚を**開き直して**その ID が消えたか確かめる。
    //   KDP は OK 押下だけでは一覧を書き換えないので、その場で見ると必ず「残っている」に見える。
    await page.goto(BOOKSHELF, { waitUntil: "domcontentloaded", timeout: 60000 }).catch(() => {});
    await sleep(9000);
    const gone = await page
      .evaluate((id) => !document.querySelector(`a[href*="/title-setup/kindle/${id}/"]`), t.id)
      .catch(() => false);
    if (!gone) {
      console.log(`  ⚠ ${t.id}: OK を押したが本棚に残っている`);
      continue;
    }
    removed += 1;
    console.log(`  ✓ 削除: ${t.id}`);
  }

  await page.screenshot({ path: shotPath("drafts-after-prune.png"), fullPage: true }).catch(() => {});
  console.log(`[drafts] ${removed}/${targets.length} 件を削除しました。`);
} finally {
  await ctx.close();
}
