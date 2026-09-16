#!/usr/bin/env node
/**
 * note.com記事の商品カード (embedded-service="external-article" の figure で
 * data-src が https://stats47.jp/products/... を指すもの) が、実商品
 * (apps/web/src/features/products/storefront.generated.ts の STOREFRONT_PRODUCTS) の
 * title/description を表示しているかを検知する read-only 監査。
 *
 * 背景: applyNavigationFooter() が挿入する商品カードは、現状マガジンの name/description を
 * そのまま流用しており、実商品の title/description と一致しない (2026-09-16 時点で対象記事の
 * 相当数が不一致)。本スクリプトはこのドリフトの再発を検知することが目的で、商品カード自体の
 * 修正・本文更新は行わない (audit-only)。
 *
 * モード:
 *   既定 (引数なし) : ネットワークアクセスなし。全マガジンの productTarget slug が
 *                     STOREFRONT_PRODUCTS に実在するかだけを検証する (catalog内部の整合監査)。
 *   --live          : catalog上の「無料 (isPaid=false) かつ 所属マガジンに productTarget が
 *                     ある」公開記事について note 公開API (v3/notes) から実本文を取得し、
 *                     商品カードの title を期待値 (実商品 title) と突合する。
 *
 * Usage:
 *   node .claude/scripts/note/audit-note-product-cards.mjs
 *   node .claude/scripts/note/audit-note-product-cards.mjs --live
 *
 * exit 0 = 全PASS / 1 = 不一致あり / 2 = catalog・storefront 読み込み失敗 (入力エラー)
 */
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveProductCardText } from "./lib/navigation-footer.mjs";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(SCRIPT_DIR, "../../..");
const DUMP_CIRCULATION_TS = join(ROOT, ".claude/scripts/note/catalog/dump-circulation-json.ts");
const OUT_JSON = "/tmp/note-product-card-audit.json";
const UA = "stats47-note-product-card-audit/1.0";
const CONCURRENCY = 6;

const args = process.argv.slice(2);
const LIVE = args.includes("--live");

// ---------- catalog 読み込み ----------

/**
 * note catalog (articles + magazines) を JSON で取得する。
 * audit-note-circulation.mjs / note-magazine.mjs と同じ流儀: TS SSOT (magazines.ts /
 * catalog/data/stats47-note.ts 等) を正規表現で再解釈せず、既存の dump script を
 * tsx 経由で実行して JSON 化する (catalog/index.ts が全 vertical を束ねた結果を返す)。
 */
function loadCatalog() {
  const raw = execFileSync("npx", ["tsx", DUMP_CIRCULATION_TS], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  });
  return JSON.parse(raw);
}

// ---------- モード1: catalog整合性 (productTarget -> storefront、ネットワークなし) ----------

function auditCatalogIntegrity(magazines) {
  const results = [];
  for (const magazine of magazines) {
    if (!magazine.productTarget) continue;
    try {
      const resolved = resolveProductCardText(magazine.productTarget);
      results.push({
        magazineKey: magazine.key,
        productTarget: magazine.productTarget,
        ok: true,
        detail: `${magazine.productTarget} -> "${resolved.title}"`,
      });
    } catch (error) {
      results.push({
        magazineKey: magazine.key,
        productTarget: magazine.productTarget,
        ok: false,
        detail: error.message,
      });
    }
  }
  return results;
}

// ---------- モード2: --live 本文実測 ----------

function noteKeyFromUrl(noteUrl) {
  return (String(noteUrl || "").match(/\/n\/(n[0-9a-f]+)(?:$|[/?#])/i) || [])[1] || null;
}

/** escapeHtml() (navigation-footer.mjs) の逆変換。エンコード順 (& → " → < → >) の逆順で戻す。 */
function unescapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&gt;", ">")
    .replaceAll("&lt;", "<")
    .replaceAll("&quot;", '"')
    .replaceAll("&amp;", "&");
}

async function mapConcurrent(values, concurrency, mapper) {
  const result = new Array(values.length);
  let next = 0;
  async function worker() {
    while (next < values.length) {
      const index = next++;
      result[index] = await mapper(values[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, values.length) }, worker));
  return result;
}

async function fetchWithRetry(url, attempts = 4) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { "user-agent": UA },
        signal: AbortSignal.timeout(20_000),
      });
      if (response.ok) return response;
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    if (attempt < attempts) await new Promise((done) => setTimeout(done, attempt * 700));
  }
  throw lastError;
}

async function fetchNoteBody(noteKey) {
  const response = await fetchWithRetry(`https://note.com/api/v3/notes/${noteKey}?audit=${Date.now()}`);
  const json = await response.json();
  const body = json?.data?.body;
  if (typeof body !== "string") throw new Error("note API data.body が取得できません");
  return body;
}

/** 本文HTML中の embedded-service="external-article" な figure を全て抽出する
 * (属性の出現順序に依存しないよう、開始タグと内側を別々に見る)。 */
function extractExternalArticleFigures(body) {
  const figures = [];
  const figureRe = /<figure\b([^>]*)>([\s\S]*?)<\/figure>/g;
  let match;
  while ((match = figureRe.exec(body))) {
    const openTagAttrs = match[1];
    if (!/embedded-service="external-article"/.test(openTagAttrs)) continue;
    const dataSrc = (openTagAttrs.match(/data-src="([^"]*)"/) || [])[1] || null;
    figures.push({ dataSrc, inner: match[2] });
  }
  return figures;
}

/**
 * 指定 productTarget の商品カードを本文から探し、title/description を抜き出す。
 * buildNoteProductCardUrl (navigation-footer.mjs) は data-src を
 * `https://stats47.jp<productTarget>/from/note/<noteKey>` にするため前方一致で照合する
 * (本文には site カード・マガジンカードなど他の external-article figure も同居しうる)。
 */
function extractProductCardText(body, productTarget) {
  const prefix = `https://stats47.jp${productTarget}`;
  const figure = extractExternalArticleFigures(body).find((f) => f.dataSrc && f.dataSrc.startsWith(prefix));
  if (!figure) return { found: false, dataSrc: null, title: null, description: null };
  const title = (figure.inner.match(/<strong>([\s\S]*?)<\/strong>/) || [])[1] ?? null;
  const description = (figure.inner.match(/<em>([\s\S]*?)<\/em>/) || [])[1] ?? null;
  return { found: true, dataSrc: figure.dataSrc, title, description };
}

async function auditLive(catalog, magazinesByKey) {
  const targets = catalog.articles.filter((article) => {
    if (article.isPaid !== false) return false;
    const magazine = magazinesByKey.get(article.magazine);
    return Boolean(magazine?.productTarget);
  });

  console.log(`[note-product-card] 対象記事 (無料 かつ 所属マガジンにproductTarget): ${targets.length}件`);

  return mapConcurrent(targets, CONCURRENCY, async (article) => {
    const magazine = magazinesByKey.get(article.magazine);
    let expected;
    try {
      expected = resolveProductCardText(magazine.productTarget);
    } catch (error) {
      return { key: article.key, ok: false, detail: `期待値解決に失敗: ${error.message}` };
    }
    const noteKey = noteKeyFromUrl(article.noteUrl);
    if (!noteKey) {
      return { key: article.key, ok: false, detail: `noteUrlからkeyを抽出できません: ${article.noteUrl}` };
    }
    try {
      const body = await fetchNoteBody(noteKey);
      const actual = extractProductCardText(body, magazine.productTarget);
      if (!actual.found) {
        return {
          key: article.key,
          ok: false,
          detail: `商品カードが本文に見つからない (productTarget=${magazine.productTarget})`,
        };
      }
      const actualTitle = unescapeHtml(actual.title);
      const expectedTitle = expected.title;
      const ok = actualTitle === expectedTitle;
      return {
        key: article.key,
        ok,
        detail: ok ? `一致: "${expectedTitle}"` : `不一致: 期待="${expectedTitle}" 実際="${actualTitle}"`,
        expectedTitle,
        actualTitle,
      };
    } catch (error) {
      return { key: article.key, ok: false, detail: `note API取得失敗: ${error.message}` };
    }
  });
}

// ---------- main ----------

async function main() {
  let catalog;
  try {
    catalog = loadCatalog();
  } catch (error) {
    console.error(`[note-product-card] catalog読み込みに失敗: ${error.message}`);
    process.exit(2);
  }

  const magazinesByKey = new Map(catalog.magazines.map((m) => [m.key, m]));

  const integrityResults = auditCatalogIntegrity(catalog.magazines);
  console.log(`\n=== catalog整合性 (productTarget -> storefront、ネットワークなし) ===`);
  for (const r of integrityResults) {
    console.log(`${r.ok ? "PASS" : "FAIL"} ${r.magazineKey}: ${r.detail}`);
  }
  const integrityFailures = integrityResults.filter((r) => !r.ok);

  let liveResults = [];
  if (LIVE) {
    liveResults = await auditLive(catalog, magazinesByKey);
    console.log(`\n=== live 商品カード本文突合 ===`);
    for (const r of liveResults) {
      console.log(`${r.ok ? "PASS" : "FAIL"} ${r.key}: ${r.detail}`);
    }
  }
  const liveFailures = liveResults.filter((r) => !r.ok);

  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    mode: LIVE ? "live" : "catalog-only",
    summary: {
      magazinesWithProductTarget: integrityResults.length,
      integrityFailures: integrityFailures.length,
      liveChecked: liveResults.length,
      liveFailures: liveFailures.length,
    },
    integrity: integrityResults,
    live: liveResults,
  };
  writeFileSync(OUT_JSON, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`\n結果を書き出し: ${OUT_JSON}`);

  const hasFailure = integrityFailures.length > 0 || liveFailures.length > 0;
  process.exit(hasFailure ? 1 : 0);
}

main();
