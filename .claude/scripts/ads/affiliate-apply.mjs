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
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
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

import {
  buildPlan,
  buildJournalEvent,
  validatePlanForCommit,
  deriveOperationOutcome,
} from "./lib/asp-operation-core.mjs";
import {
  writePlan,
  readPlan,
  expirePlan,
  appendJournal,
  readJournal,
} from "./lib/asp-operation-store.mjs";
import {
  buildEligibilityFingerprintMaterial,
  evaluateAffiliateEligibility,
} from "./lib/affiliate-eligibility-core.mjs";

const CATALOG = join(repoRoot(), ".claude/state/ads/affiliate-catalog.json");

// 頻度ガードは CommonJS (A8 側の check-a8-apply-budget.cjs と同じ形) なので require で読む。
const { applyBudget, toJstDate } = createRequire(import.meta.url)("./check-asp-apply-budget.cjs");

function parseArgs() {
  const a = process.argv.slice(2);
  const o = { asp: null, ids: [], commit: false, plan: null };
  for (let i = 0; i < a.length; i++) {
    if (a[i] === "--asp") o.asp = a[++i];
    else if (a[i] === "--id") o.ids.push(...a[++i].split(",").map((s) => s.trim()));
    else if (a[i] === "--commit") o.commit = true;
    else if (a[i] === "--plan") o.plan = a[++i];
  }
  const err = validateArgs(o);
  if (err) {
    console.error(err);
    console.error("usage:");
    console.error("  --asp <moshimo|afb> --id <id[,id]>        # dry-run (plan を作る)");
    console.error("  --asp <moshimo|afb> --plan <operationId> --commit   # 実申請 (plan 1 件だけ)");
    process.exit(2);
  }
  return o;
}

/**
 * 引数の整合 (doc 42 §6.3)。`--commit` は `--plan` を必須にし `--id` を禁止する。
 *
 * ★なぜ `--commit --id` を禁じるか: id 直指定だと「見た画面」と「押す画面」が別 run になり、
 *   間に案件の差し替え・サイト select の変化が起きても検知できない。plan を挟むと
 *   commit 直前の再照合で不一致を捕まえられる。純関数にして単体で固定する。
 *
 * @returns {string|null} エラー文言 (問題なければ null)
 */
export function validateArgs(o) {
  if (!o.asp) return "--asp が必要";
  if (o.commit) {
    if (!o.plan) return "--commit には --plan <operationId> が必要 (dry-run で作った計画を指す)";
    if (o.ids.length > 0) return "--commit --id は禁止 (押す対象は plan だけが決める)";
    return null;
  }
  if (o.plan) return "--plan は --commit と一緒に使う (dry-run は --id で対象を指定する)";
  if (o.ids.length === 0) return "--id が必要";
  return null;
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
function recordApplied(catalog, aspName, id, name, at, status = "applying") {
  catalog.programs ??= {};
  const hit = findInCatalog(catalog, aspName, id);
  const key = hit?.key ?? `${aspName}-${id}`;
  const program = (catalog.programs[key] ??= { name: name ?? key, asps: {} });
  if (name && !hit) program.name = name;
  program.asps ??= {};
  const entry = (program.asps[aspName] ??= {});
  entry.promotionId = String(id);
  // 即時承認 (申請中を経ず提携中へ直行) は approved で記録する — 2026-07-28 実測
  entry.status = status;
  entry.appliedAt = at;
  // 申請履歴 (頻度ガードの入力)。即時承認でも「申請 1 件」として数える。同日の重複は積まない。
  entry.history ??= [];
  if (!entry.history.some((h) => h.at === at && h.status === "applying")) {
    entry.history.push({ at, status: "applying" });
    if (status === "approved") entry.history.push({ at, status: "approved", note: "即時承認 (提携中一覧で確認)" });
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
  // afb は detail URL が存在しない (旧 `/pa/promo_detail/?pid=` はトップへフォールバック・2026-07-28 実測)。
  // applyAfbOne の検索フローを使うため、ここへは来ない。
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
  return { ok: true, reason: `申請対象 1 件 (promotion_id=${found.promo[0]})`, formTargetCount: found.promo.length };
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
 *   文言ではなく「一覧に当該案件が現れたか」を唯一の根拠にする。
 * ★★ 即時承認プログラムは申請中を**経由せず提携中へ直行**する (2026-07-28 の一括申請で 4 件実測
 *   — 申請中のみを見て「現れない」と誤報した)。申請中→提携中の順で両一覧を確認し、
 *   どちらに現れたか (applying / approved) も返す。
 */
async function verifyApplied(page, asp, siteId, promoName, promoId = null) {
  if (!promoName) return { ok: false, reason: "案件名を取れず完了を確認できない" };
  const lists = [
    ["applying", asp.applyingPath],
    ["approved", asp.partneredPath],
  ].filter(([, p]) => p);
  if (lists.length === 0) return { ok: false, reason: "確認用一覧のパスが未設定で確認できない" };
  let readable = false;
  for (const [state, path] of lists) {
    const u = new URL(asp.baseUrl + path);
    if (asp.siteParam && siteId) u.searchParams.set(asp.siteParam, siteId);
    u.searchParams.set("limit", "100");
    await page.goto(u.toString(), { waitUntil: "domcontentloaded" }).catch(() => {});
    // `$$eval` は Playwright の DOM 取得 API (セレクタ一致要素へコールバックを適用) であって
    // JavaScript の `eval()` ではない。ページ由来の文字列をコードとして実行してはいない。
    const names = await page
      .$$eval("td.promotion-name", (tds) => tds.map((td) => td.textContent.trim()))
      .catch(() => []);
    if (names.length > 0) readable = true;
    if (names.some((n) => n.includes(promoName) || promoName.includes(n))) {
      return { ok: true, state, reason: "" };
    }
    // 名前照合の補助: promotion_id が href に出る (もしも実測)
    // ★ スコープをページ全体にしない (2026-08-04 実機診断)。もしもの一覧ページには一覧行の
    //   外にページ共通リンク 3 件 (promotion_id=7630 / 7556 / 170) があり、提携中・申請中の
    //   **両方**に出る (= 論理的に一覧項目ではない)。ページ全体から拾うと、この 3 件のいずれかを
    //   申請したとき、申請が成立していなくても「申請完了」と報告してしまう。申請は
    //   outward-facing なので誤報の実害が大きい。
    //   スコープは config の listScopeSelector (もしも: "table a[href]" — 一覧行と完全一致する
    //   ことを実機で確認済み: 提携中 32 行 = ID 32 件 / 申請中 54 行 = ID 54 件) を使い、
    //   **ページ全体へ fallback しない**。取れなければ href を根拠にしない (fail-closed) —
    //   主判定は上の名前照合なので、確認できないときは「未完了の可能性」と報告するのが正しい。
    //   同じ超集合バグが affiliate-status.mjs にもあり、そちらは同 config キーで是正済み。
    //   (`$$eval` は上と同じく Playwright の DOM 取得 API で、JavaScript の `eval()` ではない。)
    if (promoId && asp.listScopeSelector) {
      const hrefs = await page
        .$$eval(asp.listScopeSelector, (as) => as.map((a) => a.getAttribute("href") ?? ""))
        .catch(() => []);
      if (hrefs.some((h) => new RegExp(`promotion_id=${promoId}(?![0-9])`).test(h))) {
        return { ok: true, state, reason: "" };
      }
    }
  }
  if (!readable) return { ok: false, reason: "一覧を読めず完了を確認できない" };
  return { ok: false, reason: "申請中/提携中いずれの一覧にも現れない (未完了の可能性)" };
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

/**
 * afb の申請フロー (2026-07-28 実機確認)。moshimo と URL 構造が全く違うため専用実装。
 *
 *   1. 未提携一覧 (rel=non) でサイト帰属を assert (SID バナーはこのページにしか出ない)
 *   2. ヘッダー検索 input[name=pm_search] に PID → 結果の行 【PID:N】 に到達
 *      (※`/pa/promo_detail/?pid=` は存在せず**トップへフォールバック**する。実在する
 *       `/pa/promodetail/?adv_id=` は「広告原稿取得」ページで申請ボタンが無い — どちらも申請不可)
 *   3. 行 badge (未提携/申請中/提携中…) を読む — 申請済みならスキップ
 *   4. 行内 a>img[alt="提携申請はこちら"] クリック → 確認ブロック表示 (この時点では未申請)
 *   5. 確認ブロックの赤字「【サイト】統計で見る都道府県 と下記プロモーションと提携します」を assert。
 *      ★「同時申請はこちら」(テキストリンク) は**未提携の他サイト = doboku-note も同時申請**する。
 *        img ボタンだけを押し、テキストリンクは候補にしない。
 *   6. a>img[alt="提携申請はこちら"] がちょうど 1 個であることを確認して押す
 *   7. 検証は文言でなく実測: PID を再検索し行 badge が 申請中/提携中 に変わったこと
 */
async function applyAfbOne(page, asp, root, siteLabel, id, commit, { catalog, plan }) {
  await ensureTargetSite(page, asp, root, { navigateTo: "/pa/promolist/?rel=non" });

  // ★ 検索結果ページには status badge テキストが出ない (rel=non 一覧と別レイアウト・2026-07-28 実測)。
  //   状態は文言でなく **申請ボタンの有無 (DOM 状態)** で判定する:
  //   ボタンあり = 未提携 (申請可) / 行はあるがボタン無し = 申請済みか提携済み。
  const searchPid = async () => {
    const input = page.locator('input[name="pm_search"]').first();
    if (!(await input.count().catch(() => 0))) throw new Error("検索欄 pm_search が見つからない (UI 変更?)");
    await input.fill(String(id));
    await input.press("Enter");
    await page.waitForTimeout(7000);
    const text = await visibleText(page);
    const found = new RegExp(`【PID[:：]\\s*${id}】`).test(text);
    // 「同時申請」はテキストリンクなので、img[alt] 限定でボタンだけを数える
    const applyHrefs = await page
      .locator('a:has(img[alt="提携申請はこちら"])')
      .evaluateAll((as) => [...new Set(as.map((a) => a.getAttribute("href")))])
      .catch(() => []);
    return { text, found, applyHrefs };
  };

  const first = await searchPid();
  if (!first.found) return { id, title: "", action: "skip", reason: "検索で行に到達できず (PID 不明/取扱終了?)" };

  // 案件名: PID 行の 2 行後 (広告主の次) がプロモーション名 (afb-scan と同じブロック構造)
  const lines = first.text.split("\n").map((l) => l.trim());
  const pidIdx = lines.findIndex((l) => new RegExp(`【PID[:：]\\s*${id}】`).test(l));
  const title = (lines[pidIdx + 2] || lines[pidIdx + 1] || "").slice(0, 60);

  if (first.applyHrefs.length === 0) {
    // 既申請/既提携は「今週の申請」ではないので budget に数えない (取り込みは affiliate-status --write の担当)
    return { id, title, action: "skip", reason: "申請ボタン無し = 申請済みか提携済み (status --write で確定)" };
  }
  if (first.applyHrefs.length > 1) {
    // 小ボタン (btn_app) と大ボタン (btn_application) が同一 href で並ぶのは正常。
    // 行き先が複数種あるときだけ「どれを押したか曖昧」なので中止する。
    await dumpFailure(page, { browser: asp.browser }, `apply-afb-ambiguous-row-${id}`).catch(() => {});
    return { id, title, action: "abort", reason: `申請ボタンの行き先が ${first.applyHrefs.length} 種 (単一のときだけ押す)` };
  }

  await page.locator('a:has(img[alt="提携申請はこちら"])').first().click();
  await page.waitForTimeout(6000);

  // 確認ブロックの site assert (赤字の対象サイト表記)
  const confirmText = await visibleText(page);
  const siteM = confirmText.match(/【サイト】\s*(.+?)\s*と/);
  if (!/下記プロモーションと提携します/.test(confirmText) || !siteM) {
    await dumpFailure(page, { browser: asp.browser }, `apply-afb-noconfirm-${id}`).catch(() => {});
    return { id, title, action: "unverified", reason: "確認ブロックが出ない (UI 変更?)" };
  }
  if (!siteM[1].includes(siteLabel)) {
    // サイト不一致は口座同居事故 (doboku-note へ申請) に直結するため即中止
    throw new Error(`[site-guard] afb 確認ブロックの対象サイトが「${siteM[1]}」(期待: ${siteLabel})`);
  }

  // 確定ボタンは <input type=image name=app_reg alt=提携申請はこちら> が上下 2 箇所 (同一 submit)。
  const finalBtns = page.locator('input[type="image"][name="app_reg"][alt="提携申請はこちら"]');
  if ((await finalBtns.count().catch(() => 0)) === 0) {
    await dumpFailure(page, { browser: asp.browser }, `apply-afb-nofinal-${id}`).catch(() => {});
    return { id, title, action: "abort", reason: "確定ボタン (app_reg) が見つからない (UI 変更?)" };
  }

  // ★ 同時申請 checkbox (same_site_app[] = 他サイトの SID。984453 = doboku-note) が 1 つでも
  //   チェックされたまま submit すると**他サイトも同時申請**になる。全て外し、外せなければ中止。
  const sameApp = page.locator('input[name="same_site_app[]"]');
  const sameCount = await sameApp.count().catch(() => 0);
  for (let i = 0; i < sameCount; i++) {
    const cb = sameApp.nth(i);
    if (await cb.isChecked().catch(() => false)) await cb.uncheck().catch(() => {});
  }
  const stillChecked = await sameApp.evaluateAll((els) => els.filter((e) => e.checked).map((e) => e.value)).catch(() => []);
  if (stillChecked.length > 0) {
    await dumpFailure(page, { browser: asp.browser }, `apply-afb-sameapp-${id}`).catch(() => {});
    return { id, title, action: "abort", reason: `同時申請チェックを外せない (SID: ${stillChecked.join(",")})` };
  }

  // afb は確認ブロックまで来て初めて対象が確定する。ここが「押す直前の観測」。
  const observed = {
    action: "apply",
    asp: "afb",
    siteId: String(asp.sites?.[root.targetSiteName] ?? siteM[1]),
    programId: String(id),
    programName: title,
    formTargetCount: 1,
    applyLabel: "提携申請はこちら",
    confirmLabel: null,
    termsFingerprint: null,
    eligibilityFingerprint: eligibilityFingerprint(catalog, "afb", id),
  };

  if (!commit) {
    const created = planFromObservation(observed);
    return { id, title, action: "dry-run", reason: `確認ブロック到達 (site=${siteM[1]}) plan=${created.operationId}` };
  }

  if (!gateCommit(plan, observed)) {
    return { id, title, action: "abort", reason: "再照合不一致 (plan 失効)" };
  }

  journal(plan, "intent-recorded");
  page.once("dialog", (d) => d.accept().catch(() => {}));
  await finalBtns.first().click();
  journal(plan, "sent");
  await page.waitForTimeout(7000);

  // 実測検証: 再検索して行の申請ボタンが消えたこと (= 申請済み状態) を確認する。
  // 検索結果は badge を出さないため、申請中/提携中の別は週次の affiliate-status --write が確定する。
  const after = await searchPid();
  if (after.found && after.applyHrefs.length === 0) {
    journal(plan, "confirmed");
    return { id, title, action: "applied", reason: "" };
  }
  journal(plan, "unknown", after.found ? "申請後も申請ボタンが残っている" : "申請後の再検索で行が見つからない");
  await dumpFailure(page, { browser: asp.browser }, `apply-afb-${id}`).catch(() => {});
  return {
    id,
    title,
    action: "unverified",
    reason: after.found ? "申請後も申請ボタンが残っている" : "申請後の再検索で行が見つからない",
  };
}

/** catalog の案件を pure core で評価する。未登録も未承認として止める。 */
export function evaluateCatalogApplyEligibility(catalog, aspName, id) {
  const hit = findInCatalog(catalog, aspName, id);
  if (!hit) {
    return { eligible: false, reasons: ["catalog-program-not-found"] };
  }
  return evaluateAffiliateEligibility(hit.program?.eligibility);
}

/** 掲載条件を plan に焼き、条件変更時は古い plan を再照合で失効させる。 */
export function eligibilityFingerprint(catalog, aspName, id) {
  const hit = findInCatalog(catalog, aspName, id);
  const material = {
    asp: aspName,
    programId: String(id),
    redLine: hit?.program?.redLine === true,
    vertical: hit?.program?.vertical ?? null,
    eligibility: buildEligibilityFingerprintMaterial(hit?.program?.eligibility),
  };
  return createHash("sha256").update(JSON.stringify(material)).digest("hex").slice(0, 32);
}

/** ASP profile の排他 lock。protocol の実装は affiliate-ops.mjs に一本化してある。 */
function opsLock(action, aspName, operationId) {
  const r = spawnSync(
    process.execPath,
    [join(repoRoot(), ".claude/scripts/ads/affiliate-ops.mjs"), "lock", action, "--asp", aspName, "--operation-id", operationId],
    { encoding: "utf-8" },
  );
  if (r.stdout?.trim()) console.log(`  ${r.stdout.trim()}`);
  if (r.status !== 0 && r.stderr?.trim()) console.error(`  ${r.stderr.trim()}`);
  return r.status === 0;
}

/** journal へ 1 event。押す前後の記録が落ちると二重申請の検知ができないので握り潰さない。 */
function journal(plan, event, reason = null) {
  appendJournal(
    buildJournalEvent({
      operationId: plan.operationId,
      at: new Date().toISOString(),
      asp: plan.asp,
      siteId: plan.siteId,
      programId: plan.programId,
      event,
      planSha256: plan.payloadSha256,
      reason,
    }),
  );
}

/**
 * dry-run が観測した申請対象から plan を作って保存する。
 * @returns {object} 保存した plan
 */
function planFromObservation(observed) {
  const plan = buildPlan({ ...observed, createdAt: new Date().toISOString() });
  writePlan(plan);
  journal(plan, "planned");
  console.log(`  plan: ${plan.operationId} (sha=${plan.payloadSha256.slice(0, 12)}… 期限 ${plan.expiresAt})`);
  return plan;
}

/**
 * commit 直前の再照合 (§6.3)。不一致なら plan を失効させ、押さない。
 * @returns {boolean} 押してよいか
 */
function gateCommit(plan, observed) {
  const v = validatePlanForCommit({ plan, nowIso: new Date().toISOString(), observed });
  if (!v.ok) {
    expirePlan(plan.operationId);
    journal(plan, "aborted", v.reason);
    console.error(`  ✗ ${v.reason}`);
    return false;
  }
  console.log(`  ${v.reason}`);
  return true;
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

  // ★commit は plan 経由でしか走らない (§6.3)。plan が決めた 1 件だけを対象にする。
  let plan = null;
  if (opts.commit) {
    plan = readPlan(opts.plan);
    if (!plan) {
      console.error(`✗ plan が見つからない: ${opts.plan} (dry-run で作り直す)`);
      process.exit(1);
    }
    if (plan.asp !== opts.asp) {
      console.error(`✗ plan の ASP は ${plan.asp} で --asp ${opts.asp} と違う`);
      process.exit(1);
    }
    const outcome = deriveOperationOutcome(readJournal(plan.operationId));
    if (!outcome.canAutoResend) {
      // sent / unknown がある = 押した記録がある。未申請と誤認して再送しない (§6.4)
      console.error(`✗ この plan は既に実行済み (state=${outcome.state})。再送しない — live reconciliation で確認する`);
      process.exit(1);
    }
    opts.ids = [plan.programId];
  }

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

  // Red Line と掲載適格性は dry-run の plan 作成前に落とす。
  const blocked = [];
  for (const id of opts.ids) {
    const hit = findInCatalog(catalog, opts.asp, id);
    if (hit?.program?.redLine) {
      blocked.push({ id, key: hit.key, reasons: ["red-line"] });
      continue;
    }
    const eligibility = evaluateCatalogApplyEligibility(catalog, opts.asp, id);
    if (!eligibility.eligible) {
      blocked.push({ id, key: hit?.key ?? "未登録", reasons: eligibility.reasons });
    }
  }
  if (blocked.length) {
    for (const b of blocked) {
      console.error(`  ✗ ${b.id} (${b.key}) は掲載適格性を満たさない: ${b.reasons.join(", ")}`);
    }
    process.exit(1);
  }

  const isReady = asp.readyMarker
    ? async (page) =>
        !new RegExp(asp.reAuthPattern, "i").test(page.url()) &&
        (await page.locator(asp.readyMarker).count().catch(() => 0)) > 0
    : undefined;
  // ★ASP profile は 1 プロセスしか触らない (§6.5)。同じ profile を並行で開くと Chrome が
  //   セッションを壊し、途中まで進んだ申請の状態が追えなくなる。
  const lockId = plan?.operationId ?? `dryrun-${opts.asp}-${Date.now()}`;
  if (!opsLock("acquire", opts.asp, lockId)) {
    console.error(`✗ ${opts.asp} の profile lock を取得できない (別の run が使用中)`);
    process.exit(2);
  }

  const { ctx, page } = await openAsp(asp, { isReady, label: opts.asp });

  const results = [];
  try {
    for (const id of opts.ids) {
      // afb は URL 構造が違うため専用フロー (検索 → 行ボタン → 確認ブロック → badge 実測)
      if (opts.asp === "afb") {
        const r = await applyAfbOne(page, asp, root, siteLabel, id, opts.commit, { catalog, plan });
        const mark = r.action === "applied" ? "✓ 申請を確認" : r.action === "approved" ? "✓ 申請を確認 (即時承認→提携中)" : `△ ${r.action}`;
        console.log(`\n[${id}] ${r.title}\n  ${mark}${r.reason ? ` — ${r.reason}` : ""}`);
        results.push(r);
        if ((r.action === "applied" || r.action === "approved") && opts.commit) {
          recordApplied(catalog, "afb", id, r.title, new Date().toISOString(), r.action === "approved" ? "approved" : "applying");
          catalog.updatedAt = new Date().toISOString();
          writeFileSync(CATALOG, JSON.stringify(catalog, null, 2) + "\n", "utf-8");
        }
        continue;
      }

      const path = detailUrl(opts.asp, id, asp);
      // サイト帰属の確定 (不一致は例外で全体が止まる。握り潰さない)
      const site = await ensureTargetSite(page, asp, root, { navigateTo: path });
      console.log(`\n[${id}] ${site.reason}`);

      const text = await visibleText(page, 4000);
      // 案件名は「基本情報」直後の行から取る。先頭行はサイト共通の見出し (「もしもキャッシュバック」)
      // で全案件同じになり、どれを申請したのか報告から判別できなかった。
      const promoName = await readPromotionName(page);
      const title = (promoName || text.split("\n").find((l) => l.trim().length > 4) || "").trim().slice(0, 60);

      // moshimo 以外は対象数を数える手段が無いので plan の既定 1 を使う
      let singleTargetCount = 1;
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
        singleTargetCount = single.formTargetCount;
      }

      const siteSel = await selectSiteInForm(page, asp, siteLabel, siteId);
      if (!siteSel.ok) {
        console.log(`  ✗ ${siteSel.reason}`);
        results.push({ id, title, action: "abort", reason: siteSel.reason });
        continue;
      }
      console.log(`  ${siteSel.reason}`);

      // 押す直前に観測した「意味上の申請対象」。dry-run はこれを plan に焼き、
      // commit はこれと plan を突き合わせる (§6.3)。
      const observed = {
        action: "apply",
        asp: opts.asp,
        siteId: String(siteId),
        programId: String(id),
        programName: promoName ?? title,
        formTargetCount: singleTargetCount,
        applyLabel: asp.applyButtonLabel,
        confirmLabel: asp.confirmButtonLabel ?? null,
        termsFingerprint: null,
        eligibilityFingerprint: eligibilityFingerprint(catalog, opts.asp, id),
      };

      if (!opts.commit) {
        console.log(`  dry-run: 「${asp.applyButtonLabel}」を押せる状態 (押していない)`);
        const created = planFromObservation(observed);
        results.push({ id, title, action: "dry-run", reason: `plan=${created.operationId}` });
        continue;
      }

      if (!gateCommit(plan, observed)) {
        results.push({ id, title, action: "abort", reason: "再照合不一致 (plan 失効)" });
        continue;
      }

      // ★押す前に intent、押した直後に sent。この 2 行が journal に無いと、途中で落ちたときに
      //   「押したか」が永久に分からなくなる (§6.4)。
      journal(plan, "intent-recorded");
      await btn.el.click();
      journal(plan, "sent");
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

      // ★ 完了判定は文言ではなく実測。申請中 or 提携中 (即時承認) の一覧に出て初めて「申請した」と言う。
      const verified = await verifyApplied(page, asp, siteId, promoName, id);
      journal(plan, verified.ok ? "confirmed" : "unknown", verified.ok ? null : verified.reason);
      console.log(`  ${verified.ok ? (verified.state === "approved" ? "✓ 申請を確認 (即時承認→提携中)" : "✓ 申請を確認") : `△ ${verified.reason}`}`);
      if (!verified.ok) await dumpFailure(page, { browser: asp.browser }, `apply-${opts.asp}-${id}`).catch(() => {});
      const ok = verified.ok;
      results.push({ id, title, action: ok ? (verified.state === "approved" ? "approved" : "applied") : "unverified", reason: ok ? "" : verified.reason });

      // 台帳へ記録し **1 件ごとに即保存**する。バッチ末尾のみの保存だと途中 kill で実申請済み分が
      // 全て未記録になり週上限カウントも狂う (2026-07-28 に 25 件分が実際にロスト)。また旧条件
      // `results.some(action==="applied")` は全件即時承認 (approved のみ) だと保存されなかった。
      if (ok && opts.commit) {
        recordApplied(catalog, opts.asp, id, promoName ?? title, new Date().toISOString(), verified.state === "approved" ? "approved" : "applying");
        catalog.updatedAt = new Date().toISOString();
        writeFileSync(CATALOG, JSON.stringify(catalog, null, 2) + "\n", "utf-8");
      }
    }
  } finally {
    await ctx.close().catch(() => {});
    opsLock("release", opts.asp, lockId);
  }

  console.log(`\n=== まとめ ===`);
  for (const r of results) console.log(`  ${r.action.padEnd(10)} ${r.id} ${r.title}${r.reason ? ` — ${r.reason}` : ""}`);
  if (!opts.commit) console.log(`\n→ 実申請するには --commit を付ける (規約同意を伴うのでユーザーの明示許可が要る)`);
}

// ★import.meta.url と argv[1] を文字列連結で比べない (Windows で必ず不一致になる)。
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error("Fatal:", e?.message || e);
    process.exit(1);
  });
}
