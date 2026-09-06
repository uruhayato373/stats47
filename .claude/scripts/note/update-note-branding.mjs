#!/usr/bin/env node

/**
 * note.com/stats47 のプロフィールヘッダーとマガジン基本情報を catalog に同期する。
 * 既定は audit-only。外部書き込みは --commit が必須。
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { assertAccount, launchContext, UA } from "./lib/note-session.mjs";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(SCRIPT_DIR, "../../..");
const RUN_DATE = new Date().toISOString().slice(0, 10);
const ASSET_DIR = join(SCRIPT_DIR, "assets/brand-headers/generated");
const REPORT_PATH = join(ROOT, ".claude/state/metrics", `note-branding-update-${RUN_DATE}.json`);
const COMMIT = process.argv.includes("--commit");
const DEFAULT_COVER = /\/assets\/default\/default_magazine_header/;

function needsDescriptionUpdate(value) {
  return !String(value || "").trim() || /未作成|準備中/.test(String(value));
}

function catalog() {
  return JSON.parse(execFileSync(
    "npx",
    ["tsx", join(SCRIPT_DIR, "catalog/dump-magazines-json.ts")],
    { cwd: ROOT, encoding: "utf8" },
  ));
}

function magazineNoteKey(url) {
  const key = String(url || "").match(/\/m\/(m[0-9a-f]+)/)?.[1];
  if (!key) throw new Error(`magazine key を抽出できません: ${url}`);
  return key;
}

async function jsonFrom(response) {
  const status = typeof response.status === "function" ? response.status() : response.status;
  if (status < 200 || status >= 300) throw new Error(`HTTP ${status}`);
  return response.json();
}

async function fetchProfile(request = null) {
  const url = `https://note.com/api/v2/creators/stats47?branding=${Date.now()}`;
  const response = request
    ? await request.get(url, { headers: { "User-Agent": UA } })
    : await fetch(url, { headers: { "user-agent": "stats47-note-branding/1.0" } });
  return (await jsonFrom(response))?.data || {};
}

async function fetchMagazine(magazine, request = null) {
  const key = magazineNoteKey(magazine.noteUrl);
  const url = `https://note.com/api/v1/magazines/${key}/notes?page=1&branding=${Date.now()}`;
  const response = request
    ? await request.get(url, { headers: { "User-Agent": UA } })
    : await fetch(url, { headers: { "user-agent": "stats47-note-branding/1.0" } });
  const data = (await jsonFrom(response))?.data || {};
  return {
    name: data.name || "",
    description: data.description || "",
    cover: data.cover || "",
    defaultCover: DEFAULT_COVER.test(data.cover || ""),
  };
}

function save(report) {
  mkdirSync(dirname(REPORT_PATH), { recursive: true });
  writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
}

async function updateProfile(page) {
  const asset = join(ASSET_DIR, "profile-header-1920x1006.png");
  if (!existsSync(asset)) throw new Error(`profile header asset がありません: ${asset}`);
  await page.goto("https://note.com/settings/profile", { waitUntil: "domcontentloaded", timeout: 30_000 });
  await page.waitForTimeout(1_800);
  await page.locator("#headerImage").setInputFiles(asset);
  await page.getByRole("button", { name: "この画像を使う", exact: true }).click();
  await page.waitForTimeout(800);
  await page.getByRole("button", { name: "保存", exact: true }).click();
  await page.waitForTimeout(2_000);
}

async function updateMagazine(page, magazine, before) {
  const asset = join(ASSET_DIR, `magazine-${magazine.key}-1920x1006.png`);
  const needsCover = before.defaultCover;
  const replaceDescription = needsDescriptionUpdate(before.description);
  const needsText = before.name !== magazine.name || replaceDescription;
  if (needsCover && !existsSync(asset)) throw new Error(`magazine cover asset がありません: ${asset}`);
  await page.goto(`${magazine.noteUrl}/edit`, { waitUntil: "domcontentloaded", timeout: 30_000 });
  await page.waitForTimeout(1_500);
  if (needsCover) {
    await page.locator('input[type="file"]').setInputFiles(asset);
    await page.getByRole("button", { name: "この画像を使う", exact: true }).click();
    await page.waitForTimeout(700);
  }
  if (before.name !== magazine.name) await page.locator('input[type="text"]').last().fill(magazine.name);
  if (replaceDescription) await page.locator("textarea").first().fill(magazine.description);
  if (needsCover || needsText) {
    await page.getByRole("button", { name: "更新", exact: true }).click();
    // 1920px画像の crop → upload → magazine PUT は10秒超かかることがある。
    // 「処理中」が消え「更新」へ戻る前に context を閉じると upload が中断される。
    await page.getByRole("button", { name: "更新", exact: true }).waitFor({
      state: "visible",
      timeout: 45_000,
    });
    await page.waitForTimeout(700);
  }
}

async function verifyWithRetry(fetcher, predicate) {
  let current;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    current = await fetcher();
    if (predicate(current)) return current;
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 1_500));
  }
  throw new Error(`公開API検証に失敗: ${JSON.stringify(current)}`);
}

async function main() {
  const magazines = catalog().filter((magazine) => magazine.noteUrl);
  const profile = await fetchProfile();
  const entries = [];
  for (const magazine of magazines) {
    const before = await fetchMagazine(magazine);
    entries.push({
      key: magazine.key,
      noteUrl: magazine.noteUrl,
      before,
      needsCover: before.defaultCover,
      needsName: before.name !== magazine.name,
      needsDescription: needsDescriptionUpdate(before.description),
      preservedLiveDescription: before.description !== magazine.description && !needsDescriptionUpdate(before.description),
    });
  }
  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    account: "stats47",
    mode: COMMIT ? "commit" : "audit-only",
    profile: { beforeHeaderImageUrl: profile.headerImageUrl || null, needsHeader: !profile.headerImageUrl },
    magazines: entries,
  };
  save(report);
  console.log(`audit: profile=${report.profile.needsHeader ? "missing" : "ok"} covers=${entries.filter((entry) => entry.needsCover).length} text=${entries.filter((entry) => entry.needsName || entry.needsDescription).length}`);
  console.log(`report: ${REPORT_PATH}`);
  if (!COMMIT) return;

  const ctx = await launchContext({ headless: true });
  try {
    console.log(`account gate: ${await assertAccount(ctx)}`);
    const page = ctx.pages()[0] || await ctx.newPage();
    if (report.profile.needsHeader) await updateProfile(page);
    const verifiedProfile = await verifyWithRetry(
      () => fetchProfile(ctx.request),
      (value) => value.urlname === "stats47" && Boolean(value.headerImageUrl),
    );
    report.profile.afterHeaderImageUrl = verifiedProfile.headerImageUrl;
    report.profile.status = "verified";
    save(report);

    let consecutiveFailures = 0;
    for (const entry of entries) {
      if (!entry.needsCover && !entry.needsName && !entry.needsDescription) {
        entry.status = "already_compliant";
        continue;
      }
      const magazine = magazines.find((candidate) => candidate.key === entry.key);
      try {
        await updateMagazine(page, magazine, entry.before);
        const after = await verifyWithRetry(
          () => fetchMagazine(magazine, ctx.request),
          (value) => !value.defaultCover
            && value.name === magazine.name
            && (!entry.needsDescription || value.description === magazine.description),
        );
        entry.after = after;
        entry.status = "updated";
        consecutiveFailures = 0;
        console.log(`${entry.key}: updated`);
      } catch (error) {
        entry.status = "failed";
        entry.error = error.message;
        consecutiveFailures += 1;
        console.error(`${entry.key}: FAIL ${error.message}`);
        if (consecutiveFailures >= 3) break;
      } finally {
        report.generatedAt = new Date().toISOString();
        save(report);
      }
    }
  } finally {
    await ctx.close();
  }
  if (entries.some((entry) => entry.status === "failed")) process.exitCode = 1;
}

await main();
