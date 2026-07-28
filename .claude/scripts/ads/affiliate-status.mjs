#!/usr/bin/env node
/**
 * affiliate-status.mjs — 3 ASP の提携状態を実機と突合する (read-only)
 * ---------------------------------------------------------------------------
 * `.claude/state/ads/affiliate-catalog.json` (自社がどの案件をどの ASP で運用するか) を
 * 実機の提携中/申請中一覧と突合し、**ドリフト**を報告する。
 *
 * 安全弁:
 *   - **サイト帰属を確定できなければ例外で停止** (asp-site-guard)。3 ASP とも doboku-note と同居。
 *   - read-only。申請も設定変更もしない (申請は affiliate-apply.mjs)。
 *   - ログインは人間。afb はセッションを持ち越せないため毎回ログインが要る。
 *   - **取得できなかった ASP を「提携なし」と混同しない** (判定不能として区別する)。
 *
 * 由来: doboku-note `scripts/affiliate-status.mjs`
 *
 * usage:
 *   node .claude/scripts/ads/affiliate-status.mjs                 # 全 ASP
 *   node .claude/scripts/ads/affiliate-status.mjs --asp moshimo   # 1 ASP だけ
 *   node .claude/scripts/ads/affiliate-status.mjs --write         # 実機の値でカタログを更新
 */
import { readFileSync, writeFileSync, mkdirSync, appendFileSync, existsSync } from "node:fs";
import { join } from "node:path";

import {
  loadAspConfig,
  getAsp,
  openAsp,
  ensureTargetSite,
  visibleText,
  repoRoot,
  SiteAttributionError,
} from "./lib/asp-browser.mjs";

const CATALOG = join(repoRoot(), ".claude/state/ads/affiliate-catalog.json");

function parseArgs() {
  const a = process.argv.slice(2);
  const o = { asps: null, write: false };
  for (let i = 0; i < a.length; i++) {
    if (a[i] === "--asp") o.asps = a[++i].split(",").map((s) => s.trim());
    else if (a[i] === "--write") o.write = true;
  }
  return o;
}

/** 実機の一覧テキストから「この ASP で提携済み/申請中の識別子」を集める。 */
function collectIds(text, asp) {
  const ids = new Set();
  // afb: 【PID:N】
  if (asp.listItemPattern) {
    for (const m of text.matchAll(new RegExp(asp.listItemPattern.replace(/^\^|\$$/g, ""), "gm"))) {
      if (m[1]) ids.add(m[1]);
    }
  }
  // もしも: promotion_id はテキストに出ないので、呼び出し側が本文への包含で照合する
  return ids;
}

/** カタログの ASP エントリの識別子 (ASP ごとにキー名が違う)。 */
const idOf = (entry) => entry?.programId ?? entry?.promotionId ?? entry?.pid ?? null;

async function checkAsp(name, root, log) {
  const asp = getAsp(root, name);
  const isReady = asp.readyMarker
    ? async (page) =>
        !new RegExp(asp.reAuthPattern, "i").test(page.url()) &&
        (await page.locator(asp.readyMarker).count().catch(() => 0)) > 0
    : undefined;

  const { ctx, page } = await openAsp(asp, { isReady, label: name });
  try {
    const out = {
      asp: name,
      siteId: null,
      partnered: { ids: new Set(), text: "" },
      applying: { ids: new Set(), text: "" },
    };
    for (const [key, path] of [
      ["partnered", asp.partneredPath],
      ["applying", asp.applyingPath],
    ]) {
      if (!path) continue;
      const site = await ensureTargetSite(page, asp, root, { navigateTo: path });
      out.siteId = site.actualSiteId;
      // 一覧が描画されるまで待つ (固定 sleep だと遅い回線で空を読む)
      await page
        .waitForFunction(() => document.body && document.body.innerText.length > 500, null, {
          timeout: asp.browser.timeoutMs ?? 30000,
          polling: 1000,
        })
        .catch(() => {});
      const t = await visibleText(page, 200000);
      const ids = collectIds(t, asp);
      // ★もしも: promotion_id は画面テキストに出ず a[href] にのみ現れる (2026-07-28 実測 —
      //   text.includes 照合が常に "none" になり、applying 4 件を誤ドリフト報告した)。
      //   config の hrefIdPattern がある ASP は href からも ID を収集する。
      if (asp.hrefIdPattern) {
        // 一覧行スコープを優先する (ページ全体だと推薦リンク等の ID が混ざり超集合になり、
        // 「却下済みなのに ID が残って drift を見逃す」余地が生まれる)。行スコープで 1 件も
        // 取れないときだけページ全体へ fallback し、その旨をログへ出す。
        const scopes = asp.rowSelector ? [`tr:has(${asp.rowSelector}) a[href]`, "a[href]"] : ["a[href]"];
        const re = new RegExp(asp.hrefIdPattern, "g");
        for (const scope of scopes) {
          const hrefs = await page
            .$$eval(scope, (as) => as.map((a) => a.getAttribute("href") ?? ""))
            .catch(() => []);
          const before = ids.size;
          for (const h of hrefs) {
            for (const m of h.matchAll(re)) if (m[1]) ids.add(m[1]);
          }
          if (ids.size > before) {
            if (scope === "a[href]" && scopes.length > 1) log(`  (${name}/${key}: 行スコープで ID 0 件 → ページ全体から抽出 = 超集合の可能性)`);
            break;
          }
        }
      }
      out[key] = { ids, text: t };
      // ★ 一覧の実件数も出す。ID を出さない ASP では ids.size が常に 0 になり、
      //   「0 件の ID を検出」だけだと**提携が 0 件だと誤読される** (2026-07-28 に実際に誤読した)。
      //   selector は ASP ごとに違う (旧実装はもしも用 td.promotion-name を全 ASP に流用し
      //   afb で「一覧 0 件」を誤表示した) — config の rowSelector を使い、無ければ数えない。
      // `$$eval` は Playwright の DOM 取得 API であって JavaScript の `eval()` ではない。
      const rowCount = asp.rowSelector
        ? await page.$$eval(asp.rowSelector, (tds) => tds.length).catch(() => null)
        : null;
      const rows = rowCount === null ? "一覧の件数を取得できず" : `一覧 ${rowCount} 件`;
      log(`  ${name}/${key}: ${rows} / ID 抽出 ${out[key].ids.size} 件 (SID ${site.actualSiteId ?? "-"})`);
    }
    return out;
  } finally {
    await ctx.close().catch(() => {});
  }
}

async function main() {
  const opts = parseArgs();
  const root = loadAspConfig();
  if (!existsSync(CATALOG)) {
    console.error(`カタログがありません: ${CATALOG}`);
    process.exit(2);
  }
  const catalog = JSON.parse(readFileSync(CATALOG, "utf-8"));
  const targets = opts.asps ?? Object.keys(root.asps);

  const logDir = join(repoRoot(), ".local/affiliate-status");
  mkdirSync(logDir, { recursive: true });
  const logPath = join(logDir, "status.log");
  writeFileSync(logPath, "", "utf-8");
  const log = (m) => {
    console.log(m);
    try {
      appendFileSync(logPath, `${new Date().toISOString()} ${m}\n`, "utf-8");
    } catch {}
  };

  log(`アフィリ状態照合 [${targets.join(", ")}]  対象サイト=${root.targetSiteName}`);

  const live = {};
  const failed = {};
  for (const name of targets) {
    try {
      live[name] = await checkAsp(name, root, log);
    } catch (e) {
      // 取得できなかった ASP を「提携なし」と混同しないため、失敗として記録する
      failed[name] =
        e instanceof SiteAttributionError ? `サイト帰属 NG: ${e.message}` : String(e.message).slice(0, 150);
      log(`  ⚠️ ${name}: 取得できず (${failed[name]}) → この ASP は判定不能として扱う`);
    }
  }

  // ── カタログと突合
  const drift = [];
  for (const [key, p] of Object.entries(catalog.programs ?? {})) {
    for (const [aspName, entry] of Object.entries(p.asps ?? {})) {
      if (!live[aspName]) continue; // 取得できなかった ASP は判定しない
      const id = idOf(entry);
      if (!id) continue;
      const inPartnered = live[aspName].partnered.ids.has(id) || live[aspName].partnered.text.includes(id);
      const inApplying = live[aspName].applying.ids.has(id) || live[aspName].applying.text.includes(id);
      const actual = inPartnered ? "approved" : inApplying ? "applying" : "none";
      if (actual !== entry.status) {
        drift.push({ program: key, asp: aspName, catalog: entry.status, actual, id });
      }
    }
  }

  console.log(`\n=== 突合結果 ===`);
  if (Object.keys(failed).length) {
    console.log("取得できなかった ASP (判定不能・「提携なし」ではない):");
    for (const [k, v] of Object.entries(failed)) console.log(`  - ${k}: ${v}`);
  }
  if (drift.length === 0) {
    console.log(`ドリフトなし (照合できた ASP: ${Object.keys(live).join(", ") || "なし"})`);
  } else {
    console.log(`ドリフト ${drift.length} 件:`);
    for (const d of drift) {
      console.log(`  - ${d.program} / ${d.asp}: カタログ "${d.catalog}" ↔ 実機 "${d.actual}" (id=${d.id})`);
    }
    if (opts.write) {
      for (const d of drift) catalog.programs[d.program].asps[d.asp].status = d.actual;
      catalog.updatedAt = new Date().toISOString();
      catalog.verifiedAt = new Date().toISOString().slice(0, 10);
      writeFileSync(CATALOG, JSON.stringify(catalog, null, 2) + "\n", "utf-8");
      console.log(`\n→ --write によりカタログを実機の値へ更新しました`);
    } else {
      console.log(`\n→ 反映するなら --write を付けて再実行 (既定は read-only)`);
    }
  }

  // ── 実機にあるが台帳に無い提携/申請を取り込む (--write 時のみ書く)
  // 2026-07-28 実測: afb 19 件・もしも 7 件が提携済みなのに台帳ゼロで「管理外の提携」になっていた。
  // 台帳キーは `${asp}-${id}`。名前は一覧テキストの ID 近傍から best-effort (取れなければ null →
  // 人/agent が register 時に補完する)。A8 は a8-catalog.json が正典なのでここでは取り込まない。
  const known = new Set();
  for (const p of Object.values(catalog.programs ?? {})) {
    for (const [aspName, entry] of Object.entries(p.asps ?? {})) {
      const id = idOf(entry);
      if (id) known.add(`${aspName}-${id}`);
    }
  }
  const missing = [];
  for (const [aspName, l] of Object.entries(live)) {
    if (aspName === "a8") continue; // A8 の状態機械は a8-catalog.json が正典
    for (const [key, status] of [["partnered", "approved"], ["applying", "applying"]]) {
      for (const id of l[key].ids) {
        const ck = `${aspName}-${id}`;
        if (known.has(ck)) continue;
        known.add(ck); // partnered と applying の両ページに出る ID を二重登録しない
        // 名前の best-effort: ID を**境界付き**で含む行のみ (単純 includes は "8445" が "44" を
        // 含む等で別行に誤マッチする — 2026-07-28 に doboku-note のサイトラベル行を誤取得した)
        const lines = l[key].text.split("\n").map((s) => s.trim()).filter(Boolean);
        const idRe = new RegExp(`(?<![0-9])${id}(?![0-9])`);
        const nameGuess = lines.find((ln) => idRe.test(ln) && ln.length > id.length + 4) ?? null;
        missing.push({ ck, asp: aspName, id, status, name: nameGuess });
      }
    }
  }
  if (missing.length > 0) {
    console.log(`\n台帳に無い実機の提携/申請 ${missing.length} 件:`);
    for (const m of missing) console.log(`  + ${m.ck} (${m.status}) ${m.name ?? "(名称は register 時に補完)"}`);
    if (opts.write) {
      const now = new Date().toISOString();
      for (const m of missing) {
        catalog.programs[m.ck] = {
          name: m.name,
          vertical: null,
          asps: {
            [m.asp]: {
              [m.asp === "moshimo" ? "promotionId" : "pid"]: m.id,
              status: m.status,
              history: [{ at: now, status: m.status, note: "affiliate-status --write が実機一覧から取り込み" }],
            },
          },
        };
      }
      catalog.updatedAt = now;
      catalog.verifiedAt = now.slice(0, 10);
      writeFileSync(CATALOG, JSON.stringify(catalog, null, 2) + "\n", "utf-8");
      console.log(`→ --write により ${missing.length} 件を台帳へ取り込みました (vertical/名称は register 時に確定)`);
    } else {
      console.log(`→ 取り込むなら --write を付けて再実行`);
    }
  }
  console.log(`ログ: ${logPath}`);
}

main().catch((e) => {
  console.error("Fatal:", e?.message || e);
  process.exit(1);
});
