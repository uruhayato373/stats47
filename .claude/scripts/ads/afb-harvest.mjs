#!/usr/bin/env node
/**
 * afb-harvest.mjs — 承認済み afb プロモーションの広告原稿を取得する。
 *
 * - 対象 PID は --id で明示する（全件無差別取得をしない）。
 * - stats47 の SID を実 UI で read-back してから原稿ページへ進む。
 * - afb のクリック URL と 1x1 計測ピクセルを一組で保存する。
 * - 300x250 を優先し、無ければ text、次に他の canonical サイズを選ぶ。
 * - ASP 上の申請・設定変更、配信 SSOT への登録、公開は行わない。
 *
 * usage:
 *   node .claude/scripts/ads/afb-harvest.mjs --id 14567
 *   node .claude/scripts/ads/afb-harvest.mjs --id 14567,16683,15743
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, resolve } from "node:path";

import {
  aspBrowserCfg,
  dumpFailure,
  ensureTargetSite,
  getAsp,
  loadAspConfig,
  makeRunId,
  openAsp,
  repoRoot,
  SiteAttributionError,
  visibleText,
} from "./lib/asp-browser.mjs";
import { parseAfbCode } from "./lib/afb-code-core.mjs";

const CATALOG_PATH = join(repoRoot(), ".claude/state/ads/affiliate-catalog.json");
const OUTPUT_DIR = join(repoRoot(), ".local/affiliate-harvest/afb");
const CONTROL_SELECTOR = 'a,button,input[type="button"],input[type="submit"],input[type="image"],[role="button"],[onclick]';

export function parseArgs(argv = process.argv.slice(2)) {
  const out = { ids: [] };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--id") out.ids.push(...String(argv[++i] ?? "").split(","));
    else throw new Error(`未知の引数: ${argv[i]}`);
  }
  out.ids = [...new Set(out.ids.map((x) => x.trim()).filter(Boolean))];
  if (out.ids.length === 0) throw new Error("--id <PID[,PID]> は必須です");
  if (out.ids.some((x) => !/^\d+$/.test(x))) throw new Error("PID は数字だけを指定してください");
  if (out.ids.length > 12) throw new Error("1 run は最大 12 件です（無差別取得を防ぐ上限）");
  return out;
}

function loadTargets(ids) {
  if (!existsSync(CATALOG_PATH)) throw new Error(`カタログがありません: ${CATALOG_PATH}`);
  const catalog = JSON.parse(readFileSync(CATALOG_PATH, "utf8"));
  return ids.map((id) => {
    const key = `afb-${id}`;
    const program = catalog.programs?.[key];
    const entry = program?.asps?.afb;
    if (!program || !entry) throw new Error(`${key}: カタログにありません`);
    if (entry.status !== "approved") throw new Error(`${key}: approved ではありません (status=${entry.status})`);
    return { id, key, name: program.name, vertical: program.vertical ?? null };
  });
}

async function findMaterialControl(page, pid) {
  const marker = `【PID:${pid}】`;
  const controls = page.locator(CONTROL_SELECTOR);
  const candidates = await controls.evaluateAll((els, expected) => {
    const labelOf = (el) =>
      (el.textContent ||
        el.getAttribute("value") ||
        el.getAttribute("aria-label") ||
        el.getAttribute("alt") ||
        el.getAttribute("title") ||
        el.querySelector("img")?.getAttribute("alt") ||
        "")
        .replace(/\s+/g, " ")
        .trim();
    const out = [];
    els.forEach((el, index) => {
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0 || getComputedStyle(el).visibility === "hidden") return;
      const label = labelOf(el);
      if (!(label.includes("広告原稿一覧") || label.includes("プロモーション詳細を見る"))) return;
      let node = el;
      for (let depth = 0; node && depth <= 8; depth++, node = node.parentElement) {
        if (node.tagName === "BODY") break;
        const text = (node.innerText || node.textContent || "").replace(/\s+/g, " ");
        if (text.includes(expected)) {
          out.push({ index, depth, label, href: el.getAttribute("href") || null, tag: el.tagName });
          break;
        }
      }
    });
    return out;
  }, marker);

  if (candidates.length === 0) {
    throw new Error(`${marker}: 同じプロモーション枠内に「プロモーション詳細を見る」または「広告原稿一覧」がありません`);
  }
  const minDepth = Math.min(...candidates.map((x) => x.depth));
  const nearest = candidates.filter((x) => x.depth === minDepth);
  const directMaterial = nearest.filter((x) => x.label.includes("広告原稿一覧"));
  const preferred = directMaterial.length > 0 ? directMaterial : nearest;
  const uniqueTargets = new Set(preferred.map((x) => x.href ?? `${x.index}:${x.label}`));
  if (uniqueTargets.size !== 1) {
    const diagnostic = preferred.map((x) => ({
      tag: x.tag,
      depth: x.depth,
      label: x.label,
      href: x.href ? x.href.replace(/\?.*$/, "?[redacted]") : null,
    }));
    throw new Error(`${marker}: 広告原稿一覧の導線が複数あり一意に決まりません ${JSON.stringify(diagnostic)}`);
  }
  return { locator: controls.nth(preferred[0].index), evidence: preferred[0] };
}

async function clickMaybeNewPage(ctx, currentPage, locator, timeoutMs) {
  const beforePages = new Set(ctx.pages());
  await locator.click({ timeout: 30000 });
  await currentPage.waitForTimeout(1200);
  const nextPage = ctx.pages().find((p) => !beforePages.has(p)) ?? currentPage;
  if (nextPage !== currentPage) {
    await nextPage.waitForLoadState("domcontentloaded", { timeout: timeoutMs }).catch(() => {});
  }
  await nextPage.waitForTimeout(1200);
  return nextPage;
}

async function findUniqueExactControl(page, label) {
  const controls = page.locator(CONTROL_SELECTOR);
  const indexes = await controls.evaluateAll((els, expected) =>
    els.flatMap((el, index) => {
      const got = (el.textContent ||
        el.getAttribute("value") ||
        el.getAttribute("aria-label") ||
        el.getAttribute("alt") ||
        el.getAttribute("title") ||
        el.querySelector("img")?.getAttribute("alt") ||
        "")
        .replace(/\s+/g, " ")
        .trim();
      return got === expected ? [index] : [];
    }), label);
  if (indexes.length !== 1) return { locator: null, count: indexes.length };
  return { locator: controls.nth(indexes[0]), count: 1 };
}

function normalizeForMatch(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(/[\s【】「」『』（）()・｜|ー～~!！?？、。,:：]/g, "")
    .toLowerCase();
}

export function pageMatchesProgram(text, target) {
  if (text.includes(`PID:${target.id}`) || text.includes(`【PID:${target.id}】`)) return true;
  const page = normalizeForMatch(text);
  const name = normalizeForMatch(target.name);
  if (name.length < 8) return false;
  return [name.slice(0, 18), name.slice(-18)].filter((x) => x.length >= 8).some((x) => page.includes(x));
}

async function materialCandidates(page) {
  const controls = page.locator(CONTROL_SELECTOR);
  return controls.evaluateAll((els) => {
    const labelOf = (el) =>
      (el.textContent ||
        el.getAttribute("value") ||
        el.getAttribute("aria-label") ||
        el.getAttribute("alt") ||
        el.getAttribute("title") ||
        el.querySelector("img")?.getAttribute("alt") ||
        "")
        .replace(/\s+/g, " ")
        .trim();
    return els.flatMap((el, index) => {
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0 || getComputedStyle(el).visibility === "hidden") return [];
      const label = labelOf(el);
      const explicitLinkCode = label.includes("広告原稿") && label.includes("リンクコード") && label.includes("取得");
      const afbCssLinkCode = label === "こちら";
      if (!(explicitLinkCode || afbCssLinkCode)) return [];
      let node = el;
      let blockText = label;
      for (let depth = 0; node && depth <= 7; depth++, node = node.parentElement) {
        if (node.tagName === "BODY") break;
        const text = (node.innerText || node.textContent || "").replace(/\s+/g, " ").trim();
        const materialIds = text.match(/【ID:\d+】/g) ?? [];
        if (materialIds.length === 1 && /サイズ\s*[：:]?\s*\d+\s*[×xX＊*]\s*\d+/.test(text)) {
          blockText = text.slice(0, 1200);
          break;
        }
      }
      const sizeMatch = blockText.match(/(\d+)\s*[×xX＊*]\s*(\d+)/);
      const width = Number(sizeMatch?.[1] ?? 0) || null;
      const height = Number(sizeMatch?.[2] ?? 0) || null;
      const isText = /テキスト原稿|テキストリンク/.test(blockText);
      const rank = width === 300 && height === 250 ? 0 : isText ? 1 : width === 250 && height === 250 ? 2 : width === 320 && height === 100 ? 3 : 9;
      return sizeMatch ? [{ index, label, width, height, isText, rank }] : [];
    });
  });
}

async function materialControlDiagnostics(page) {
  return page.locator(CONTROL_SELECTOR).evaluateAll((els) =>
    els.flatMap((el) => {
      let node = el;
      let size = null;
      for (let depth = 0; node && depth <= 7; depth++, node = node.parentElement) {
        const text = (node.innerText || node.textContent || "").replace(/\s+/g, " ").trim();
        const match = text.match(/サイズ\s*[：:]?\s*(\d+)\s*[×xX＊*]\s*(\d+)/);
        if (match) {
          size = `${match[1]}x${match[2]}`;
          break;
        }
      }
      const fields = {
        tag: el.tagName,
        type: el.getAttribute("type"),
        className: String(el.className || "").slice(0, 100),
        name: (el.getAttribute("name") || "").slice(0, 100),
        text: (el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 100),
        value: (el.getAttribute("value") || "").slice(0, 100),
        alt: (el.getAttribute("alt") || "").slice(0, 100),
        title: (el.getAttribute("title") || "").slice(0, 100),
        aria: (el.getAttribute("aria-label") || "").slice(0, 100),
        childAlt: (el.querySelector("img")?.getAttribute("alt") || "").slice(0, 100),
        href: (el.getAttribute("href") || "").replace(/\?.*$/, "?[redacted]").slice(0, 140),
        src: (el.getAttribute("src") || "").replace(/\?.*$/, "?[redacted]").slice(0, 140),
        hasOnclick: Boolean(el.getAttribute("onclick")),
        size,
      };
      return size || Object.values(fields).some((x) => typeof x === "string" && x.includes("広告")) ? [fields] : [];
    }),
  );
}

async function codeValues(page) {
  return page.locator("textarea,input[type='text']").evaluateAll((els) =>
    els
      .map((el) => String(el.value || el.textContent || "").trim())
      .filter((value) => value.includes("afi-b.com/visit.php") || value.includes("affiliate-b.com/visit.php")),
  );
}

function creativeRank(fields) {
  if (fields?.width === 300 && fields?.height === 250) return 0;
  if (fields?.adType === "text") return 1;
  if (fields?.width === 250 && fields?.height === 250) return 2;
  if (fields?.width === 320 && fields?.height === 100) return 3;
  return 9;
}

function creativeSelection(fields) {
  const rank = creativeRank(fields);
  if (rank === 0) return "canonical-300x250";
  if (fields?.adType === "text") return "text-fallback";
  return `canonical-${fields?.width}x${fields?.height}`;
}

function saveArtifact({ target, root, site, sourceUrl, rawCode, parsed }) {
  mkdirSync(OUTPUT_DIR, { recursive: true, mode: 0o700 });
  const fingerprint = createHash("sha256").update(rawCode).digest("hex");
  const artifact = {
    schemaVersion: 1,
    asp: "afb",
    site: root.targetSiteName,
    siteId: site.actualSiteId,
    programId: target.id,
    programKey: target.key,
    programName: target.name,
    vertical: target.vertical,
    collectedAt: new Date().toISOString(),
    sourceUrl,
    selection: creativeSelection(parsed.fields),
    fingerprint,
    fields: parsed.fields,
    rawCode,
  };
  const path = join(OUTPUT_DIR, `${target.id}.json`);
  writeFileSync(path, JSON.stringify(artifact, null, 2) + "\n", { encoding: "utf8", mode: 0o600 });
  return { path, fingerprint, fields: parsed.fields, selection: artifact.selection };
}

async function clickAndReadCode(ctx, page, candidate, timeoutMs) {
  const beforePages = new Set(ctx.pages());
  await page.locator(CONTROL_SELECTOR).nth(candidate.index).click({ timeout: 30000 });
  await page.waitForTimeout(1200);
  const codePage = ctx.pages().find((p) => !beforePages.has(p)) ?? page;
  if (codePage !== page) {
    await codePage.waitForLoadState("domcontentloaded", { timeout: timeoutMs }).catch(() => {});
    await codePage.waitForTimeout(500);
  }
  const values = await codeValues(codePage);
  if (codePage !== page) await codePage.close().catch(() => {});
  return values.map((rawCode) => ({ rawCode, parsed: parseAfbCode(rawCode) }));
}

async function harvestOne(ctx, page, asp, root, target, runId) {
  const site = await ensureTargetSite(page, asp, root, { navigateTo: asp.partneredPath });
  await page.waitForFunction(() => document.body && document.body.innerText.includes("表示結果"), null, {
    timeout: asp.browser.timeoutMs,
  });

  let control;
  try {
    control = await findMaterialControl(page, target.id);
  } catch (error) {
    await dumpFailure(page, aspBrowserCfg(asp), runId, {
      step: `harvest-material-link-${target.id}`,
      expected: `【PID:${target.id}】 と同一枠の広告原稿導線`,
      message: error?.message ?? String(error),
    });
    throw error;
  }
  let materialPage = await clickMaybeNewPage(ctx, page, control.locator, asp.browser.timeoutMs);

  if (new RegExp(asp.reAuthPattern, "i").test(materialPage.url())) throw new Error(`${target.key}: 原稿ページで再ログイン要求`);
  let text = await visibleText(materialPage, 200000);
  if (!pageMatchesProgram(text, target)) {
    await dumpFailure(materialPage, aspBrowserCfg(asp), runId, {
      step: `harvest-program-bind-${target.id}`,
      message: "原稿ページと PID/name を結べない",
    });
    throw new Error(`${target.key}: 原稿ページが対象 PID/name と一致しません`);
  }

  if (control.evidence.label.includes("プロモーション詳細を見る")) {
    const materialLink = await findUniqueExactControl(materialPage, "広告原稿一覧");
    if (!materialLink.locator) {
      await dumpFailure(materialPage, aspBrowserCfg(asp), runId, {
        step: `harvest-detail-link-${target.id}`,
        expected: "広告原稿一覧（完全一致・1件）",
        actual: `${materialLink.count}件`,
        message: "詳細ページから広告原稿一覧への導線を一意に決められない",
      });
      throw new Error(`${target.key}: 詳細ページの「広告原稿一覧」が ${materialLink.count} 件です`);
    }
    const detailPage = materialPage;
    materialPage = await clickMaybeNewPage(ctx, detailPage, materialLink.locator, asp.browser.timeoutMs);
    if (materialPage !== detailPage && detailPage !== page) await detailPage.close().catch(() => {});
    text = await visibleText(materialPage, 200000);
    if (!pageMatchesProgram(text, target)) {
      await dumpFailure(materialPage, aspBrowserCfg(asp), runId, {
        step: `harvest-material-bind-${target.id}`,
        message: "広告原稿一覧ページと PID/name を結べない",
      });
      throw new Error(`${target.key}: 広告原稿一覧ページが対象 PID/name と一致しません`);
    }
  }

  const materialUrl = new URL(materialPage.url());
  const sourceSiteId = materialUrl.searchParams.get("s");
  if (sourceSiteId !== String(site.actualSiteId)) {
    throw new SiteAttributionError({
      reason: `afb 原稿ページの site ID 不一致: 期待 ${site.actualSiteId} / 実際 ${sourceSiteId ?? "不明"}`,
      expectedSiteId: String(site.actualSiteId),
      actualSiteId: sourceSiteId,
    });
  }
  const sourceProgramId = materialUrl.searchParams.get("adv_id");
  if (sourceProgramId !== String(target.id)) {
    throw new Error(
      `${target.key}: afb 原稿ページの program ID 不一致: 期待 ${target.id} / 実際 ${sourceProgramId ?? "不明"}`,
    );
  }

  // afb は折りたたみ前から原稿コードを DOM の hidden textarea に埋め込む。
  // ボタンを押さず、対象サイト付き URL の read-back 後に完全コードだけを選ぶ方が安全。
  const embedded = (await codeValues(materialPage))
    .map((rawCode) => ({ rawCode, parsed: parseAfbCode(rawCode) }))
    .filter((item) => item.parsed.ok)
    .sort((a, b) => creativeRank(a.parsed.fields) - creativeRank(b.parsed.fields));
  if (embedded.length > 0 && creativeRank(embedded[0].parsed.fields) < 9) {
    const result = saveArtifact({
      target,
      root,
      site,
      sourceUrl: materialPage.url(),
      rawCode: embedded[0].rawCode,
      parsed: embedded[0].parsed,
    });
    if (materialPage !== page) await materialPage.close().catch(() => {});
    return result;
  }

  const candidates = (await materialCandidates(materialPage)).sort((a, b) => a.rank - b.rank || a.index - b.index);
  if (candidates.length === 0) {
    const diagnostic = (await materialControlDiagnostics(materialPage)).slice(0, 120);
    await dumpFailure(materialPage, aspBrowserCfg(asp), runId, {
      step: `harvest-no-controls-${target.id}`,
      message: `リンクコード取得ボタンなし ${JSON.stringify(diagnostic)}`,
    });
    throw new Error(`${target.key}: 「広告原稿（リンクコード）取得」がありません。診断 artifact を確認してください`);
  }

  const tried = [];
  for (const candidate of candidates) {
    if (candidate.rank >= 9) continue;
    const results = await clickAndReadCode(ctx, materialPage, candidate, asp.browser.timeoutMs);
    for (const result of results) {
      tried.push(result.parsed.error ?? `${result.parsed.fields?.adType}:${result.parsed.fields?.width ?? "text"}`);
      if (!result.parsed.ok) continue;
      const fields = result.parsed.fields;
      const matchesCandidate = candidate.isText
        ? fields.adType === "text"
        : fields.width === candidate.width && fields.height === candidate.height;
      if (!matchesCandidate) continue;

      const saved = saveArtifact({
        target,
        root,
        site,
        sourceUrl: materialPage.url(),
        rawCode: result.rawCode,
        parsed: result.parsed,
      });
      if (materialPage !== page) await materialPage.close().catch(() => {});
      return saved;
    }
  }

  await dumpFailure(materialPage, aspBrowserCfg(asp), runId, {
    step: `harvest-no-valid-code-${target.id}`,
    message: `候補 ${candidates.length} / 試行 ${tried.join(",")}`,
  });
  throw new Error(`${target.key}: canonical な完全コードを取得できません (${tried.join(", ") || "未試行"})`);
}

async function main() {
  const opts = parseArgs();
  const targets = loadTargets(opts.ids);
  const root = loadAspConfig();
  const asp = getAsp(root, "afb");
  const runId = makeRunId();
  const isReady = async (page) =>
    !new RegExp(asp.reAuthPattern, "i").test(page.url()) &&
    (await page.locator(asp.readyMarker).count().catch(() => 0)) > 0;

  console.log(`afb 広告原稿取得: ${targets.map((x) => x.key).join(", ")} / 対象サイト=${root.targetSiteName}`);
  const { ctx, page } = await openAsp(asp, { isReady, label: "afb" });
  const completed = [];
  try {
    for (const target of targets) {
      const result = await harvestOne(ctx, page, asp, root, target, runId);
      completed.push({ target, ...result });
      console.log(`  ✓ ${target.key}: ${result.fields.adType}${result.fields.width ? ` ${result.fields.width}x${result.fields.height}` : ""} / fingerprint=${result.fingerprint.slice(0, 12)}`);
    }
  } finally {
    await ctx.close().catch(() => {});
  }

  console.log(`\n取得完了 ${completed.length} 件（ローカル保存のみ・SSOT未登録・未公開）`);
  for (const item of completed) console.log(`  - ${item.target.key}: ${item.path}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().catch((error) => {
    if (error instanceof SiteAttributionError) {
      console.error(`サイト帰属を確定できないため中止: ${error.message}`);
      process.exit(5);
    }
    console.error(`Fatal: ${error?.message ?? error}`);
    process.exit(1);
  });
}
