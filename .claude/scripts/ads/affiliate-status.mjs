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
 *   node .claude/scripts/ads/affiliate-status.mjs --asp moshimo --verify-moshimo-details
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

import {
  buildIdScopes,
  checkIdRowParity,
  detectPhantomIds,
  isPlaceholderName,
  parseAfbBlocks,
  parseMoshimoDetailStatus,
  pickIds,
  shouldReviewAbsentStatus,
  zipNamesWithIds,
} from "./lib/affiliate-status-core.mjs";

const CATALOG = join(repoRoot(), ".claude/state/ads/affiliate-catalog.json");

/**
 * 指定 ASP について、台帳が既に持っている「ID → name」を返す。
 * zipNamesWithIds の index 対応が正しいかを検証する材料に使う。
 */
function knownNamesByAsp(aspName) {
  const cat = JSON.parse(readFileSync(CATALOG, "utf8"));
  const out = {};
  for (const p of Object.values(cat.programs ?? {})) {
    const e = p?.asps?.[aspName];
    const id = e?.programId ?? e?.promotionId ?? e?.pid ?? null;
    if (id && p?.name && !isPlaceholderName(p.name)) out[id] = p.name;
  }
  return out;
}

function parseArgs() {
  const a = process.argv.slice(2);
  const o = { asps: null, write: false, verifyMoshimoDetails: false };
  for (let i = 0; i < a.length; i++) {
    if (a[i] === "--asp") o.asps = a[++i].split(",").map((s) => s.trim());
    else if (a[i] === "--write") o.write = true;
    else if (a[i] === "--verify-moshimo-details") o.verifyMoshimoDetails = true;
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
      /** 実機一覧から取れた ID → プログラム名。--write で台帳の name 補完に使う。 */
      liveNames: {},
      /** 一覧行数と ID 数の乖離 (超集合の検知)。key ごとに記録する。 */
      parity: {},
    };
    const liveNames = out.liveNames;
    for (const [key, path] of [
      ["partnered", asp.partneredPath],
      ["applying", asp.applyingPath],
    ]) {
      if (!path) continue;
      const ids = new Set();
      let text = "";
      // ★ ページ送り (doc 42 §8.2/8.3)。afb は 1 ページ 50 件で applying 97 件が 2 ページに
      //   またがる — 1 ページだけ読むと「一覧に無い」誤判定の温床になる。config の
      //   `listPageParam` (afb: "p") があるときだけ、追加 ID が出なくなるまで辿る (cap 10)。
      const maxPages = asp.listPageParam ? (asp.maxListPages ?? 10) : 1;
      for (let pageNo = 1; pageNo <= maxPages; pageNo++) {
        const url = pageNo === 1 ? path : `${path}&${asp.listPageParam}=${pageNo}`;
        // サイト帰属はページごとに assert する (§3.2)
        const site = await ensureTargetSite(page, asp, root, { navigateTo: url });
        out.siteId = site.actualSiteId;
        // 一覧が描画されるまで待つ (固定 sleep だと遅い回線で空を読む)
        await page
          .waitForFunction(() => document.body && document.body.innerText.length > 500, null, {
            timeout: asp.browser.timeoutMs ?? 30000,
            polling: 1000,
          })
          .catch(() => {});
        const t = await visibleText(page, 200000);
        text += (text ? "\n" : "") + t;
        const before = ids.size;
        for (const id of collectIds(t, asp)) ids.add(id);
        // ★もしも: promotion_id は画面テキストに出ず a[href] にのみ現れる (2026-07-28 実測 —
        //   text.includes 照合が常に "none" になり、applying 4 件を誤ドリフト報告した)。
        //   config の hrefIdPattern がある ASP は href からも ID を収集する。
        if (asp.hrefIdPattern) {
          // 一覧行スコープを優先する (ページ全体だと推薦リンク等の ID が混ざり超集合になり、
          // 「却下済みなのに ID が残って drift を見逃す」余地が生まれる)。行スコープで 1 件も
          // 取れないときだけページ全体へ fallback し、その旨をログへ出す。
          // ★ `tr:has(<rowSelector>) a[href]` は ASP によっては 0 件になる (もしもの一覧は
          //   td.promotion-name と促進リンクが同一 tr に無く、2026-08-04 実測で常に 0 件 →
          //   ページ全体 fallback が働き、提携中 32 行に対し ID 35 件の超集合になっていた。
          //   余分な 3 件は提携中と申請中の**両方**に出るページ共通リンクで、うち 2 件が
          //   「台帳に無い実機の提携」として誤検出されていた)。config で一覧スコープを
          //   直接指定できるようにし、指定があればそれを最優先する。
          const scopes = buildIdScopes(asp);
          for (const scope of scopes) {
            const hrefs = await page
              .$$eval(scope, (as) => as.map((a) => a.getAttribute("href") ?? ""))
              .catch(() => []);
            const b = ids.size;
            for (const id of pickIds(hrefs, asp.hrefIdPattern)) ids.add(id);
            if (ids.size > b) {
              if (scope === "a[href]" && scopes.length > 1) log(`  (${name}/${key}: 行スコープで ID 0 件 → ページ全体から抽出 = 超集合の可能性)`);
              break;
            }
          }
        }
        // ★ afb: 一覧は 【PID:N】カテゴリ / 企業名 / プロモーション名 / 報酬 の 4 行ブロック。
        //   ID だけ拾うと **プロモーション名が落ちて** カタログの name が
        //   「【PID:14065】 専門転職（その他）」になる (vertical 判定不能の原因・2026-08-04)。
        //   ブロック解析して pid → プロモーション名 を集め、--write で name を補完する。
        if (asp.listItemPattern) {
          for (const blk of parseAfbBlocks(t, asp.listItemPattern)) {
            if (blk.pid && blk.name) liveNames[blk.pid] = blk.name;
          }
        }
        // ★ 一覧の実件数も出す。ID を出さない ASP では ids.size が常に 0 になり、
        //   「0 件の ID を検出」だけだと**提携が 0 件だと誤読される** (2026-07-28 に実際に誤読した)。
        // `$$eval` は Playwright の DOM 取得 API であって JavaScript の `eval()` ではない。
        const rowCount = asp.rowSelector
          ? await page.$$eval(asp.rowSelector, (tds) => tds.length).catch(() => null)
          : null;
        const rows = rowCount === null ? "一覧の件数を取得できず" : `一覧 ${rowCount} 件`;
        log(`  ${name}/${key} p${pageNo}: ${rows} / ID 累計 ${ids.size} 件 (SID ${site.actualSiteId ?? "-"})`);
        // ★ 行数と ID 数が食い違えばスコープが一覧行に限定できていない (超集合 or 取りこぼし)。
        //   1 ページ目だけ見る (2 ページ目以降は ids が累積するので比較できない)。
        if (pageNo === 1) {
          const parity = checkIdRowParity(rowCount, ids.size);
          if (parity) {
            out.parity[key] = parity;
            if (!parity.ok) {
              log(`  ⚠ ${name}/${key}: 一覧 ${parity.rowCount} 行 に対し ID ${parity.idCount} 件 (差 ${parity.diff})`);
              log(`     → listScopeSelector が一覧行に限定できていない可能性 (超集合)。config を確認`);
            }
          }
        }
        // ★ もしも: 名前セルと促進リンクが同じ <tr> に無いため行単位で組めない。
        //   DOM 出現順の index で対応付け、既知名で検証が通ったときだけ採る (捏造防止)。
        if (asp.rowSelector && asp.hrefIdPattern) {
          const names = await page
            .$$eval(asp.rowSelector, (els) => els.map((e) => (e.textContent ?? "").replace(/\s+/g, " ").trim()))
            .catch(() => []);
          const scoped = await page
            .$$eval(asp.listScopeSelector ?? "a[href]", (as) => as.map((a) => a.getAttribute("href") ?? ""))
            .catch(() => []);
          const pageIds = pickIds(scoped, asp.hrefIdPattern);
          const zipped = zipNamesWithIds(names, pageIds, knownNamesByAsp(name));
          if (zipped) Object.assign(liveNames, zipped);
          else if (names.length > 0) log(`  (${name}/${key}: 名前と ID の index 対応が検証できず名前補完をスキップ)`);
        }
        // 追加 ID が出なかった (= 最終ページ超過 or 同一内容) なら打ち切る
        if (pageNo > 1 && ids.size === before) break;
        if (rowCount !== null && rowCount === 0) break;
      }
      out[key] = { ids, text };
    }
    return out;
  } finally {
    await ctx.close().catch(() => {});
  }
}

/**
 * もしもの一覧不在案件を、各プロモーション詳細ページで確定する。
 * 全件の状態と stats47 SID を確定できるまで結果を返さず、途中失敗時は一切書かない。
 */
async function verifyMoshimoAbsentDetails(root, liveResult, candidates, log) {
  if (candidates.length === 0) return [];
  for (const key of ["partnered", "applying"]) {
    const parity = liveResult.parity[key];
    if (!parity?.ok) {
      throw new Error(`もしも/${key}: 一覧行数と ID 数の一致を確認できないため詳細照合を停止`);
    }
  }

  const asp = getAsp(root, "moshimo");
  if (!asp.detailPathPrefix) throw new Error("もしも detailPathPrefix が未設定");
  const isReady = asp.readyMarker
    ? async (page) =>
        !new RegExp(asp.reAuthPattern, "i").test(page.url()) &&
        (await page.locator(asp.readyMarker).count().catch(() => 0)) > 0
    : undefined;
  const { ctx, page } = await openAsp(asp, { isReady, label: "moshimo-detail" });
  try {
    const confirmed = [];
    for (const candidate of candidates) {
      const site = await ensureTargetSite(page, asp, root, {
        navigateTo: `${asp.detailPathPrefix}${encodeURIComponent(candidate.id)}`,
      });
      await page
        .waitForFunction(
          (anchor) =>
            (document.body?.innerText ?? "")
              .split("\n")
              .some((line) => line.trim() === anchor),
          asp.statusScopeAnchor,
          { timeout: asp.browser.timeoutMs ?? 30000, polling: 500 },
        )
        .catch(() => {});
      const parsed = parseMoshimoDetailStatus(
        await visibleText(page, 200000),
        asp.statusScopeAnchor,
      );
      if (!parsed.ok) {
        throw new Error(
          `もしも詳細 id=${candidate.id}: ${parsed.reason} (SID ${site.actualSiteId ?? "-"})`,
        );
      }
      if (["approved", "applying"].includes(parsed.status)) {
        throw new Error(
          `もしも詳細 id=${candidate.id} は「${parsed.rawStatus}」だが一覧に無い。pagination/selector drift を確認`,
        );
      }
      confirmed.push({
        ...candidate,
        actual: parsed.status,
        rawStatus: parsed.rawStatus,
        siteId: site.actualSiteId,
        source: "detail",
      });
      log(
        `  もしも/detail id=${candidate.id}: ${parsed.rawStatus} → ${parsed.status} (SID ${site.actualSiteId ?? "-"})`,
      );
    }
    return confirmed;
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

  // ── 幻ガード: 提携中と申請中の**両方**に出る ID を live 集合から除外する。
  //   1 案件が同時に「提携中」かつ「申請中」であることは論理的にありえないので、両方に
  //   出る ID は一覧項目ではなくページ共通リンク (バナー・おすすめ枠等)。
  //   2026-08-04 実測: もしもで promotion_id=7630 / 7556 / 170 の 3 件が該当し、
  //   うち 2 件を「台帳に無い実機の提携」として誤検出、1 件は過去の --write で
  //   実在しないエントリ (moshimo-170) として台帳へ混入していた。
  for (const [aspName, res] of Object.entries(live)) {
    const phantoms = detectPhantomIds([...res.partnered.ids], [...res.applying.ids]);
    if (phantoms.length === 0) continue;
    log(`  ⚠ ${aspName}: 提携中と申請中の両方に出る ID ${phantoms.length} 件を除外 (${phantoms.join(", ")})`);
    log(`     → 一覧行ではなくページ共通リンク。listScopeSelector を確認すること`);
    for (const id of phantoms) {
      res.partnered.ids.delete(id);
      res.applying.ids.delete(id);
    }
  }

  // ── カタログと突合 (一覧は positive-only、負状態は明示指定時に詳細ページで確定)
  // 「一覧に無い = none」は廃止した (2026-07-29)。一覧に無いのは走査未完了 / ページ漏れ /
  // selector drift / 提携終了 / 却下のいずれでもあり得るため、**正の一致だけ**を書き込み、
  // 不在は review-needed / suspension-proposed として報告に留める (自動降格しない)。
  const drift = []; // 書き込む確定遷移
  const review = []; // 報告のみ (書き込まない)
  for (const [key, p] of Object.entries(catalog.programs ?? {})) {
    for (const [aspName, entry] of Object.entries(p.asps ?? {})) {
      if (!live[aspName]) continue; // 取得できなかった ASP は判定しない
      const id = idOf(entry);
      if (!id) continue;
      const inPartnered = live[aspName].partnered.ids.has(id) || live[aspName].partnered.text.includes(id);
      const inApplying = live[aspName].applying.ids.has(id) || live[aspName].applying.text.includes(id);
      if (inPartnered) {
        // 正の一致: applying (等) → approved。既に approved 以降なら no-op (registered/published を巻き戻さない)
        if (!["approved", "registered", "published"].includes(entry.status)) {
          drift.push({ program: key, asp: aspName, catalog: entry.status, actual: "approved", id, source: "list" });
        }
      } else if (inApplying) {
        if (entry.status !== "applying" && !["registered", "published"].includes(entry.status)) {
          drift.push({ program: key, asp: aspName, catalog: entry.status, actual: "applying", id, source: "list" });
        }
      } else {
        // 不在 = 負の証拠としては扱わない。状態別に報告だけする。
        if (shouldReviewAbsentStatus(entry.status)) {
          const kind = ["approved", "registered", "published"].includes(entry.status)
            ? "suspension-proposed (提携終了の可能性 — 人が確認)"
            : "review-needed (却下 or 走査漏れ — 人が確認)";
          review.push({ program: key, asp: aspName, catalog: entry.status, id, kind });
        }
      }
    }
  }

  if (opts.verifyMoshimoDetails) {
    if (!live.moshimo) throw new Error("もしもの一覧を取得できていないため詳細照合を停止");
    const targets = review.filter((item) => item.asp === "moshimo");
    const confirmed = await verifyMoshimoAbsentDetails(root, live.moshimo, targets, log);
    drift.push(...confirmed);
    const confirmedIds = new Set(confirmed.map((item) => item.id));
    for (let i = review.length - 1; i >= 0; i--) {
      if (review[i].asp === "moshimo" && confirmedIds.has(review[i].id)) review.splice(i, 1);
    }
  }

  console.log(`\n=== 突合結果 ===`);
  if (Object.keys(failed).length) {
    console.log("取得できなかった ASP (判定不能・「提携なし」ではない):");
    for (const [k, v] of Object.entries(failed)) console.log(`  - ${k}: ${v}`);
  }
  if (drift.length === 0) {
    console.log(`確定遷移なし (照合できた ASP: ${Object.keys(live).join(", ") || "なし"})`);
  } else {
    console.log(`確定遷移 ${drift.length} 件:`);
    for (const d of drift) {
      console.log(`  - ${d.program} / ${d.asp}: "${d.catalog}" → "${d.actual}" (id=${d.id})`);
    }
    if (opts.write) {
      const at = new Date().toISOString();
      for (const d of drift) {
        const entry = catalog.programs[d.program].asps[d.asp];
        entry.status = d.actual;
        const note = d.source === "detail"
          ? `affiliate-status もしも詳細ページ「${d.rawStatus}」を確認 (SID ${d.siteId})`
          : "affiliate-status 実機一覧の正一致";
        (entry.history ??= []).push({ at, status: d.actual, note });
      }
      catalog.updatedAt = at;
      catalog.verifiedAt = at.slice(0, 10);
      writeFileSync(CATALOG, JSON.stringify(catalog, null, 2) + "\n", "utf-8");
      console.log(`\n→ --write により確定遷移をカタログへ反映しました`);
    } else {
      console.log(`\n→ 反映するなら --write を付けて再実行 (既定は read-only)`);
    }
  }
  // ── 名前の補完 (正遷移の有無と独立)
  //   afb は 4 行ブロックのプロモーション名、もしもは index 対応で検証済みの名前を使う。
  //   台帳の name が null / 「【PID:N】カテゴリ」形式のものだけ埋める (既存の名前は壊さない)。
  //   name が無いと vertical を判定できず、意図軸ハブに載せられない (2026-08-04 に 12 件滞留)。
  const named = [];
  for (const [key, p] of Object.entries(catalog.programs ?? {})) {
    if (!isPlaceholderName(p.name)) continue;
    for (const [aspName, entry] of Object.entries(p.asps ?? {})) {
      const id = idOf(entry);
      const got = id ? live[aspName]?.liveNames?.[id] : null;
      if (!got || isPlaceholderName(got)) continue;
      named.push({ program: key, from: p.name ?? null, to: got });
      if (opts.write) p.name = got;
      break;
    }
  }
  if (named.length > 0) {
    console.log(`\n名前を補完${opts.write ? "" : "できる"} ${named.length} 件:`);
    for (const n of named.slice(0, 20)) console.log(`  - ${n.program}: ${n.to}`);
    if (named.length > 20) console.log(`  … 他 ${named.length - 20} 件`);
    if (opts.write) {
      const at = new Date().toISOString();
      catalog.updatedAt = at;
      catalog.verifiedAt = at.slice(0, 10);
      writeFileSync(CATALOG, JSON.stringify(catalog, null, 2) + "\n", "utf-8");
      console.log(`→ --write により name を補完しました (vertical は名前を見て別途判定)`);
    } else {
      console.log(`→ 補完するなら --write を付けて再実行`);
    }
  }

  if (review.length > 0) {
    console.log(`\n報告のみ (書き込まない) ${review.length} 件:`);
    for (const r of review) console.log(`  - ${r.program} / ${r.asp} (${r.catalog}, id=${r.id}): ${r.kind}`);
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
