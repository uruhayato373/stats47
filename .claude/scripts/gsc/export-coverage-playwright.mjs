/**
 * export-coverage-playwright — GSC「インデックス作成 > ページ」のカバレッジ export を自動化する。
 *
 * なぜ Playwright か: インデックスカバレッジ (未登録の理由別 URL 一覧) は **公式 API が存在しない**。
 * Search Console API にあるのは searchanalytics (performance) と urlInspection (1 URL ずつ) だけで、
 * 理由別の URL 一覧は UI export でしか取れない。google-admin README「操作別の正典と実行場所」の
 * 「公式 API がないものだけローカル headed Playwright に残す」に該当する。
 *
 * 出力先は `~/Downloads` (既定)。ファイル名は GSC の suggestedFilename をそのまま使う。
 * これは消費側 `ingest-gsc-export.py` の `is_gsc_zip()` が
 * 「ファイル名に インデックス / カバレッジ / Coverage を含む .zip」だけを拾うため。
 * 名前を変えると ingest が拾わなくなるので変更しない。
 *
 * 使い方:
 *   node .claude/scripts/gsc/export-coverage-playwright.mjs --probe    # DOM 構造を dump (download しない)
 *   node .claude/scripts/gsc/export-coverage-playwright.mjs            # 既定カテゴリを export
 *   node .claude/scripts/gsc/export-coverage-playwright.mjs --only "クロール済み"
 *
 * 初回は headed Chrome が開くので **人間が Google にログインする** (認証情報はスクリプトが扱わない)。
 * プロファイルは google-admin と共有 (`.local/playwright-google-admin-profile`)。
 *
 * 後続: python3 .claude/scripts/gsc/ingest-gsc-export.py
 *       node .claude/scripts/gsc/build-coverage-queue.mjs
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  acquireLock,
  releaseLock,
  launchAdminContext,
  waitForLogin,
  isLoginUrl,
} from "../google-admin/browser-context.mjs";

const PROPERTY = "sc-domain:stats47.jp";
const INDEX_URL = `https://search.google.com/search-console/index?resource_id=${encodeURIComponent(PROPERTY)}`;

/** 既定の export 対象。actionable (転換可能) を優先し、意図的カテゴリは既定で採らない。 */
const DEFAULT_TARGETS = [
  "クロール済み - インデックス未登録",
  "検出 - インデックス未登録",
  "ソフト 404",
  "サーバーエラー",
  "見つかりませんでした",
];

/**
 * export UI のラベル。2026-08-06 に実機で確認した値を先頭に置く。
 * 実機のメニューは「Google スプレッドシート / Excel としてダウンロード / CSV をダウンロード」の 3 つ。
 * 緩すぎる候補 (単なる "CSV") は他要素に誤マッチするので置かない。
 */
const EXPORT_BUTTON_LABELS = ["エクスポート", "Export"];
const CSV_MENU_LABELS = ["CSV をダウンロード", "Download CSV"];

function parseArgs(argv) {
  const out = { probe: false, only: null, dest: path.join(os.homedir(), "Downloads"), timeoutMs: 120000 };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--probe") out.probe = true;
    else if (a === "--only") out.only = argv[++i];
    else if (a === "--dest") out.dest = argv[++i];
  }
  return out;
}

/** 可視テキストで要素を探す (GSC は class が難読化されるため text ベースで解決する)。 */
async function findByText(scope, labels, role) {
  for (const label of labels) {
    const loc = role
      ? scope.getByRole(role, { name: new RegExp(label, "i") })
      : scope.getByText(new RegExp(label, "i"));
    const n = await loc.count().catch(() => 0);
    if (n > 0) return loc.first();
  }
  return null;
}

/**
 * 社内フィルタ等の遮断ページを「成功」として扱わない (fail-closed)。
 * 2026-08-06 に一過性のブロックを踏んだ際、URL は search.google.com のままなので
 * 未ログイン判定にも引っかからず、遮断ページの DOM をそのまま dump してしまった。
 */
async function assertNotBlocked(page) {
  const title = await page.title().catch(() => "");
  if (/ブロック|遮断|blocked/i.test(title)) {
    throw new Error(`遮断ページが返りました (title="${title}")。ネットワーク/フィルタを確認してください`);
  }
  const body = await page.content().catch(() => "");
  if (/遮断装置|auris\s*vsys|プロキシ設定を見直/i.test(body)) {
    throw new Error("遮断装置のページが返りました。ネットワーク/フィルタを確認してください");
  }
}

async function ensureLoggedIn(page) {
  await page.goto(INDEX_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  await assertNotBlocked(page);
  if (!isLoginUrl(page.url())) return true;
  console.log("\n[login] Google 未ログインです。開いた Chrome でログインしてください (最大10分待機)。");
  console.log("        認証情報はスクリプトが一切扱いません。\n");
  const ok = await waitForLogin(page, {
    doneUrlPattern: /search\.google\.com\/search-console/,
    onPrompt: () => console.log("[login] 待機中..."),
  });
  if (!ok) throw new Error("ログイン待機がタイムアウトしました");
  await page.goto(INDEX_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  await assertNotBlocked(page);
  return true;
}

/** 未登録理由テーブルの行 (理由名 + 件数) を読む。 */
async function readReasonRows(page) {
  await page.waitForTimeout(4000); // SPA の描画待ち
  const rows = await page
    .locator("tr")
    .evaluateAll((els) =>
      els
        .map((el) => (el.innerText || "").replace(/\s+/g, " ").trim())
        .filter((t) => t.length > 0),
    )
    .catch(() => []);
  return rows;
}

async function probe(page) {
  console.log("url:", page.url());
  console.log("title:", await page.title());
  const rows = await readReasonRows(page);
  console.log(`\n--- table 行 (${rows.length}) ---`);
  rows.slice(0, 40).forEach((r) => console.log("  ", r.slice(0, 120)));

  const buttons = await page
    .locator("button, [role=button]")
    .evaluateAll((els) =>
      els
        .map((el) => ({
          text: (el.innerText || "").replace(/\s+/g, " ").trim().slice(0, 40),
          aria: el.getAttribute("aria-label") || "",
        }))
        .filter((b) => b.text || b.aria),
    )
    .catch(() => []);
  console.log(`\n--- button 候補 (${buttons.length}) ---`);
  buttons.slice(0, 50).forEach((b) => console.log(`   text="${b.text}" aria="${b.aria}"`));
}

/** 1 カテゴリを export する。成功したら保存パスを返す。 */
async function exportOne(page, reason, dest) {
  // 理由行をクリックして drilldown へ
  const row = await findByText(page, [reason.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")]);
  if (!row) return { reason, ok: false, note: "理由行が見つからない" };
  await row.click({ timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(4000);

  const exportBtn = await findByText(page, EXPORT_BUTTON_LABELS, "button");
  if (!exportBtn) return { reason, ok: false, note: "エクスポートボタンが見つからない" };
  await exportBtn.click({ timeout: 15000 });
  await page.waitForTimeout(1500);

  const csvItem = await findByText(page, CSV_MENU_LABELS, "menuitem")
    ?? await findByText(page, CSV_MENU_LABELS);
  if (!csvItem) return { reason, ok: false, note: "CSV メニュー項目が見つからない" };

  const [download] = await Promise.all([
    page.waitForEvent("download", { timeout: 60000 }),
    csvItem.click({ timeout: 15000 }),
  ]);

  const suggested = download.suggestedFilename();
  if (!/\.zip$/i.test(suggested)) {
    await download.cancel().catch(() => {});
    return { reason, ok: false, note: `zip でない (${suggested}) ため保存しない` };
  }
  // ★消費側の契約に合わせる: ingest-gsc-export.py の is_gsc_zip() は
  //   NFC 正規化した basename が .zip で終わり、かつ インデックス/カバレッジ/Coverage を
  //   含むものしか拾わない。GSC の既定名は通常これを満たすが、UI 言語や表記が変わると
  //   「保存はされたのに ingest が無視する」= 沈黙する統合不全になる。
  //   満たさない場合はここで接頭辞を付けて拾えるようにし、リネームしたことを報告する。
  const normalized = suggested.normalize("NFC");
  const pickedUpByIngest = /インデックス|カバレッジ|Coverage/.test(normalized);
  const base = pickedUpByIngest ? normalized : `インデックス-${normalized}`;
  // ★カテゴリ名を必ず埋め込む。GSC の既定名は
  //   "stats47.jp-Coverage-Drilldown-<日付>.zip" で **理由を含まない**ため、
  //   同日に複数カテゴリを export すると後の 1 件が前を上書きして消える (2026-08-06 実測)。
  //   ingest は zip の中身で分類するので名前は識別子であればよい。
  const slug = reason.replace(/[\\/:*?"<>|]/g, "").replace(/\s+/g, "-").slice(0, 40);
  const filename = base.replace(/\.zip$/i, "") + `-${slug}.zip`;
  const target = path.join(dest, filename);
  await download.saveAs(target);
  await page.goBack({ waitUntil: "domcontentloaded" }).catch(() => {});
  await page.waitForTimeout(3000);
  return {
    reason,
    ok: true,
    note: pickedUpByIngest ? target : `${target} (ingest が拾える名前に改名: 元 "${suggested}")`,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  fs.mkdirSync(args.dest, { recursive: true });

  acquireLock();
  let context;
  try {
    const launched = await launchAdminContext({ acceptDownloads: !args.probe });
    context = launched.context;
    const { page } = launched;

    await ensureLoggedIn(page);

    if (args.probe) {
      await probe(page);
      return;
    }

    const targets = args.only ? [args.only] : DEFAULT_TARGETS;
    const results = [];
    for (const reason of targets) {
      try {
        results.push(await exportOne(page, reason, args.dest));
      } catch (e) {
        results.push({ reason, ok: false, note: String(e.message).split("\n")[0].slice(0, 120) });
      }
      await page.goto(INDEX_URL, { waitUntil: "domcontentloaded" }).catch(() => {});
      await page.waitForTimeout(3000);
    }

    console.log("\n=== export 結果 ===");
    for (const r of results) console.log(`${r.ok ? "OK  " : "NG  "} ${r.reason} — ${r.note}`);
    const okCount = results.filter((r) => r.ok).length;
    console.log(`\n${okCount}/${results.length} 件を ${args.dest} に保存`);
    if (okCount === 0) {
      console.error("!! 1 件も export できていません。--probe で DOM を確認してください");
      process.exitCode = 1;
      return;
    }
    console.log("\n次: python3 .claude/scripts/gsc/ingest-gsc-export.py");
    console.log("    node .claude/scripts/gsc/build-coverage-queue.mjs");
  } finally {
    await context?.close().catch(() => {});
    releaseLock();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error("[export-coverage] failed:", e.message);
    process.exitCode = 1;
  });
}
