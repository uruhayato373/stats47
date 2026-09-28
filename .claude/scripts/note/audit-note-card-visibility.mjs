#!/usr/bin/env node
/** Read-only audit of card figures in every catalogued, published stats47 note. */
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as cheerio from "cheerio";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const args = process.argv.slice(2);
const output = resolve(args.includes("--output") ? args[args.indexOf("--output") + 1] : "/tmp/note-card-visibility.json");
const previousPath = args.includes("--previous") ? resolve(args[args.indexOf("--previous") + 1]) : null;
let previous = null;
if (previousPath) {
  try { previous = JSON.parse(readFileSync(previousPath, "utf8")); } catch { /* first run */ }
}
const screenshotDir = args.includes("--screenshots") ? resolve(args[args.indexOf("--screenshots") + 1]) : null;
const browserVerify = args.includes("--browser-verify");
const maxScreenshots = Math.min(10, Math.max(0, Number(args.includes("--max-screenshots") ? args[args.indexOf("--max-screenshots") + 1] : 3)));
// npx は Windows で spawn できない (ENOENT) ため、node 直起動で tsx を読み込む (fetch-note-metrics.mjs と同じ形)
const catalog = JSON.parse(execFileSync(process.execPath, ["--import", "tsx", resolve(ROOT, ".claude/scripts/note/catalog/dump-circulation-json.ts")], { cwd: ROOT, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 }));
const slug = args.includes("--slug") ? args[args.indexOf("--slug") + 1] : null;
const retryUnknownPath = args.includes("--retry-unknown-from") ? resolve(args[args.indexOf("--retry-unknown-from") + 1]) : null;
const retryBaseline = retryUnknownPath ? JSON.parse(readFileSync(retryUnknownPath, "utf8")) : null;
if (retryBaseline && (retryBaseline.schemaVersion !== 1 || retryBaseline.account !== "stats47" || retryBaseline.summary?.checked !== catalog.articles.length)) throw new Error("全件監査レポートから再検証してください");
const unknownKeys = retryBaseline ? new Set(retryBaseline.articles
  .filter((row) => row.issues.some((issue) => issue.code === "browser_verify_failed" || issue.code === "card_empty_in_public_html"))
  .map((row) => row.key)) : null;
const articles = catalog.articles.filter((article) => article.noteUrl && /\/stats47\/n\/n[0-9a-f]+$/i.test(article.noteUrl) && (!slug || article.key === slug) && (!unknownKeys || unknownKeys.has(article.key)));
if (slug && articles.length !== 1) throw new Error(`catalogに対象記事がありません: ${slug}`);

async function fetchText(url) {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(url, { headers: { "user-agent": "stats47-note-card-visibility/1.0" }, signal: AbortSignal.timeout(20_000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.text();
    } catch (error) {
      lastError = error;
      if (attempt < 3) await new Promise((done) => setTimeout(done, attempt * 800));
    }
  }
  throw lastError;
}

function cards(html) {
  const $ = cheerio.load(html);
  return $("figure[embedded-service]").toArray().map((element) => ({
    service: $(element).attr("embedded-service") || "",
    url: $(element).attr("data-src") || "",
    key: $(element).attr("embedded-content-key") || "",
    title: $(element).text().trim().slice(0, 120),
    hasImage: $(element).find("img").length > 0,
    hasIframe: $(element).find("iframe").length > 0,
  }));
}

async function inspect(article) {
  const noteKey = article.noteUrl.match(/\/n\/(n[0-9a-f]+)$/i)[1];
  try {
    const [apiText, pageHtml] = await Promise.all([
      fetchText(`https://note.com/api/v3/notes/${noteKey}`),
      fetchText(article.noteUrl),
    ]);
    const live = JSON.parse(apiText).data;
    if (live?.user?.urlname !== "stats47" || live?.status !== "published") throw new Error("account/status mismatch");
    const stored = cards(live.body || "");
    const rendered = cards(pageHtml);
    const renderedByKey = new Map(rendered.map((card) => [card.key, card]));
    const issues = stored.flatMap((card) => {
      const actual = renderedByKey.get(card.key);
      if (!actual) return [{ code: "card_missing_from_public_html", url: card.url, service: card.service, key: card.key }];
      if (!actual.title && !actual.hasImage && !actual.hasIframe) {
        return [{ code: "card_empty_in_public_html", url: card.url, service: card.service, key: card.key }];
      }
      return [];
    });
    const $body = cheerio.load(live.body || "");
    for (const element of $body("figure[embedded-service]").toArray()) {
      const previous = $body(element).prev();
      if (previous.is("p") && !previous.text().trim() && previous.find("br").length === 1) {
        issues.push({ code: "card_extra_blank_paragraph", url: $body(element).attr("data-src"), key: $body(element).attr("embedded-content-key") });
      }
    }
    const nextHeading = $body("h2,h3").toArray().find((element) => $body(element).text().trim() === "次に読む");
    if (nextHeading && $body(nextHeading).nextAll("figure[embedded-service]").length === 0) {
      issues.push({ code: "navigation_footer_has_no_cards" });
    }
    return { key: article.key, noteUrl: article.noteUrl, storedCards: stored.length, renderedCards: rendered.length, issues };
  } catch (error) {
    return { key: article.key, noteUrl: article.noteUrl, storedCards: null, renderedCards: null, issues: [{ code: "fetch_failed", detail: String(error.message || error) }] };
  }
}

let results = new Array(articles.length);
let next = 0;
await Promise.all(Array.from({ length: 6 }, async () => {
  while (next < articles.length) {
    const index = next++;
    results[index] = await inspect(articles[index]);
  }
}));

if (browserVerify) {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  try {
    const candidates = results.filter((row) => row.issues.some((issue) => issue.code === "card_empty_in_public_html"));
    let candidateIndex = 0;
    let completedCandidates = 0;
    await Promise.all(Array.from({ length: 3 }, async () => {
      while (candidateIndex < candidates.length) {
        const row = candidates[candidateIndex++];
        const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
        try {
          await page.goto(row.noteUrl, { waitUntil: "domcontentloaded", timeout: 30_000 });
          for (const issue of row.issues.filter((item) => item.code === "card_empty_in_public_html")) {
            let rendered = null;
            for (let attempt = 0; attempt < 2 && !rendered; attempt++) {
              if (attempt) await page.reload({ waitUntil: "domcontentloaded", timeout: 30_000 });
              try {
                await page.waitForSelector(`figure[embedded-content-key="${issue.key}"]`, { state: "attached", timeout: 3_000 });
                await page.evaluate((key) => document.querySelector(`figure[embedded-content-key="${key}"]`)?.scrollIntoView({ block: "center" }), issue.key);
                await page.waitForTimeout(400);
                rendered = await page.evaluate((key) => {
                  const element = document.querySelector(`figure[embedded-content-key="${key}"]`);
                  return element && {
                    content: Boolean(element.querySelector("iframe[src],img[src]") || element.textContent?.trim()),
                    height: element.getBoundingClientRect().height,
                  };
                }, issue.key);
              } catch { /* transient DOM replacement; retry once with a fresh page */ }
            }
            if (!rendered) throw new Error(`カード要素が描画中に消失: ${issue.key}`);
            issue.code = rendered.content && rendered.height > 0 ? "card_rendered_in_browser" : "card_blank_in_browser";
          }
          row.issues = row.issues.filter((issue) => issue.code !== "card_rendered_in_browser");
        } catch (error) {
          row.issues.push({ code: "browser_verify_failed", detail: String(error.message || error) });
        } finally {
          await page.close();
          completedCandidates++;
          if (completedCandidates % 25 === 0) console.error(`[note-card-audit] browser verified ${completedCandidates}/${candidates.length} articles`);
        }
      }
    }));
  } finally {
    await browser.close();
  }
}

if (retryBaseline) {
  const refreshed = new Map(results.map((row) => [row.key, row]));
  results = retryBaseline.articles.map((row) => refreshed.get(row.key) || row);
}

if (screenshotDir) {
  const candidates = results.filter((row) => row.issues.some((issue) => issue.code === "card_blank_in_browser" || issue.code === "card_missing_from_public_html")).slice(0, maxScreenshots);
  if (candidates.length) {
    mkdirSync(screenshotDir, { recursive: true });
    try {
      const { chromium } = await import("playwright");
      const browser = await chromium.launch({ headless: true, channel: "chrome" });
      try {
        for (const row of candidates) {
          const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
          try {
            await page.goto(row.noteUrl, { waitUntil: "domcontentloaded", timeout: 30_000 });
            await page.locator("figure[embedded-service]").last().scrollIntoViewIfNeeded({ timeout: 10_000 });
            const path = resolve(screenshotDir, `${row.key}.png`);
            await page.screenshot({ path, fullPage: false });
            row.screenshot = path;
          } catch (error) {
            row.screenshotError = String(error.message || error);
          } finally {
            await page.close();
          }
        }
      } finally {
        await browser.close();
      }
    } catch (error) {
      for (const row of candidates.filter((row) => !row.screenshot)) row.screenshotError = String(error.message || error);
    }
  }
}

const summary = {
  catalogArticles: catalog.articles.length,
  checked: results.length,
  fetchFailed: results.filter((row) => row.issues.some((issue) => issue.code === "fetch_failed")).length,
  browserVerifyFailedArticles: results.filter((row) => row.issues.some((issue) => issue.code === "browser_verify_failed")).length,
  affectedArticles: results.filter((row) => row.issues.some((issue) => issue.code !== "fetch_failed")).length,
  emptyCards: results.flatMap((row) => row.issues).filter((issue) => issue.code === "card_blank_in_browser" || (!browserVerify && issue.code === "card_empty_in_public_html")).length,
  unknownCards: browserVerify ? results.flatMap((row) => row.issues).filter((issue) => issue.code === "card_empty_in_public_html").length : 0,
  missingCards: results.flatMap((row) => row.issues).filter((issue) => issue.code === "card_missing_from_public_html").length,
  footerWithoutCards: results.flatMap((row) => row.issues).filter((issue) => issue.code === "navigation_footer_has_no_cards").length,
  spacingIssues: results.flatMap((row) => row.issues).filter((issue) => issue.code === "card_extra_blank_paragraph").length,
};
if (previous?.articles) {
  const signatures = (rows) => new Set(rows.flatMap((row) => row.issues
    .filter((issue) => issue.code !== "fetch_failed")
    .map((issue) => `${row.key}|${issue.code}|${issue.url || ""}`)));
  const before = signatures(previous.articles);
  const now = signatures(results);
  summary.newIssues = [...now].filter((signature) => !before.has(signature)).length;
  summary.continuedIssues = [...now].filter((signature) => before.has(signature)).length;
  summary.resolvedIssues = summary.fetchFailed || summary.browserVerifyFailedArticles ? null : [...before].filter((signature) => !now.has(signature)).length;
}
const report = { schemaVersion: 1, generatedAt: new Date().toISOString(), account: "stats47", summary, articles: results };
mkdirSync(dirname(output), { recursive: true });
writeFileSync(`${output}.tmp`, `${JSON.stringify(report, null, 2)}\n`);
renameSync(`${output}.tmp`, output);
console.log(JSON.stringify({ summary, output }));
if (summary.fetchFailed || summary.browserVerifyFailedArticles || summary.affectedArticles) process.exitCode = 1;
