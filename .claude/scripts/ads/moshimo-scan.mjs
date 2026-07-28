#!/usr/bin/env node
/**
 * moshimo-scan.mjs — もしもアフィリエイトの未提携プロモーションを走査する (read-only)
 * ---------------------------------------------------------------------------
 * afb (Chosen ウィジェットの実クリック + 特殊ページャ) と違い、もしもは
 * **サイト分離が URL パラメータ (`shop_site_id`)・検索も URL パラメータ (`words`)** なので
 * 素直に組み立てられる。ただし罠が 2 つあり、どちらも実機ダンプで確認済み:
 *
 *   1. 検索語のパラメータは `words`。**`keyword=` は黙って無視され全件が返る** (config の注記)。
 *      「ヒットした」と誤認しないよう、件数表示を必ず読む。
 *   2. 一覧の各行は `<tr>` で、プロモーション ID は **チェックボックス `input[name="lump[]"]` の value**。
 *      表示テキストからは ID が取れない (行 grep では申請に使える ID が得られない)。
 *
 * サイト帰属は二重に確認する。ensureTargetSite (共通ガード) に加え、一覧フォームの
 * hidden `shop_site_id` を read-back して stats47 の ID と一致しなければ例外で止める。
 * doboku-note と同居しているため、ここを緩めると**他サイトの一覧を自分のものと誤認**する。
 *
 * 由来: doboku-note には moshimo 用の走査スクリプトが無く (afb-scan のみ)、
 * 検索結果のダンプだけが残っていた。その DOM 構造をもとに stats47 側で新規作成した。
 *
 * usage:
 *   node .claude/scripts/ads/moshimo-scan.mjs                          # 既定の検索語で走査
 *   node .claude/scripts/ads/moshimo-scan.mjs --query ふるさと納税      # 検索語を指定
 *   node .claude/scripts/ads/moshimo-scan.mjs --vertical furusato      # 抽出軸を絞る
 *   node .claude/scripts/ads/moshimo-scan.mjs --all                    # 抽出フィルタを外す
 */
import { writeFileSync, mkdirSync, appendFileSync } from "node:fs";
import { join } from "node:path";

import {
  loadAspConfig,
  getAsp,
  openAsp,
  ensureTargetSite,
  repoRoot,
  dumpFailure,
  aspBrowserCfg,
  makeRunId,
  SiteAttributionError,
} from "./lib/asp-browser.mjs";
import {
  VERTICAL_KEYWORDS,
  buildVerticalFilter,
  guessVertical,
  assertKnownVerticals,
} from "./lib/asp-vertical-keywords.mjs";

/** 既定の検索語。stats47 の需要が大きい軸から引く (placement-map の imp 順)。 */
const DEFAULT_QUERIES = ["ふるさと納税", "保険", "住宅", "転職", "旅行"];

function parseArgs() {
  const a = process.argv.slice(2);
  const o = { queries: null, verticals: null, all: false, maxPages: 5 };
  for (let i = 0; i < a.length; i++) {
    if (a[i] === "--query") o.queries = a[++i].split(",").map((s) => s.trim()).filter(Boolean);
    else if (a[i] === "--vertical") o.verticals = a[++i].split(",").map((s) => s.trim()).filter(Boolean);
    else if (a[i] === "--all") o.all = true;
    else if (a[i] === "--max-pages") o.maxPages = parseInt(a[++i], 10) || 5;
  }
  if (!o.queries) o.queries = DEFAULT_QUERIES;
  assertKnownVerticals(o.verticals);
  return o;
}

/** 検索 URL を組み立てる。サイト ID を必ず載せる (載せないと既定サイト側が返る)。 */
function searchUrl(asp, siteId, words, page) {
  const u = new URL(asp.baseUrl + asp.searchPath);
  u.searchParams.set(asp.siteParam, siteId);
  u.searchParams.set(asp.searchParam, words);
  u.searchParams.set("limit", "100"); // 表示件数。ページ送りを減らす
  if (page > 1) u.searchParams.set("p", String(page));
  return u.toString();
}

/**
 * 一覧の行を DOM から取る。ID はチェックボックスの value でしか取れない。
 * 状態 (未申請/申請中/提携中) は行内の apply-status セルから読む。
 *
 * `$$eval` は Playwright の DOM 取得 API (セレクタに一致した要素へコールバックを適用) であって
 * JavaScript の `eval()` ではない。ページ由来の文字列をコードとして実行してはいない。
 */
async function scrapeRows(page) {
  return page.$$eval("table.item-table tbody tr", (trs) =>
    trs
      .map((tr) => {
        const cb = tr.querySelector('input[name="lump[]"]');
        const name = tr.querySelector("td.promotion-name")?.textContent?.trim() ?? "";
        const reward = tr.querySelector("td.max-result")?.textContent?.replace(/\s+/g, " ").trim() ?? "";
        const status = tr.querySelector("td.apply-status")?.textContent?.replace(/\s+/g, " ").trim() ?? "";
        return { id: cb?.getAttribute("value") ?? null, name, reward, status };
      })
      .filter((r) => r.id && r.name),
  );
}

/** 一覧フォームの hidden shop_site_id を read-back する (帰属の二重確認)。 */
async function readBackSiteId(page) {
  return page
    .$eval('input[name="shop_site_id"]', (el) => el.getAttribute("value"))
    .catch(() => null);
}

async function main() {
  const opts = parseArgs();
  const filter = buildVerticalFilter(opts.verticals);
  const root = loadAspConfig();
  const asp = getAsp(root, "moshimo");
  const siteId = asp.sites?.[root.targetSiteName];
  if (!siteId) throw new Error(`moshimo: sites に ${root.targetSiteName} がありません (サイト ID 未設定)`);

  const runId = makeRunId();
  const debugDir = join(repoRoot(), asp.browser.debugDir);
  mkdirSync(debugDir, { recursive: true });
  const logPath = join(debugDir, "scan-progress.log");
  writeFileSync(logPath, "", "utf-8");
  const log = (msg) => {
    console.log(msg);
    try {
      appendFileSync(logPath, `${new Date().toISOString()} ${msg}\n`, "utf-8");
    } catch {}
  };

  log(`もしも 走査  対象サイト=${root.targetSiteName} (SID ${siteId})`);
  log(`  抽出軸: ${opts.all ? "なし (全件)" : (opts.verticals ?? Object.keys(VERTICAL_KEYWORDS)).join(", ")}`);
  log(`  検索語: ${opts.queries.join(" / ")}`);
  log(`進捗ログ: ${logPath}`);

  const isReady = async (page) => !new RegExp(asp.reAuthPattern, "i").test(page.url());
  const { ctx, page } = await openAsp(asp, { isReady, label: "moshimo" });

  try {
    const site = await ensureTargetSite(page, asp, root, { navigateTo: asp.searchPath });
    log(`サイト assert OK: ${site.reason}`);

    const hits = new Map();
    let scanned = 0;

    for (const words of opts.queries) {
      for (let p = 1; p <= opts.maxPages; p++) {
        await page.goto(searchUrl(asp, siteId, words, p), { waitUntil: "domcontentloaded" });

        // ★ 帰属の二重確認。フォームの hidden が他サイトなら 1 行も読まずに止める。
        const back = await readBackSiteId(page);
        if (back && back !== siteId) {
          await dumpFailure(page, aspBrowserCfg(asp), runId, {
            step: "site-readback",
            message: `shop_site_id=${back} (期待 ${siteId})`,
          });
          throw new SiteAttributionError(
            `もしも: 一覧が別サイト (shop_site_id=${back} / 期待 ${siteId})。読み取りを中止する。`,
          );
        }

        const rows = await scrapeRows(page);
        if (rows.length === 0) {
          if (p === 1) log(`  「${words}」: 0 件 (検索語が効いていない可能性 — ダンプを確認)`);
          break;
        }
        scanned += rows.length;
        let add = 0;
        for (const r of rows) {
          if (hits.has(r.id)) continue;
          if (/提携中/.test(r.status)) continue; // 既提携は対象外
          if (!opts.all && !filter.test(r.name)) continue;
          hits.set(r.id, { ...r, vertical: guessVertical(r.name), query: words });
          add++;
        }
        log(`  「${words}」p${p}: ${rows.length} 行中 ${add} 件ヒット`);
        if (rows.length < 100) break; // 最終ページ
      }
    }

    const list = [...hits.values()].sort((a, b) => (a.vertical ?? "zz").localeCompare(b.vertical ?? "zz"));
    log("");
    log(`走査 ${scanned} 行 → 抽出 ${list.length} 件`);
    for (const x of list) {
      log(`  [${x.vertical ?? "-"}] id=${x.id} ${x.status} ${x.reward}  ${x.name}`);
    }

    const outPath = join(debugDir, "scan-result.json");
    writeFileSync(outPath, JSON.stringify({ scannedAt: new Date().toISOString(), siteId, queries: opts.queries, items: list }, null, 2), "utf-8");
    log(`結果: ${outPath}`);
    log("※ 提携申請は affiliate-apply.mjs --asp moshimo --id <id> (--commit で実申請)");
  } catch (e) {
    if (e instanceof SiteAttributionError) log(`❌ ${e.message}`);
    else {
      log(`❌ 失敗: ${String(e.message ?? e).split("\n")[0]}`);
      await dumpFailure(page, aspBrowserCfg(asp), runId, { step: "scan", message: String(e.message ?? e) }).catch(() => {});
    }
    process.exitCode = 1;
  } finally {
    await ctx.close().catch(() => {});
  }
}

main();
