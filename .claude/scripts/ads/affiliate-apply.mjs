#!/usr/bin/env node
/**
 * affiliate-apply.mjs — 提携申請を実行する (dry-run 既定・--commit gate)
 * ---------------------------------------------------------------------------
 * 提携申請は「規約への同意」を伴う不可逆操作なので、既定は dry-run。
 * `--commit` を付けたときだけ実際にボタンを押す。
 *
 * 安全弁 (どれも doboku-note 側で実害・未遂があったもの):
 *   1. **サイト帰属を確定できなければ例外で停止** (asp-site-guard)。stats47 と doboku-note が同居。
 *   2. **「一括提携申請へ」を絶対に押さない**。ラベル完全一致 ＋ 「一括」を含むものを明示除外。
 *      部分一致でボタンを拾うと**画面上の全案件を一度に申請**してしまう。
 *   3. もしもの申請ページには**サイト select** があり、未選択のまま押すと別サイトで提携する。
 *      選択して read-back で確認してからでないと押さない。
 *   4. ログイン・CAPTCHA は人間。認証情報は扱わない。
 *   5. Red Line 案件 (カタログの `redLine: true`) は `--commit` でも申請しない。
 *
 * A8 の申請は本スクリプトの対象外。`/scout-asp` が担当する
 * (週次の申請上限ガード `check-a8-apply-budget.cjs` がそちらに配線されているため)。
 *
 * 由来: doboku-note `scripts/affiliate-apply.mjs`
 *
 * usage:
 *   node .claude/scripts/ads/affiliate-apply.mjs --asp moshimo --id 6154            # dry-run
 *   node .claude/scripts/ads/affiliate-apply.mjs --asp moshimo --id 6154 --commit   # 実申請
 */
import { createRequire } from "node:module";

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

import {
  loadAspConfig,
  getAsp,
  openAsp,
  ensureTargetSite,
  visibleText,
  dumpFailure,
  targetSiteLabel,
  repoRoot,
} from "./lib/asp-browser.mjs";

const CATALOG = join(repoRoot(), ".claude/state/ads/affiliate-catalog.json");

// 頻度ガードは CommonJS (A8 側の check-a8-apply-budget.cjs と同じ形) なので require で読む。
const { applyBudget, toJstDate } = createRequire(import.meta.url)("./check-asp-apply-budget.cjs");

function parseArgs() {
  const a = process.argv.slice(2);
  const o = { asp: null, ids: [], commit: false };
  for (let i = 0; i < a.length; i++) {
    if (a[i] === "--asp") o.asp = a[++i];
    else if (a[i] === "--id") o.ids.push(...a[++i].split(",").map((s) => s.trim()));
    else if (a[i] === "--commit") o.commit = true;
  }
  if (!o.asp || o.ids.length === 0) {
    console.error("usage: --asp <moshimo|afb> --id <id[,id]> [--commit]");
    process.exit(2);
  }
  return o;
}

/** カタログから該当エントリを引く (Red Line 判定と記録更新のため)。 */
/**
 * 申請結果を台帳に刻む。**エントリが無ければ作る。**
 *
 * ★ 旧実装は既存エントリを探して status を書き換えるだけだった。台帳は空 (`programs: {}`) が
 *   初期状態なので、申請しても**どこにも記録が残らない** (2026-07-28 に 4 件が記録ゼロ)。
 *   何をいつ申請したかが残らないと、翌週の運用者は重複申請も承認待ちの追跡もできない。
 *   申請の事実は実機で確認したものだけを書く (verifyApplied を通ったもののみ呼ぶ)。
 */
function recordApplied(catalog, aspName, id, name, at) {
  catalog.programs ??= {};
  const hit = findInCatalog(catalog, aspName, id);
  const key = hit?.key ?? `${aspName}-${id}`;
  const program = (catalog.programs[key] ??= { name: name ?? key, asps: {} });
  if (name && !hit) program.name = name;
  program.asps ??= {};
  const entry = (program.asps[aspName] ??= {});
  entry.promotionId = String(id);
  entry.status = "applying";
  entry.appliedAt = at;
  // 申請履歴 (頻度ガードの入力)。同日の重複は積まない。
  entry.history ??= [];
  if (!entry.history.some((h) => h.at === at && h.status === "applying")) {
    entry.history.push({ at, status: "applying" });
  }
  return key;
}

function findInCatalog(catalog, aspName, id) {
  for (const [key, p] of Object.entries(catalog.programs ?? {})) {
    const e = p.asps?.[aspName];
    if (!e) continue;
    if ([e.programId, e.promotionId, e.pid].filter(Boolean).map(String).includes(String(id))) {
      return { key, program: p, entry: e };
    }
  }
  return null;
}

/**
 * 申請ページ URL を組み立てる。
 *
 * ★ もしもは `/af/shop/promotion/<id>` ではない (404)。移植元から引き継いだこの形は
 *   doboku-note でも実際には使われておらず、stats47 で初めて実行して誤りが判明した
 *   (2026-07-28)。正しい形は検索結果 HTML の実リンクから確認した:
 *   `/af/shop/promotion/affiliate/comprehension/apply?promotion_id=<id>`
 *   URL は推測で組まず、必ず実ページのリンクを根拠にする。
 */
function detailUrl(aspName, id, asp) {
  if (aspName === "moshimo") {
    const prefix = asp?.applyPathPrefix ?? "/af/shop/promotion/affiliate/comprehension/apply?promotion_id=";
    return `${prefix}${id}`;
  }
  if (aspName === "afb") return `/pa/promo_detail/?pid=${id}`;
  throw new Error(`${aspName}: 申請の自動化は未対応 (A8 の申請は /scout-asp が担当)`);
}

/**
 * 申請ボタンを一意に特定する。**「一括」を含むものは候補から外す**。
 * exact 一致で探し、複数ヒットしたら押さずに落とす (どれを押したか曖昧なまま進めない)。
 */
async function findApplyButton(page, label) {
  // ★ ページ自体が出ていない (404 / エラー) のを「提携済みかも」と報告しない。
  //   実際にこれで誤診した (2026-07-28): URL が誤りで全件 404 だったのに
  //   「既に提携済み/申請中の可能性」と出て、走査結果の「未申請」と矛盾していた。
  const body = (await page.innerText("body").catch(() => "")) || "";
  if (/404|not found|ページが見つかりません|エラーが発生/i.test(body.slice(0, 400))) {
    return { ok: false, reason: "ページが表示されない (URL か画面構造の誤り。提携状態とは無関係)" };
  }
  const all = page.getByRole("button", { name: label, exact: true });
  const links = page.getByRole("link", { name: label, exact: true });
  const pool = [];
  for (const loc of [all, links]) {
    const n = await loc.count().catch(() => 0);
    for (let i = 0; i < n; i++) {
      const el = loc.nth(i);
      const t = (await el.innerText().catch(() => "")) || "";
      if (t.includes("一括")) continue; // ← 絶対に押さない
      pool.push(el);
    }
  }
  if (pool.length === 0) return { ok: false, reason: `「${label}」が見つからない (既に提携済み/申請中の可能性)` };
  if (pool.length > 1)
    return { ok: false, reason: `「${label}」が ${pool.length} 個ある。どれを押すか確定できないので中止` };
  return { ok: true, el: pool[0] };
}

/**
 * 押す前に「このフォームの申請対象がちょうど 1 件で、しかも指定した案件か」を確かめる。
 *
 * ★ もしもの申請ページは見出しが「プロモーション 一括提携申請」で、フォームは複数申請にも
 *   使える作りに見える。実機では promotion_id を渡すと hidden input が 1 個だけの単一申請に
 *   なることを確認したが (2026-07-28)、**画面仕様が変われば黙って複数申請になりうる**。
 *   規約上「一括提携申請」は絶対に避けたいので、ボタンのラベルだけに頼らず対象数を数える。
 */
async function assertSingleTarget(page, id) {
  const found = await page.evaluate(() => ({
    promo: [...document.querySelectorAll('input[name="promotion_id"], input[name="promotion_id[]"]')].map((e) => e.value),
    lump: [...document.querySelectorAll('input[name="lump[]"]')].map((e) => e.value),
  }));
  if (found.lump.length > 0) {
    return { ok: false, reason: `一括申請用の入力が ${found.lump.length} 個ある。単一申請と確定できないので押さない` };
  }
  if (found.promo.length !== 1) {
    return { ok: false, reason: `申請対象が ${found.promo.length} 件 (期待 1 件)。押さない` };
  }
  if (String(found.promo[0]) !== String(id)) {
    return { ok: false, reason: `申請対象が ${found.promo[0]} で指定 ${id} と違う。押さない` };
  }
  return { ok: true, reason: `申請対象 1 件 (promotion_id=${found.promo[0]})` };
}

/** 申請ページから案件名を取る (完了判定の照合キー。ページ見出しは全案件共通で使えない)。 */
async function readPromotionName(page) {
  const body = (await page.innerText("body").catch(() => "")) || "";
  const m = body.match(/基本情報\s*\n\s*(.+)/);
  return m ? m[1].trim() : null;
}

/**
 * 申請が本当に成立したかを**実測**する。
 *
 * ★ 旧実装はクリック後の本文に「申請」が含まれるかで判定していた。確認ページの見出しにも
 *   「申請」が出るため、確定していなくても成功と報告していた (2026-07-28 に 4 件を誤報)。
 *   文言ではなく「申請中一覧に当該案件が現れたか」を唯一の根拠にする。
 */
async function verifyApplied(page, asp, siteId, promoName) {
  if (!promoName) return { ok: false, reason: "案件名を取れず完了を確認できない" };
  if (!asp.applyingPath) return { ok: false, reason: "申請中一覧のパスが未設定で確認できない" };
  const u = new URL(asp.baseUrl + asp.applyingPath);
  if (asp.siteParam && siteId) u.searchParams.set(asp.siteParam, siteId);
  u.searchParams.set("limit", "100");
  await page.goto(u.toString(), { waitUntil: "domcontentloaded" }).catch(() => {});
  // `$$eval` は Playwright の DOM 取得 API (セレクタ一致要素へコールバックを適用) であって
  // JavaScript の `eval()` ではない。ページ由来の文字列をコードとして実行してはいない。
  const names = await page
    .$$eval("td.promotion-name", (tds) => tds.map((td) => td.textContent.trim()))
    .catch(() => []);
  if (names.length === 0) return { ok: false, reason: "申請中一覧を読めず完了を確認できない" };
  const hit = names.some((n) => n.includes(promoName) || promoName.includes(n));
  return hit ? { ok: true, reason: "" } : { ok: false, reason: "申請中一覧に現れない (未完了の可能性)" };
}

/**
 * もしもの申請フォームにあるサイト select を対象サイトにして read-back 確認する。
 * option の表示文字列は config の targetSiteLabel (例「統計で見る都道府県」)。
 * `sites` マップのキー ("stats47") では option が見つからない。
 */
async function selectSiteInForm(page, asp, siteLabel, siteId) {
  const sel = page.locator("select").filter({ hasText: siteLabel }).first();
  if (!(await sel.count().catch(() => 0))) return { ok: true, reason: "サイト select 無し (不要)" };
  await sel.selectOption({ label: siteLabel }).catch(async () => {
    await sel.selectOption(String(siteId)).catch(() => {});
  });
  await page.waitForTimeout(500);
  const chosen = await sel.evaluate((s) => s.options[s.selectedIndex]?.text ?? "").catch(() => "");
  if (!chosen.includes(siteLabel)) {
    return { ok: false, reason: `サイト select を ${siteLabel} にできなかった (現在: ${chosen || "不明"})` };
  }
  return { ok: true, reason: `サイト select = ${chosen}` };
}

async function main() {
  const opts = parseArgs();
  const root = loadAspConfig();
  const asp = getAsp(root, opts.asp);
  if (!existsSync(CATALOG)) {
    console.error(`カタログがありません: ${CATALOG}`);
    process.exit(2);
  }
  const catalog = JSON.parse(readFileSync(CATALOG, "utf-8"));
  const siteLabel = targetSiteLabel(asp, root);
  const siteId = asp.sites?.[root.targetSiteName];

  console.log(
    `提携申請 [${asp.label}] ${opts.ids.length} 件  対象サイト=${siteLabel}  モード=${opts.commit ? "★実申請" : "dry-run"}`,
  );

  // ★ 週の申請上限。A8 だけにあって もしも/afb は無制限だった (2026-07-28 に是正)。
  //   同じ口座に doboku-note が同居しているため、短時間の大量申請は口座全体のリスクになる。
  if (opts.commit) {
    const budget = applyBudget(catalog, opts.asp, toJstDate(new Date().toISOString()));
    console.log(`申請枠: 今週 ${budget.weekCount}/${budget.max} (残 ${budget.remaining})`);
    if (!budget.ok) {
      console.error(`✗ ${opts.asp} の週上限 ${budget.max} 件に到達。今週はこれ以上申請しない`);
      process.exit(1);
    }
    if (opts.ids.length > budget.remaining) {
      console.error(`✗ 指定 ${opts.ids.length} 件が残枠 ${budget.remaining} を超える。件数を減らして再実行する`);
      process.exit(1);
    }
  }

  // Red Line は --commit でも通さない (gate の前に落とす)
  const blocked = [];
  for (const id of opts.ids) {
    const hit = findInCatalog(catalog, opts.asp, id);
    if (hit?.program?.redLine) blocked.push({ id, key: hit.key });
  }
  if (blocked.length) {
    for (const b of blocked) console.error(`  ✗ ${b.id} (${b.key}) は Red Line 案件。申請しない`);
    process.exit(1);
  }

  const isReady = asp.readyMarker
    ? async (page) =>
        !new RegExp(asp.reAuthPattern, "i").test(page.url()) &&
        (await page.locator(asp.readyMarker).count().catch(() => 0)) > 0
    : undefined;
  const { ctx, page } = await openAsp(asp, { isReady, label: opts.asp });

  const results = [];
  try {
    for (const id of opts.ids) {
      const path = detailUrl(opts.asp, id, asp);
      // サイト帰属の確定 (不一致は例外で全体が止まる。握り潰さない)
      const site = await ensureTargetSite(page, asp, root, { navigateTo: path });
      console.log(`\n[${id}] ${site.reason}`);

      const text = await visibleText(page, 4000);
      // 案件名は「基本情報」直後の行から取る。先頭行はサイト共通の見出し (「もしもキャッシュバック」)
      // で全案件同じになり、どれを申請したのか報告から判別できなかった。
      const promoName = await readPromotionName(page);
      const title = (promoName || text.split("\n").find((l) => l.trim().length > 4) || "").trim().slice(0, 60);

      const btn = await findApplyButton(page, asp.applyButtonLabel ?? "提携申請する");
      if (!btn.ok) {
        console.log(`  skip: ${btn.reason}`);
        results.push({ id, title, action: "skip", reason: btn.reason });
        continue;
      }

      // ★ 一括申請の事故防止。ラベルではなくフォームの対象数で判定する。
      if (opts.asp === "moshimo") {
        const single = await assertSingleTarget(page, id);
        if (!single.ok) {
          console.log(`  ✗ ${single.reason}`);
          results.push({ id, title, action: "abort", reason: single.reason });
          continue;
        }
        console.log(`  ${single.reason}`);
      }

      const siteSel = await selectSiteInForm(page, asp, siteLabel, siteId);
      if (!siteSel.ok) {
        console.log(`  ✗ ${siteSel.reason}`);
        results.push({ id, title, action: "abort", reason: siteSel.reason });
        continue;
      }
      console.log(`  ${siteSel.reason}`);

      if (!opts.commit) {
        console.log(`  dry-run: 「${asp.applyButtonLabel}」を押せる状態 (押していない)`);
        results.push({ id, title, action: "dry-run", reason: "押下可能" });
        continue;
      }

      await btn.el.click();
      await page.waitForTimeout(4000);

      // ★ もしもは 2 段階。1 段目は確認ページへ行くだけで申請は成立しない。
      //   ここを踏まずに文言判定していたため「申請した」と誤報していた (2026-07-28)。
      if (asp.confirmButtonLabel && /\/confirm/.test(page.url())) {
        const confirm = await findApplyButton(page, asp.confirmButtonLabel);
        if (!confirm.ok) {
          console.log(`  ✗ 確認ページの「${asp.confirmButtonLabel}」を押せない: ${confirm.reason}`);
          await dumpFailure(page, { browser: asp.browser }, `apply-confirm-${opts.asp}-${id}`).catch(() => {});
          results.push({ id, title, action: "unverified", reason: "確認ページで確定できず" });
          continue;
        }
        await confirm.el.click();
        await page.waitForTimeout(4000);
      }

      // ★ 完了判定は文言ではなく実測。申請中一覧に当該案件が出て初めて「申請した」と言う。
      const verified = await verifyApplied(page, asp, siteId, promoName);
      console.log(`  ${verified.ok ? "✓ 申請を確認" : `△ ${verified.reason}`}`);
      if (!verified.ok) await dumpFailure(page, { browser: asp.browser }, `apply-${opts.asp}-${id}`).catch(() => {});
      const ok = verified.ok;
      results.push({ id, title, action: ok ? "applied" : "unverified", reason: ok ? "" : verified.reason });

      // 台帳へ記録。エントリが無ければ作る (空台帳だと何も残らず、翌週の運用が追えない)。
      if (ok) recordApplied(catalog, opts.asp, id, promoName ?? title, new Date().toISOString());
    }
  } finally {
    await ctx.close().catch(() => {});
  }

  if (opts.commit && results.some((r) => r.action === "applied")) {
    catalog.updatedAt = new Date().toISOString();
    writeFileSync(CATALOG, JSON.stringify(catalog, null, 2) + "\n", "utf-8");
    console.log(`\nカタログを更新 (applying へ)。実状態は affiliate-status.mjs で確認する`);
  }

  console.log(`\n=== まとめ ===`);
  for (const r of results) console.log(`  ${r.action.padEnd(10)} ${r.id} ${r.title}${r.reason ? ` — ${r.reason}` : ""}`);
  if (!opts.commit) console.log(`\n→ 実申請するには --commit を付ける (規約同意を伴うのでユーザーの明示許可が要る)`);
}

main().catch((e) => {
  console.error("Fatal:", e?.message || e);
  process.exit(1);
});
