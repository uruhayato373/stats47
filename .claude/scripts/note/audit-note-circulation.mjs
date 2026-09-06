#!/usr/bin/env node

/**
 * note.com/stats47 の公開記事・マガジン・プロフィールを catalog と突合する read-only 監査。
 *
 * Usage:
 *   node .claude/scripts/note/audit-note-circulation.mjs
 *   node .claude/scripts/note/audit-note-circulation.mjs --no-link-check --report-only
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildArticleAudit,
  buildProfileAudit,
  extractNavigationUrls,
  isStats47SiteUrl,
  magazineKeyFromUrl,
  noteKeyFromUrl,
  summarizeArticleAudits,
  unique,
} from "./lib/circulation-audit.mjs";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(SCRIPT_DIR, "../../..");
const args = process.argv.slice(2);
const RUN_DATE = new Date().toISOString().slice(0, 10);
const outputArg = args.includes("--output") ? args[args.indexOf("--output") + 1] : null;
const OUTPUT = resolve(outputArg || join(ROOT, ".claude/state/metrics", `note-circulation-audit-${RUN_DATE}.json`));
const CHECK_LINKS = !args.includes("--no-link-check");
const REPORT_ONLY = args.includes("--report-only");
const UA = "stats47-note-circulation-audit/1.0";

function loadCatalog() {
  const raw = execFileSync(
    "npx",
    ["tsx", join(ROOT, ".claude/scripts/note/catalog/dump-circulation-json.ts")],
    { cwd: ROOT, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 },
  );
  return JSON.parse(raw);
}

async function fetchWithRetry(url, options = {}, attempts = 4) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: { "user-agent": UA, ...(options.headers || {}) },
        signal: AbortSignal.timeout(20_000),
      });
      return response;
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await new Promise((done) => setTimeout(done, attempt * 500));
    }
  }
  throw lastError;
}

async function fetchJson(url) {
  const response = await fetchWithRetry(url);
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response.json();
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

async function fetchLiveNote(article) {
  const noteKey = noteKeyFromUrl(article.noteUrl);
  if (!noteKey) throw new Error(`${article.key}: note URL が不正 ${article.noteUrl}`);
  const json = await fetchJson(`https://note.com/api/v3/notes/${noteKey}?audit=${Date.now()}`);
  if (!json?.data) throw new Error(`${article.key}: note API data なし`);
  return json.data;
}

async function fetchMagazine(magazine) {
  const noteKey = magazineKeyFromUrl(magazine.noteUrl);
  if (!noteKey) return { catalogKey: magazine.key, noteKey: null, notes: [], missing: true };
  const notes = [];
  let metadata = null;
  for (let page = 1; page <= 100; page += 1) {
    const json = await fetchJson(`https://note.com/api/v1/magazines/${noteKey}/notes?page=${page}`);
    const data = json?.data || {};
    metadata ||= data;
    const pageNotes = Array.isArray(data.notes) ? data.notes : [];
    notes.push(...pageNotes);
    if (pageNotes.length === 0 || data.isLastPage || notes.length >= Number(data.note_count || 0)) break;
  }
  return {
    catalogKey: magazine.key,
    noteKey,
    name: metadata?.name || null,
    description: metadata?.description || null,
    status: metadata?.status || null,
    declaredCount: Number(metadata?.note_count || 0),
    actualCount: notes.length,
    memberNoteKeys: unique(notes.map((note) => note.key)),
    firstMemberNoteKey: notes[0]?.key || null,
    defaultCover: /\/assets\/default\/default_magazine_header/.test(metadata?.cover || ""),
    cover: metadata?.cover || null,
  };
}

async function checkSiteLink(url) {
  try {
    const initial = await fetchWithRetry(url, { method: "HEAD", redirect: "manual" }, 2);
    const redirected = initial.status >= 300 && initial.status < 400;
    let finalUrl = url;
    let finalStatus = initial.status;
    if (redirected) {
      const location = initial.headers.get("location");
      finalUrl = location ? new URL(location, url).href : url;
      const final = await fetchWithRetry(finalUrl, { method: "HEAD", redirect: "follow" }, 2);
      finalStatus = final.status;
      finalUrl = final.url || finalUrl;
    }
    return { status: initial.status, finalStatus, finalUrl, redirected };
  } catch (error) {
    return { status: 0, finalStatus: 0, finalUrl: url, redirected: false, error: String(error) };
  }
}

const catalog = loadCatalog();
const magazinesByKey = new Map(catalog.magazines.map((magazine) => [magazine.key, magazine]));
const catalogNoteKeys = new Set(catalog.articles.map((article) => noteKeyFromUrl(article.noteUrl)).filter(Boolean));
const articleNoteKeyByCatalogKey = new Map(
  catalog.articles.map((article) => [article.key, noteKeyFromUrl(article.noteUrl)]),
);

console.log(`[note-circulation] live note 取得: ${catalog.articles.length}記事`);
const liveNotes = await mapConcurrent(catalog.articles, 6, fetchLiveNote);
const liveByArticleKey = new Map(catalog.articles.map((article, index) => [article.key, liveNotes[index]]));

const allSiteLinks = unique(
  liveNotes.flatMap((note) => extractNavigationUrls(note.body, note.embedded_contents).filter(isStats47SiteUrl)),
);
const linkHealthByUrl = new Map();
if (CHECK_LINKS) {
  console.log(`[note-circulation] stats47 リンク確認: ${allSiteLinks.length}URL`);
  const checks = await mapConcurrent(allSiteLinks, 8, checkSiteLink);
  allSiteLinks.forEach((url, index) => linkHealthByUrl.set(url, checks[index]));
}

console.log(`[note-circulation] live magazine 取得: ${catalog.magazines.filter((magazine) => magazine.noteUrl).length}件`);
const liveMagazines = await mapConcurrent(
  catalog.magazines.filter((magazine) => magazine.noteUrl),
  4,
  fetchMagazine,
);

const articleAudits = catalog.articles.map((article) => buildArticleAudit({
  article,
  live: liveByArticleKey.get(article.key),
  magazinesByKey,
  catalogNoteKeys,
  eligibleRelatedNoteKeys: new Set(
    article.magazine
      ? catalog.articles
        .filter((candidate) => candidate.key !== article.key && candidate.magazine === article.magazine)
        .map((candidate) => articleNoteKeyByCatalogKey.get(candidate.key))
        .filter(Boolean)
      : [],
  ),
  linkHealthByUrl,
}));

const catalogArticlesByNoteKey = new Map(
  catalog.articles.map((article) => [noteKeyFromUrl(article.noteUrl), article]),
);
const magazineAudits = liveMagazines.map((live) => {
  const expected = magazinesByKey.get(live.catalogKey);
  const expectedNoteKeys = new Set(
    expected.publishedMemberKeys.map((key) => {
      const article = catalog.articles.find((candidate) => candidate.key === key);
      return noteKeyFromUrl(article?.noteUrl);
    }).filter(Boolean),
  );
  const actualNoteKeys = new Set(live.memberNoteKeys);
  const missing = [...expectedNoteKeys].filter((key) => !actualNoteKeys.has(key));
  const unexpected = [...actualNoteKeys].filter((key) => !expectedNoteKeys.has(key));
  return {
    catalogKey: live.catalogKey,
    noteKey: live.noteKey,
    name: live.name,
    catalogName: expected.name,
    liveDescription: live.description,
    noteUrl: expected.noteUrl,
    expectedCount: expectedNoteKeys.size,
    actualCount: live.actualCount,
    missingMembers: missing.map((key) => ({ noteKey: key, catalogKey: catalogArticlesByNoteKey.get(key)?.key || null })),
    unexpectedMembers: unexpected.map((key) => ({ noteKey: key, catalogKey: catalogArticlesByNoteKey.get(key)?.key || null })),
    firstMemberNoteKey: live.firstMemberNoteKey,
    defaultCover: live.defaultCover,
    thin: live.actualCount < 3,
    nameMismatch: live.name !== expected.name,
    staleDescription: !String(live.description || "").trim() || /未作成|準備中/.test(String(live.description)),
  };
});

const profileJson = await fetchJson(`https://note.com/api/v2/creators/stats47?audit=${Date.now()}`);
const profile = buildProfileAudit(profileJson?.data);
if (profile.urlname !== "stats47") throw new Error(`profile account mismatch: ${profile.urlname || "unknown"}`);

const articleSummary = summarizeArticleAudits(articleAudits);
const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  account: "stats47",
  source: {
    catalog: ".claude/scripts/note/catalog/",
    live: "note.com public API",
    siteLinksChecked: CHECK_LINKS,
  },
  summary: {
    ...articleSummary,
    liveMagazines: liveMagazines.length,
    exactMagazineMemberships: magazineAudits.filter(
      (magazine) => magazine.missingMembers.length === 0 && magazine.unexpectedMembers.length === 0,
    ).length,
    defaultMagazineCovers: magazineAudits.filter((magazine) => magazine.defaultCover).length,
    thinMagazines: magazineAudits.filter((magazine) => magazine.thin).length,
    magazineMetadataWarnings: magazineAudits.filter(
      (magazine) => magazine.nameMismatch || magazine.staleDescription,
    ).length,
    profileWarnings: profile.warnings.length,
  },
  profile,
  linkHealth: Object.fromEntries(linkHealthByUrl),
  magazines: magazineAudits,
  articles: articleAudits,
};

mkdirSync(dirname(OUTPUT), { recursive: true });
const temporaryOutput = `${OUTPUT}.tmp`;
writeFileSync(temporaryOutput, `${JSON.stringify(report, null, 2)}\n`);
renameSync(temporaryOutput, OUTPUT);

console.log("\n=== note circulation audit ===");
console.log(`articles: ${articleSummary.total}`);
console.log(`errors: ${articleSummary.errors} / warnings: ${articleSummary.warnings}`);
console.log(`site link: ${articleSummary.withSiteLink}/${articleSummary.total}`);
console.log(`related note: ${articleSummary.withRelatedNoteLink}/${articleSummary.total}`);
console.log(`magazine link: ${articleSummary.withMagazineLink}/${articleSummary.total}`);
console.log(`hashtag >=95: ${articleSummary.compliantHashtags}/${articleSummary.total}`);
console.log(`magazine exact: ${report.summary.exactMagazineMemberships}/${liveMagazines.length}`);
console.log(`report: ${OUTPUT}`);

if (!REPORT_ONLY && articleSummary.errors > 0) process.exitCode = 1;
