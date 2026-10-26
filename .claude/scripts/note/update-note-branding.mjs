#!/usr/bin/env node

/**
 * note.com/stats47 のプロフィールヘッダーとマガジン基本情報を catalog に同期する。
 * 既定は audit-only。外部書き込みは --commit が必須。
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { assertAccount, launchContext, UA } from "./lib/note-session.mjs";
import { datasetDir,datasetPath } from "../../../config/datasets.mjs";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(SCRIPT_DIR, "../../..");
const RUN_DATE = new Date().toISOString().slice(0, 10);
const ASSET_DIR = join(ROOT, "assets/note/brand-headers/generated");
const REPORT_PATH = join(ROOT, datasetDir("note.operation-evidence"), `note-branding-update-${RUN_DATE}.json`);
const COMMIT = process.argv.includes("--commit");
const DEFAULT_COVER = /\/assets\/default\/default_magazine_header/;

function needsDescriptionUpdate(value) {
  return !String(value || "").trim() || /未作成|準備中/.test(String(value));
}

function catalog() {
  return JSON.parse(readFileSync(join(ROOT,datasetPath('note.magazines')),'utf8')).magazines;
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
  if (before.defaultCover) throw new Error('Magazine images require archived review and --reviewed-covers --keys');
  const replaceDescription = needsDescriptionUpdate(before.description);
  const needsText = before.name !== magazine.name || replaceDescription;
  await page.goto(`${magazine.noteUrl}/edit`, { waitUntil: "domcontentloaded", timeout: 30_000 });
  await page.waitForTimeout(1_500);
  if (before.name !== magazine.name) await page.locator('input[type="text"]').last().fill(magazine.name);
  if (replaceDescription) await page.locator("textarea").first().fill(magazine.description);
  if (needsText) {
    await page.getByRole("button", { name: "更新", exact: true }).click();
    // Wait for the native update before closing the browser context.
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
  if (process.argv.includes('--reviewed-covers')) return replaceReviewedCovers();
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
  if (entries.some((entry) => entry.needsCover)) throw new Error('未設定のマガジンカバーは、画像台帳で採用後に --reviewed-covers --keys で公開してください');

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

/** Replace only reviewed magazine images; names, descriptions and profile are untouched. */
async function replaceReviewedCovers() {
  const ledgerPath=join(ROOT,datasetDir('ogp.inventory'),'link-card-rollout.json');
  const ledger=JSON.parse(readFileSync(ledgerPath,'utf8'));
  const keyIndex=process.argv.indexOf('--keys');
  if(keyIndex<0 || !process.argv[keyIndex+1]) throw Error('--reviewed-covers requires explicit --keys');
  const keys=process.argv[keyIndex+1].split(',');
  if(new Set(keys).size!==keys.length)throw Error('Duplicate keys');
  const magazines=catalog();
  const hash=(b)=>createHash('sha256').update(b).digest('hex');
  const entries=keys.map(key=>{
    const e=ledger.entries.find(e=>e.id===`magazine:${key}`);
    const m=magazines.find(m=>m.key===key);
    if(!e||!m?.noteUrl||e.pageUrl!==m.noteUrl)throw Error(`Unknown target ${key}`);
    if(e.status==='published')return {entry:e,magazine:m,skip:true};
    if(e.publication?.status==='uploading')throw Error(`Uncertain prior upload: reconcile ${key} before retrying`);
    if(e.status!=='reviewed'||!e.revision?.image||!e.revision?.review||!e.revision?.input)throw Error(`Unreviewed target ${key}`);
    const asset=e.candidate?.file;
    if(!asset||hash(readFileSync(asset))!==e.revision.image.sha256)throw Error(`Asset SHA mismatch ${key}`);
    return {entry:e,magazine:m,asset};
  });
  console.log(JSON.stringify({mode:COMMIT?'commit':'audit-only',keys:entries.map(v=>v.entry.key),skipped:entries.filter(v=>v.skip).length}));
  if(!COMMIT)return;
  const ctx=await launchContext({headless:true});
  const saveLedger=()=>{ledger.updatedAt=new Date().toISOString();writeFileSync(`${ledgerPath}.pending`,JSON.stringify(ledger,null,2)+'\n');};
  try {
    console.log(`account gate: ${await assertAccount(ctx)}`);
    const page=ctx.pages()[0]||await ctx.newPage();
    const live=async(m)=>{
      if(new URL(page.url()).origin!=='https://note.com')await page.goto(m.noteUrl,{waitUntil:'domcontentloaded'});
      return page.evaluate(async(key)=>{
        const response=await fetch(`/api/v1/magazines/${key}/notes?page=1&coverCheck=${Date.now()}`);
        if(!response.ok)throw Error(`HTTP ${response.status}`);
        const d=(await response.json()).data;
        return {name:d.name,description:d.description,cover:d.cover};
      },magazineNoteKey(m.noteUrl));
    };
    for(const item of entries) {
      if(item.skip)continue;
      const {entry:e,magazine:m,asset}=item;
      const before=await live(m);
      if(!before.cover||!before.name)throw Error('Incomplete before state');
      e.publication={startedAt:new Date().toISOString(),before,expectedSha256:e.revision.image.sha256,status:'uploading'};
      saveLedger();
      // Journal before the external mutation. A failed/unknown upload is never auto-retried.
      const {renameSync}=await import('node:fs'); renameSync(`${ledgerPath}.pending`,ledgerPath);
      await page.goto(`${m.noteUrl}/edit`,{waitUntil:'domcontentloaded',timeout:30000});
      await page.locator('input[type="file"]').setInputFiles(asset);
      await page.getByRole('button',{name:'この画像を使う',exact:true}).click();
      await page.getByRole('button',{name:'更新',exact:true}).click();
      await page.getByRole('button',{name:'更新',exact:true}).waitFor({state:'visible',timeout:45000});
      const after=await verifyWithRetry(()=>live(m),v=>v.cover!==before.cover&&v.name===before.name&&v.description===before.description);
      const {fetchCoverSource}=await import('./lib/cover-storage.mjs');
      const published=await fetchCoverSource(after.cover);
      const sharp=(await import('sharp')).default;
      const dimensions=await sharp(published).metadata();
      if(!dimensions.width||!dimensions.height)throw Error('Published image unreadable');
      e.publication={...e.publication,status:'uploaded-awaiting-visual-check',after,verifiedAt:new Date().toISOString(),servedSha256:hash(published),width:dimensions.width,height:dimensions.height};
      e.status='published-pending-visual'; saveLedger();renameSync(`${ledgerPath}.pending`,ledgerPath);
      const evidenceDir=join(ROOT,datasetDir('note.operation-evidence'));
      mkdirSync(evidenceDir,{recursive:true});
      writeFileSync(join(evidenceDir,`note-magazine-cover-${e.key}.json`),JSON.stringify(e.publication,null,2)+'\n');
      console.log(`${e.key}: image URL changed; name/description preserved; visual verification pending`);
    }
  } finally {await ctx.close();}
}

await main();
