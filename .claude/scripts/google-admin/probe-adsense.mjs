/**
 * probe-adsense — AdSense 管理画面の DOM 構造を dump するだけの read-only プローブ。
 *
 * なぜ要るか: 広告ユニット作成フォームのセレクタは実機を見ないと確定できない。
 * 推測でセレクタを書くと「動いたように見えて別の要素を操作する」事故になる
 * (GA4 側で実際に起きた: getByRole("textbox").first() がヘッダー検索窓に入力した)。
 * そのため **probe の dump を見てから** applyCreateAdUnit のセレクタを書く、という順序を
 * README とプランで規約化している。
 *
 * このモジュールは click / fill / Save を一切行わない (mutation 経路を持たない)。
 * dump は `.local/google-admin-debug/` に出し、repo には commit しない。
 */
import fs from "node:fs";
import path from "node:path";
import { PROJECT_ROOT } from "./browser-context.mjs";
import { sanitizeObject } from "./redact.mjs";

/** AdSense 広告ユニット一覧の URL (実機未確認・probe で確定する)。 */
export const ADSENSE_UNITS_URL = "https://www.google.com/adsense/new/u/0/myads/units";

const DEBUG_DIR = ".local/google-admin-debug";

/**
 * 広告ユニット画面の interactive 要素を dump する。
 *
 * @param {import("playwright").Page} page
 * @param {{runId:string, screenshotDir?:string}} opts
 * @returns {Promise<{status:string, outFile?:string, counts?:object, detail?:string}>}
 */
export async function probeAdSenseUnitsPage(page, { runId, screenshotDir = null }) {
  const outDir = path.join(PROJECT_ROOT, DEBUG_DIR);
  fs.mkdirSync(outDir, { recursive: true });

  try {
    await page.goto(ADSENSE_UNITS_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  } catch (e) {
    return { status: "navigation-failed", detail: String(e.message ?? e).slice(0, 200) };
  }
  // SPA の描画待ち (click しないので固定待機で足りる)
  await page.waitForTimeout(8000);

  const url = page.url();
  if (/accounts\.google\.com|signin/.test(url)) {
    return { status: "login-required", detail: "AdSense のログインが必要 (人間が headed ブラウザで対応する)" };
  }

  let dump;
  try {
    dump = await page.evaluate(() => {
      const take = (nodes, max) => Array.from(nodes).slice(0, max);
      const label = (el) =>
        el.getAttribute("aria-label") ||
        el.getAttribute("placeholder") ||
        el.getAttribute("name") ||
        (el.innerText || "").trim().slice(0, 80) ||
        null;
      return {
        title: document.title,
        headings: take(document.querySelectorAll("h1,h2,h3"), 30).map((h) => (h.innerText || "").trim().slice(0, 120)),
        buttons: take(document.querySelectorAll("button,[role='button']"), 80).map((b) => ({
          tag: b.tagName.toLowerCase(),
          label: label(b),
          disabled: b.hasAttribute("disabled") || b.getAttribute("aria-disabled") === "true",
        })),
        inputs: take(document.querySelectorAll("input,textarea,[contenteditable='true']"), 60).map((i) => ({
          tag: i.tagName.toLowerCase(),
          type: i.getAttribute("type"),
          label: label(i),
          id: i.getAttribute("id"),
        })),
        links: take(document.querySelectorAll("a[href]"), 60).map((a) => ({
          label: (a.innerText || "").trim().slice(0, 60),
          href: a.getAttribute("href"),
        })),
        // 既存ユニット行らしきテキスト (件数の目安。値の突合は API 側で行う)
        bodyTextHead: (document.body?.innerText ?? "").slice(0, 4000),
      };
    });
  } catch (e) {
    return { status: "evaluate-failed", detail: String(e.message ?? e).slice(0, 200) };
  }

  if (screenshotDir) {
    try {
      await page.screenshot({ path: path.join(screenshotDir, "probe-adsense-units.png"), fullPage: true });
    } catch {
      /* screenshot 失敗は probe 自体の失敗ではない */
    }
  }

  const outFile = path.join(outDir, `probe-adsense-${runId}.json`);
  fs.writeFileSync(outFile, JSON.stringify(sanitizeObject({ url, ...dump }), null, 2) + "\n");

  return {
    status: "ok",
    outFile: path.relative(PROJECT_ROOT, outFile),
    counts: {
      buttons: dump.buttons.length,
      inputs: dump.inputs.length,
      links: dump.links.length,
      headings: dump.headings.length,
    },
  };
}
