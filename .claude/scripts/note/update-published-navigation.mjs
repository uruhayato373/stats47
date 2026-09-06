#!/usr/bin/env node

/**
 * catalog の nextBestArticle を持つ公開記事へ、次の記事 + マガジンの回遊フッターを追加する。
 * 既定は audit-only。note.com へ書くには --commit が必要。
 *
 * Usage:
 *   node .claude/scripts/note/update-published-navigation.mjs
 *   node .claude/scripts/note/update-published-navigation.mjs --slug recovered-nf962c6702b93 --commit
 *   node .claude/scripts/note/update-published-navigation.mjs --all-planned --commit
 *   node .claude/scripts/note/update-published-navigation.mjs --all --commit
 *   node .claude/scripts/note/update-published-navigation.mjs --products [--commit]
 *   node .claude/scripts/note/update-published-navigation.mjs --products --check
 */

import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  applyNavigationFooter,
  applyPublishedLinkRepairs,
  applyVisibleNavigationBeforeSeparator,
  buildNoteProductCardUrl,
  canonicalizeNoteEditorBody,
} from "./lib/navigation-footer.mjs";
import { assertAccount, launchContext, UA } from "./lib/note-session.mjs";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(SCRIPT_DIR, "../../..");
const RUN_DATE = new Date().toISOString().slice(0, 10);
const REPORT_PATH = join(ROOT, ".claude/state/metrics", `note-navigation-pilot-${RUN_DATE}.json`);
const METRICS_PATH = join(ROOT, ".claude/state/metrics/note", `note-${RUN_DATE}.json`);
const CIRCULATION_AUDIT_PATH = join(ROOT, ".claude/state/metrics", `note-circulation-audit-${RUN_DATE}.json`);

function parseArgs(argv) {
  const slugIndex = argv.indexOf("--slug");
  const slug = slugIndex >= 0 ? argv[slugIndex + 1] : null;
  const allPlanned = argv.includes("--all-planned");
  const allFree = argv.includes("--all-free") || argv.includes("--all");
  const repairRedirects = argv.includes("--repair-redirects") || argv.includes("--all");
  const products = argv.includes("--products");
  const check = argv.includes("--check");
  if (check && !products) throw new Error("--check は --products と同時に指定してください");
  if (slug && (allPlanned || allFree)) {
    throw new Error("--slug と --all-planned/--all-free/--all は同時指定できません");
  }
  if (argv.includes("--commit") && !slug && !allPlanned && !allFree && !repairRedirects && !products) {
    throw new Error("書き込み時は --slug <key> または一括オプションを指定してください");
  }
  return {
    slug,
    allPlanned,
    allFree,
    repairRedirects,
    products,
    check,
    commit: argv.includes("--commit"),
  };
}

function catalog() {
  const raw = execFileSync("npx", ["tsx", join(ROOT, ".claude/scripts/note/catalog/dump-circulation-json.ts")], {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  });
  return JSON.parse(raw);
}

function noteKeyFromUrl(url) {
  const key = new URL(url).pathname.match(/\/n\/(n[0-9a-f]+)$/i)?.[1];
  if (!key) throw new Error(`note key を抽出できません: ${url}`);
  return key;
}

function fnv1a(value) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < String(value || "").length; index += 1) {
    hash = Math.imul(hash ^ String(value).charCodeAt(index), 0x01000193);
  }
  return (hash >>> 0).toString(16);
}

function sleep(milliseconds) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds));
}

async function fetchNote(noteKey, attempts = 5, requestContext = null) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const url = `https://note.com/api/v3/notes/${noteKey}?ts=${Date.now()}`;
      const response = requestContext
        ? await requestContext.get(url, { headers: { "User-Agent": UA } })
        : await fetch(url, { headers: { "user-agent": "stats47-note-navigation/1.0" } });
      const status = requestContext ? response.status() : response.status;
      if (status === 403 || status === 429) {
        throw new Error(`HTTP ${status} (rate limit)`);
      }
      if (status < 200 || status >= 300) throw new Error(`HTTP ${status}`);
      const json = await response.json();
      if (!json?.data) throw new Error("note API response has no data");
      return json.data;
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        const rateLimited = /HTTP (?:403|429)/.test(String(error?.message || error));
        await sleep(rateLimited ? attempt * 5_000 : attempt * 700);
      }
    }
  }
  throw lastError;
}

function snapshot(note) {
  return {
    status: note.status,
    account: note.user?.urlname || "",
    price: Number(note.price || 0),
    separator: note.separator || null,
    hashtagCount: Array.isArray(note.hashtag_notes) ? note.hashtag_notes.length : 0,
    hashtags: Array.isArray(note.hashtag_notes)
      ? note.hashtag_notes.map((item) => item?.hashtag?.name).filter(Boolean)
      : [],
    hasDraft: Boolean(note.has_draft),
    body: String(note.body || ""),
    bodySignature: fnv1a(note.body || ""),
  };
}

function latestViews() {
  try {
    const json = JSON.parse(readFileSync(METRICS_PATH, "utf8"));
    return new Map((json.articles || []).map((article) => [article.noteId, article.views]));
  } catch {
    return new Map();
  }
}

function targetFamily(article) {
  const target = article.stats47Targets?.[0] || "";
  const match = target.match(/^\/ranking\/(sports|hobby|study|travel|volunteer)-/);
  return match?.[1] || article.magazine || article.vertical;
}

function chooseRelatedArticle(article, source, views) {
  const manual = article.nextBestArticle
    ? source.articles.find((candidate) => candidate.key === article.nextBestArticle)
    : null;
  if (manual) return manual;
  if (!article.magazine) return null;
  const family = targetFamily(article);
  const candidates = source.articles.filter(
    (candidate) => candidate.key !== article.key
      && candidate.magazine === article.magazine
      && targetFamily(candidate) === family,
  );
  const fallback = candidates.length > 0
    ? candidates
    : source.articles.filter(
      (candidate) => candidate.key !== article.key && candidate.magazine === article.magazine,
    );
  return fallback.sort((left, right) => {
    const rightViews = views.get(noteKeyFromUrl(right.noteUrl)) ?? -1;
    const leftViews = views.get(noteKeyFromUrl(left.noteUrl)) ?? -1;
    if (rightViews !== leftViews) return rightViews - leftViews;
    return String(left.publishedAt || "").localeCompare(String(right.publishedAt || ""))
      || left.key.localeCompare(right.key);
  })[0] || null;
}

function auditRemediation() {
  try {
    const audit = JSON.parse(readFileSync(CIRCULATION_AUDIT_PATH, "utf8"));
    return new Map(audit.articles.map((article) => {
      const forceNormalizeLegacy = article.warnings.some((warning) => warning.code === "non_https_site_link");
      const repairs = article.warnings
        .filter((warning) => warning.code === "redirected_site_link")
        .flatMap((warning) => warning.detail || [])
        .filter((detail) => {
          try {
            const from = new URL(detail.url);
            const to = new URL(detail.finalUrl);
            return from.protocol === "https:"
              && to.protocol === "https:"
              && ["stats47.jp", "www.stats47.jp"].includes(from.hostname)
              && to.hostname === "stats47.jp"
              && !to.search
              && !to.hash
              && detail.finalStatus === 200;
          } catch {
            return false;
          }
        })
        .map((detail) => ({ mode: "replace-url", fromUrl: detail.url, toUrl: detail.finalUrl }));
      return [article.key, { forceNormalizeLegacy, repairs }];
    }));
  } catch {
    return new Map();
  }
}

function buildPlans(source, views, options) {
  const articles = new Map(source.articles.map((article) => [article.key, article]));
  const magazines = new Map(source.magazines.map((magazine) => [magazine.key, magazine]));
  const remediation = auditRemediation();
  return source.articles
    .filter((article) => {
      const liveRepair = remediation.get(article.key);
      return article.nextBestArticle
        || article.publishedLinkRepairs?.length
        || (options.slug === article.key && !article.isPaid)
        || (options.allFree && !article.isPaid)
        || (options.products && !article.isPaid && Boolean(magazines.get(article.magazine)?.productTarget))
        || (options.repairRedirects && (liveRepair?.forceNormalizeLegacy || liveRepair?.repairs.length));
    })
    .map((article) => {
      const includeFooter = (options.allFree || options.slug === article.key) && !article.isPaid
        || Boolean(article.nextBestArticle);
      const next = includeFooter ? chooseRelatedArticle(article, source, views) : null;
      const magazineRecord = magazines.get(article.magazine);
      const magazine = includeFooter ? magazineRecord : null;
      const productTarget = options.products && !article.isPaid
        ? magazineRecord?.productTarget || null
        : null;
      if (article.nextBestArticle && !next?.noteUrl)
        throw new Error(`${article.key}: nextBestArticle が未公開`);
      if (article.nextBestArticle && !magazine?.noteUrl)
        throw new Error(`${article.key}: magazine が未公開`);
      const liveRepair = remediation.get(article.key) || { forceNormalizeLegacy: false, repairs: [] };
      const repairs = [
        ...(article.publishedLinkRepairs || []),
        ...(options.repairRedirects ? liveRepair.repairs : []),
      ].filter((repair, index, values) => values.findIndex(
        (candidate) => candidate.mode === repair.mode
          && candidate.fromUrl === repair.fromUrl
          && candidate.toUrl === repair.toUrl,
      ) === index);
      const target = article.stats47Targets?.[0];
      const siteUrl = target ? `https://stats47.jp${target}` : "https://stats47.jp";
      return {
        article,
        next,
        magazine,
        repairs,
        forceNormalizeLegacy: options.repairRedirects && liveRepair.forceNormalizeLegacy,
        desiredSeparator: article.publishedSeparator ?? null,
        footer: includeFooter || productTarget
          ? {
              nextNoteUrl: next?.noteUrl || null,
              nextNoteKey: next?.noteUrl ? noteKeyFromUrl(next.noteUrl) : null,
              nextNoteLead: next ? `「${next.title}」も同じテーマで読まれています。` : null,
              magazineUrl: magazine?.noteUrl || null,
              magazineName: magazine?.name || null,
              magazineDescription: magazine?.description || null,
              siteUrl,
              siteTitle: target ? `${article.title}｜47都道府県データ` : "統計で見る都道府県 stats47",
              siteDescription: target
                ? "47都道府県の順位・数値・グラフを無料で確認できます。"
                : "公的統計を47都道府県のランキング・地図・グラフで確認できます。",
              productUrl: productTarget
                ? buildNoteProductCardUrl(productTarget, article.noteUrl)
                : null,
              productTitle: productTarget ? `${magazineRecord?.name || article.title}の商品・書籍` : null,
              productDescription: productTarget
                ? "無料の数値に加え、テーマ別に編集したKindle本または再利用しやすいデータ集を確認できます。"
                : null,
            }
          : null,
      };
    });
}

function applyPlanBody(body, plan) {
  const repaired = applyPublishedLinkRepairs(body, plan.repairs);
  const navigation = plan.footer
      ? applyNavigationFooter(repaired.body, plan.footer)
    : {
        body: repaired.body,
        changed: false,
        normalizedLegacyLinks: false,
        addedNextNote: false,
        addedMagazine: false,
        addedSite: false,
        addedProduct: false,
      };
  return {
    body: navigation.body,
    changed: repaired.changed || navigation.changed,
    normalizedLegacyLinks: repaired.normalizedLegacyLinks || navigation.normalizedLegacyLinks,
    addedNextNote: navigation.addedNextNote,
    addedMagazine: navigation.addedMagazine,
    addedSite: navigation.addedSite,
    addedProduct: navigation.addedProduct,
    repairs: repaired.repairs,
  };
}

function saveReport(report) {
  mkdirSync(dirname(REPORT_PATH), { recursive: true });
  writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}

async function installPatch(page, before, updatedBody, plan, visibilityNudge = null) {
  const state = { installed: true };
  await page.route("**/api/v1/text_notes/**", async (route) => {
    const request = route.request();
    if (request.method() !== "PUT") {
      await route.continue();
      return;
    }
    try {
      const payload = request.postDataJSON();
      if (Number(payload.price || 0) !== before.price) throw new Error("price changed before update");
      const targetSeparator = visibilityNudge && Object.hasOwn(visibilityNudge, "restoreSeparator")
        ? visibilityNudge.restoreSeparator
        : before.separator;
      if (visibilityNudge && Object.hasOwn(visibilityNudge, "restoreSeparator")) {
        payload.separator = targetSeparator;
      }
      const legacyFreeBoundary = before.price === 0 && Boolean(targetSeparator);
      if (!legacyFreeBoundary && (payload.separator || null) !== targetSeparator) {
        throw new Error("separator changed before update");
      }
      if (!Array.isArray(payload.hashtags)) throw new Error("hashtags are missing");
      if (payload.hashtags.length !== before.hashtagCount) {
        throw new Error("hashtags changed before update");
      }
      if (typeof payload.free_body !== "string") throw new Error("free body is missing");
      if (before.price > 0 && typeof payload.pay_body !== "string") throw new Error("paid body is missing");
      if (legacyFreeBoundary && String(payload.pay_body || "").length > 0) {
        throw new Error("legacy free article unexpectedly has paid body");
      }
      const currentBody = before.price > 0
        ? `${payload.free_body}${payload.pay_body}`
        : payload.free_body;
      if (visibilityNudge) {
        if (payload.exclude_from_creator_top !== visibilityNudge.expectedExclude) {
          throw new Error("クリエイターページ表示の一時変更を確認できません");
        }
        payload.exclude_from_creator_top = visibilityNudge.restoreExclude;
      }
      const sameAuthoredBody = canonicalizeNoteEditorBody(currentBody)
        === canonicalizeNoteEditorBody(before.body);
      if (!legacyFreeBoundary && fnv1a(currentBody) !== before.bodySignature && !sameAuthoredBody) {
        throw new Error("published body changed before update");
      }
      const payBodySignature = before.price > 0 ? fnv1a(payload.pay_body) : null;
      if (legacyFreeBoundary) payload.separator = targetSeparator;
      if (before.price > 0) {
        const freeRepairs = plan.repairs.filter(
          (repair) => payload.free_body.includes(repair.fromUrl) || payload.free_body.includes(repair.toUrl),
        );
        const updatedFreeBody = applyPublishedLinkRepairs(payload.free_body, freeRepairs).body;
        if (!updatedBody.startsWith(updatedFreeBody)) {
          throw new Error("有料境界を保持したまま本文を分割できません");
        }
        payload.free_body = updatedFreeBody;
        payload.pay_body = updatedBody.slice(updatedFreeBody.length);
      } else {
        payload.free_body = updatedBody;
      }
      Object.assign(state, {
        status: "sending",
        beforeBodySignature: before.bodySignature,
        sentBodySignature: fnv1a(updatedBody),
        sentBodyLength: updatedBody.length,
        price: Number(payload.price || 0),
        separator: payload.separator || null,
        hashtagCount: payload.hashtags.length,
        payBodySignature,
        payBodyLength: payload.pay_body?.length || 0,
        restoredLegacyFreeSeparator: legacyFreeBoundary,
      });
      await route.continue({
        postData: JSON.stringify(payload),
        headers: { ...request.headers(), "content-type": "application/json" },
      });
    } catch (error) {
      Object.assign(state, { status: 409, guardError: error.message });
      await route.fulfill({ status: 409, contentType: "application/json", body: '{"error":"blocked by navigation guard"}' });
    }
  });
  page.on("response", (response) => {
    const request = response.request();
    if (request.method() === "PUT" && request.url().includes("/api/v1/text_notes/")) {
      state.status = response.status();
    }
  });
  return state;
}

async function publishPlan(ctx, plan, before, publicBefore) {
  let identicalDraft = false;
  let draftCompatibility = "none";
  let source = before;
  if (before.hasDraft) {
    const noteKey = noteKeyFromUrl(plan.article.noteUrl);
    const response = await ctx.request.get(
      `https://note.com/api/v3/notes/${noteKey}?draft=true&draft_reedit=false&ts=${Date.now()}`,
      { headers: { "User-Agent": UA } },
    );
    const draft = snapshot((await response.json())?.data || {});
    identicalDraft = draft.bodySignature === before.bodySignature
      && draft.price === before.price
      && draft.separator === before.separator
      && draft.hashtagCount === before.hashtagCount;
    const sameAuthoredBody = canonicalizeNoteEditorBody(draft.body) === canonicalizeNoteEditorBody(before.body);
    const legacyFreeSeparatorRemoval = before.price === 0
      && Boolean(before.separator)
      && !draft.separator
      && sameAuthoredBody;
    const presentationOnlyDraft = draft.price === before.price
      && (draft.separator === before.separator || legacyFreeSeparatorRemoval)
      && draft.hashtagCount === before.hashtagCount
      && sameAuthoredBody;
    if (!identicalDraft && !presentationOnlyDraft) {
      throw new Error("未公開下書きが公開版と実内容で異なるため本文更新を停止");
    }
    source = draft;
    draftCompatibility = identicalDraft
      ? "identical"
      : legacyFreeSeparatorRemoval ? "legacy_free_separator_removed" : "card_metadata_only";
  }
  let application;
  if (source.price === 0 && source.separator && plan.footer) {
    const repaired = applyPublishedLinkRepairs(source.body, plan.repairs);
    const publicRepairs = plan.repairs.filter(
      (repair) => publicBefore.body.includes(repair.fromUrl) || publicBefore.body.includes(repair.toUrl),
    );
    const repairedPublic = applyPublishedLinkRepairs(publicBefore.body, publicRepairs);
    const visible = applyVisibleNavigationBeforeSeparator(
      repaired.body,
      repairedPublic.body,
      source.separator,
      plan.footer,
    );
    application = visible.changed
      ? {
          ...visible,
          normalizedLegacyLinks: repaired.normalizedLegacyLinks || repairedPublic.normalizedLegacyLinks,
          repairs: repaired.repairs,
        }
      : applyPlanBody(source.body, plan);
  } else {
    application = applyPlanBody(source.body, plan);
  }
  if (plan.desiredSeparator && source.separator !== plan.desiredSeparator && !application.changed) {
    application = { ...application, changed: true };
  }
  if (!application.changed) return { status: "already_compliant", ...application };

  const noteKey = noteKeyFromUrl(plan.article.noteUrl);
  const page = await ctx.newPage();
  try {
    let visibilityNudge = null;
    await page.goto(`https://editor.note.com/notes/${noteKey}/edit?draft_reedit=true`, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });
    await page.waitForTimeout(2_800);
    const editorCount = await page.locator('[contenteditable="true"][role="textbox"]').count();
    if (editorCount !== 1) throw new Error(`記事編集画面を確認できません: editor=${editorCount}`);
    await page.getByRole("button", { name: "公開に進む" }).click();
    await page.locator('[placeholder="ハッシュタグを追加する"]').waitFor({ state: "visible", timeout: 15_000 });
    if (source.price > 0) {
      const areaButton = page.getByRole("button", { name: "有料エリア設定", exact: true });
      if (await areaButton.count() !== 1) throw new Error("有料エリア設定ボタンを確認できません");
      await areaButton.click();
      await page.waitForTimeout(1_500);
      const boundary = page.locator("#paywall-line");
      if (await boundary.count() !== 1 || await boundary.getAttribute("aria-pressed") !== "true") {
        throw new Error("有料境界の既存選択状態を確認できません");
      }
    } else if (before.price === 0 && (source.separator || before.separator || plan.desiredSeparator)) {
      // 旧形式の無料記事は本文を直接変更しても publish 画面が dirty にならない。
      // クリエイターページ表示を一時反転し、installPatch が元の値と separator を復元する。
      const visibilitySwitch = page.getByRole("switch", { name: "クリエイターページに表示" });
      if (await visibilitySwitch.count() !== 1) throw new Error("クリエイターページ表示設定を確認できません");
      const wasVisible = await visibilitySwitch.getAttribute("aria-checked") === "true";
      await visibilitySwitch.click();
      await page.waitForTimeout(500);
      visibilityNudge = {
        expectedExclude: wasVisible,
        restoreExclude: !wasVisible,
        restoreSeparator: plan.desiredSeparator || source.separator,
      };
      const areaButton = page.getByRole("button", { name: "試し読みエリアを設定", exact: true });
      if (await areaButton.count() !== 1) throw new Error("試し読みエリア設定ボタンを確認できません");
      await areaButton.click();
      await page.waitForTimeout(1_500);
      if (source.separator) {
        const lines = page.getByRole("button", { name: "ラインをこの場所に変更", exact: true });
        const selectedIndex = await lines.evaluateAll((buttons) => buttons.findIndex((button) => button.id === "paywall-line"));
        if (selectedIndex < 0) {
          throw new Error("無料記事の既存試し読み境界を確認できません");
        }
      }
    }
    const installed = await installPatch(page, source, application.body, plan, visibilityNudge);
    if (!installed?.installed) throw new Error("本文送信パッチの初期化に失敗");
    await page.getByRole("button", { name: "更新する" }).click();
    const patch = installed;
    for (let attempt = 0; attempt < 16; attempt += 1) {
      await page.waitForTimeout(500);
      if (Number.isInteger(patch?.status)) break;
    }
    if (!Number.isInteger(patch?.status)) {
      throw new Error(`更新APIが発火しません: api=${JSON.stringify(patch)}`);
    }
    if (patch.status < 200 || patch.status >= 300) {
      throw new Error(patch.guardError || `更新APIが失敗しました: api=${JSON.stringify(patch)}`);
    }

    let live;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      live = snapshot(await fetchNote(noteKey, 5, ctx.request));
      const footerOk = !plan.footer || (
        (!plan.footer.nextNoteUrl || live.body.includes(plan.footer.nextNoteUrl))
        && (!plan.footer.magazineUrl || live.body.includes(plan.footer.magazineUrl))
        && (!application.addedSite || live.body.includes(plan.footer.siteUrl))
        && (!application.addedProduct || live.body.includes(plan.footer.productUrl))
      );
      const repairsOk = plan.repairs.every(
        (repair) => !live.body.includes(repair.fromUrl) && live.body.includes(repair.toUrl),
      );
      if (footerOk && repairsOk) break;
      await sleep(1_000);
    }
    if (!live || live.account !== "stats47" || live.status !== "published") throw new Error("更新後の記事帰属または公開状態が不正");
    const expectedSeparator = plan.desiredSeparator || source.separator;
    if (live.price !== source.price || live.separator !== expectedSeparator) throw new Error("価格または有料境界が変化");
    if (live.hashtagCount !== before.hashtagCount) throw new Error(`タグ数が変化: ${before.hashtagCount} -> ${live.hashtagCount}`);
    if (plan.footer && (
      (plan.footer.nextNoteUrl && !live.body.includes(plan.footer.nextNoteUrl))
      || (plan.footer.magazineUrl && !live.body.includes(plan.footer.magazineUrl))
      || (application.addedSite && !live.body.includes(plan.footer.siteUrl))
      || (application.addedProduct && !live.body.includes(plan.footer.productUrl))
    )) {
      throw new Error(`更新後本文で回遊URLを確認できません: api=${JSON.stringify(patch)}`);
    }
    for (const repair of plan.repairs) {
      if (live.body.includes(repair.fromUrl) || !live.body.includes(repair.toUrl)) {
        throw new Error(`更新後本文でリンク修復を確認できません: ${repair.fromUrl}`);
      }
    }
    if (plan.forceNormalizeLegacy && /http:\/\/(?:www\.)?stats47\.jp/i.test(live.body)) {
      throw new Error(`更新後本文に非HTTPSのstats47リンクが残存: api=${JSON.stringify(patch)}`);
    }
    if (live.bodySignature !== fnv1a(application.body)) throw new Error("送信した無料本文と公開本文が一致しません");
    return {
      status: "updated",
      beforeBodySignature: before.bodySignature,
      afterBodySignature: live.bodySignature,
      hashtagCount: live.hashtagCount,
      apiStatus: patch?.status ?? null,
      identicalDraft,
      draftCompatibility,
      paidBodyPreservedByPayload: before.price > 0 && Boolean(patch?.payBodySignature),
      ...application,
      body: undefined,
    };
  } finally {
    await page.close().catch(() => {});
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const source = catalog();
  const views = latestViews();
  let plans = buildPlans(source, views, options);
  if (options.slug) plans = plans.filter((plan) => plan.article.key === options.slug);
  if (options.slug && plans.length !== 1) throw new Error(`navigation plan が見つかりません: ${options.slug}`);

  const report = {
    generatedAt: new Date().toISOString(),
    account: "stats47",
    mode: options.commit ? "commit" : "audit-only",
    measurementContract: {
      site: "GA4 sessionSource=note.com × landingPagePlusQueryString（カードは素URL）",
      noteToNote: "遷移先記事のnote月間views差分（noteは記事間clickを提供しない）",
      magazine: "note側の直接click指標なし。所属一致と遷移先記事viewsを代替指標にする",
      product: "カードは /products/<slug>/from/note/<noteId> の素URL。サイト側で utm_source=note / utm_campaign=note_product / utm_content=<noteId> へ転送し、記事単位で集計",
    },
    articles: [],
  };

  const audited = [];
  for (const plan of plans) {
    const noteKey = noteKeyFromUrl(plan.article.noteUrl);
    const before = snapshot(await fetchNote(noteKey));
    if (before.account !== "stats47" || before.status !== "published") throw new Error(`${plan.article.key}: 記事帰属または公開状態が不正`);
    const application = applyPlanBody(before.body, plan);
    const item = {
      key: plan.article.key,
      noteKey,
      noteUrl: plan.article.noteUrl,
      baselineViews: views.get(noteKey) ?? null,
      nextBestArticle: plan.next?.key ?? null,
      nextNoteUrl: plan.footer?.nextNoteUrl ?? null,
      nextBaselineViews: plan.footer ? views.get(plan.footer.nextNoteKey) ?? null : null,
      magazine: plan.magazine?.key ?? plan.article.magazine ?? null,
      magazineUrl: plan.footer?.magazineUrl ?? null,
      siteUrl: plan.footer?.siteUrl ?? null,
      productUrl: plan.footer?.productUrl ?? null,
      linkRepairs: plan.repairs,
      forceNormalizeLegacy: plan.forceNormalizeLegacy,
      before: {
        bodySignature: before.bodySignature,
        hashtagCount: before.hashtagCount,
        price: before.price,
        separator: before.separator,
        hasDraft: before.hasDraft,
      },
      pending: application.changed,
      wouldAddNextNote: application.addedNextNote,
      wouldAddMagazine: application.addedMagazine,
      wouldAddSite: application.addedSite,
      wouldAddProduct: application.addedProduct,
      wouldNormalizeLegacyLinks: application.normalizedLegacyLinks,
    };
    if (options.commit && !item.pending) item.result = { status: "already_compliant" };
    report.articles.push(item);
    audited.push({ plan, before, item });
  }
  saveReport(report);
  const pendingCount = report.articles.filter((article) => article.pending).length;
  console.log(`audit: planned=${plans.length} pending=${pendingCount}`);
  console.log(`report: ${REPORT_PATH}`);
  if (!options.commit) {
    if (options.check && pendingCount > 0) process.exitCode = 1;
    return;
  }

  const ctx = await launchContext({ headless: true });
  try {
    console.log(`account gate: ${await assertAccount(ctx)}`);
    let consecutiveFailures = 0;
    for (const { plan, before, item } of audited.filter(({ item }) => item.pending)) {
      try {
        const fresh = snapshot(await fetchNote(item.noteKey, 5, ctx.request));
        const result = await publishPlan(ctx, plan, fresh, before);
        item.result = result;
        consecutiveFailures = 0;
        console.log(`${item.key}: ${result.status}`);
      } catch (error) {
        item.result = { status: "failed", error: error.message };
        consecutiveFailures += 1;
        console.error(`${item.key}: FAIL ${error.message}`);
        if (consecutiveFailures >= 3) {
          console.error("systemic stop: 3件連続失敗");
          break;
        }
      } finally {
        report.generatedAt = new Date().toISOString();
        saveReport(report);
        await sleep(1_500);
      }
    }
  } finally {
    await ctx.close();
  }
  if (report.articles.some((article) => article.result?.status === "failed")) process.exitCode = 1;
}

try {
  await main();
} catch (error) {
  console.error(`ERROR: ${error.message}`);
  process.exitCode = 1;
}
