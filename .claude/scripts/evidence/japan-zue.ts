#!/usr/bin/env tsx

import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  JAPAN_ZUE_EDITION,
  JAPAN_ZUE_EVIDENCE_ITEMS,
  JAPAN_ZUE_SOURCE_KEY,
  assertJapanZueEvidenceItems,
  auditJapanZueCorrections,
  auditJapanZueStructure,
  auditJapanZueLineage,
  auditJapanZueExpressionSimilarity,
  buildJapanZueMappingQueue,
  buildJapanZueReviewQueue,
  diffJapanZueCandidates,
  extractJapanZueCandidates,
  findJapanZueRuntimeSourceReferences,
  suggestJapanZueMetricMatches,
  suggestJapanZueSourceMatches,
  summarizeJapanZueCoverage,
  validateJapanZueCandidateDocument,
  type JapanZueCandidateDocument,
  type JapanZueMarkdownPage,
} from "@stats47/data-configs/evidence-inventory";

type SourceManifest = {
  sourceKey: string;
  edition: string;
  bundle: { sha256: string };
  files: Array<{ path: string; bytes: number; sha256: string }>;
};

type CliOptions = {
  source: string;
  edition: string;
  sourceRoot: string;
  manifest: string;
  stateDir: string;
  pageStart: number;
  pageEnd: number;
  dryRun: boolean;
  check: boolean;
  contentRoots: string[];
};

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, "../../..");
const DEFAULT_STATE_DIR = path.join(PROJECT_ROOT, ".claude/state/source-inventory/japan-zue/2025-26");
const DEFAULT_MANIFEST = path.join(DEFAULT_STATE_DIR, "source-bundle-manifest.json");
const DEFAULT_SOURCE_ROOT = path.join(PROJECT_ROOT, "books/日本国勢図絵");
const DEFAULT_CONTENT_ROOTS = [
  path.join(PROJECT_ROOT, "apps/web/src"),
  path.join(PROJECT_ROOT, "apps/remotion/src"),
  path.join(PROJECT_ROOT, "docs/21_ブログ記事原稿"),
  path.join(PROJECT_ROOT, "docs/31_note記事原稿"),
];
const TEXT_EXTENSIONS = new Set([".md", ".mdx", ".ts", ".tsx", ".json", ".txt"]);
const MAX_AUDIT_FILE_BYTES = 2 * 1024 * 1024;

function flagValue(argv: readonly string[], name: string): string | undefined {
  const inline = argv.find((entry) => entry.startsWith(`--${name}=`));
  if (inline) return inline.slice(name.length + 3);
  const index = argv.indexOf(`--${name}`);
  if (index >= 0) return argv[index + 1];
  const npmValue = process.env[`npm_config_${name.replace(/-/g, "_")}`];
  if (npmValue === undefined) return undefined;
  if (npmValue !== "true") return npmValue;
  if (name === "source") return argv.find((entry) => entry === JAPAN_ZUE_SOURCE_KEY);
  if (name === "edition") return argv.find((entry) => /^\d{4}-\d{2}$/.test(entry));
  throw new Error(
    `npm stripped the value for --${name}; pass it as --${name}=<value> or add a second -- before the option`,
  );
}

function integerFlag(argv: readonly string[], name: string, fallback: number): number {
  const raw = flagValue(argv, name);
  if (raw === undefined) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value)) throw new Error(`--${name} must be an integer`);
  return value;
}

function booleanFlag(argv: readonly string[], name: string): boolean {
  if (argv.includes(`--${name}`)) return true;
  return process.env[`npm_config_${name.replace(/-/g, "_")}`] === "true";
}

function parseOptions(argv: readonly string[]): CliOptions {
  const contentRoots = flagValue(argv, "content-roots")
    ?.split(",")
    .filter(Boolean)
    .map((entry) => path.resolve(PROJECT_ROOT, entry));
  return {
    source: flagValue(argv, "source") ?? JAPAN_ZUE_SOURCE_KEY,
    edition: flagValue(argv, "edition") ?? JAPAN_ZUE_EDITION,
    sourceRoot: path.resolve(PROJECT_ROOT, flagValue(argv, "source-root") ?? DEFAULT_SOURCE_ROOT),
    manifest: path.resolve(PROJECT_ROOT, flagValue(argv, "manifest") ?? DEFAULT_MANIFEST),
    stateDir: path.resolve(PROJECT_ROOT, flagValue(argv, "state-dir") ?? DEFAULT_STATE_DIR),
    pageStart: integerFlag(argv, "page-start", 26),
    pageEnd: integerFlag(argv, "page-end", 529),
    dryRun: booleanFlag(argv, "dry-run"),
    check: booleanFlag(argv, "check"),
    contentRoots: contentRoots ?? DEFAULT_CONTENT_ROOTS,
  };
}

function assertSupported(options: CliOptions): void {
  if (options.source !== JAPAN_ZUE_SOURCE_KEY) throw new Error(`Unsupported source: ${options.source}`);
  if (options.edition !== JAPAN_ZUE_EDITION) throw new Error(`Unsupported edition: ${options.edition}`);
  if (options.pageStart < 1 || options.pageEnd < options.pageStart) throw new Error("Invalid page range");
}

function sha256(content: Buffer | string): string {
  return createHash("sha256").update(content).digest("hex");
}

async function readManifest(options: CliOptions): Promise<SourceManifest> {
  const manifest = JSON.parse(await readFile(options.manifest, "utf8")) as SourceManifest;
  if (manifest.sourceKey !== options.source || manifest.edition !== options.edition) {
    throw new Error("Manifest source/edition mismatch");
  }
  return manifest;
}

async function readVerifiedPages(options: CliOptions, manifest: SourceManifest): Promise<JapanZueMarkdownPage[]> {
  if (!existsSync(options.sourceRoot)) throw new Error(`Source root is missing: ${options.sourceRoot}`);
  const manifestByPath = new Map(manifest.files.map((entry) => [entry.path.replace(/\\/g, "/"), entry]));
  const pages: JapanZueMarkdownPage[] = [];
  for (let page = options.pageStart; page <= options.pageEnd; page += 1) {
    const markdownPath = `md/p${String(page).padStart(3, "0")}.md`;
    const expected = manifestByPath.get(markdownPath);
    if (!expected) throw new Error(`Manifest page is missing: ${markdownPath}`);
    const absolutePath = path.join(options.sourceRoot, ...markdownPath.split("/"));
    const content = await readFile(absolutePath);
    if (content.byteLength !== expected.bytes || sha256(content) !== expected.sha256) {
      throw new Error(`Source page integrity mismatch: ${markdownPath}`);
    }
    pages.push({ page, markdownPath, content: content.toString("utf8") });
  }
  return pages;
}

async function writeJson(target: string, value: unknown): Promise<void> {
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function extractionSummary(document: JapanZueCandidateDocument): Record<string, unknown> {
  const byKind = { table: 0, figure: 0, "text-stat": 0 };
  for (const candidate of document.candidates) byKind[candidate.source.kind] += 1;
  return {
    schemaVersion: 1,
    sourceKey: document.sourceKey,
    edition: document.edition,
    sourceBundleSha256: document.sourceBundleSha256,
    pageRange: document.pageRange,
    pagesScanned: document.pagesScanned.length,
    candidateCount: document.candidates.length,
    byKind,
  };
}

async function extract(options: CliOptions): Promise<void> {
  const manifest = await readManifest(options);
  const pages = await readVerifiedPages(options, manifest);
  const candidates = extractJapanZueCandidates(pages, options.edition);
  const document: JapanZueCandidateDocument = {
    schemaVersion: 1,
    sourceKey: JAPAN_ZUE_SOURCE_KEY,
    edition: options.edition,
    sourceBundleSha256: manifest.bundle.sha256,
    pageRange: { start: options.pageStart, end: options.pageEnd },
    pagesScanned: pages.map(({ page }) => page),
    candidates,
  };
  const summary = extractionSummary(document);
  if (!options.dryRun) {
    await writeJson(path.join(options.stateDir, "candidates.json"), document);
    await writeJson(path.join(options.stateDir, "summary.json"), summary);
  }
  console.log(JSON.stringify({ ...summary, dryRun: options.dryRun }, null, 2));
}

async function readCandidateDocument(options: CliOptions): Promise<JapanZueCandidateDocument> {
  return JSON.parse(await readFile(path.join(options.stateDir, "candidates.json"), "utf8")) as JapanZueCandidateDocument;
}

async function validate(options: CliOptions): Promise<void> {
  assertJapanZueEvidenceItems(JAPAN_ZUE_EVIDENCE_ITEMS);
  const { CATEGORIES, METRICS_REGISTRY, THEME_CATALOGS } = await import("@stats47/data-configs");
  const surveys = JSON.parse(
    await readFile(path.join(PROJECT_ROOT, "packages/ranking/src/data/surveys.json"), "utf8"),
  ) as Array<{ id: string }>;
  const lineage = auditJapanZueLineage(JAPAN_ZUE_EVIDENCE_ITEMS, {
    metricKeys: new Set(Object.keys(METRICS_REGISTRY)),
    surveyIds: new Set(surveys.map(({ id }) => id)),
    themeSlugs: new Set(Object.keys(THEME_CATALOGS)),
    categoryKeys: new Set(CATEGORIES.map(({ categoryKey }) => categoryKey)),
  });
  const result: Record<string, unknown> = {
    inventoryCount: JAPAN_ZUE_EVIDENCE_ITEMS.length,
    structuralErrors: 0,
    lineage,
  };
  if (existsSync(path.join(options.stateDir, "candidates.json"))) {
    const document = await readCandidateDocument(options);
    const candidateErrors = validateJapanZueCandidateDocument(document);
    if (candidateErrors.length > 0) {
      throw new Error(`Candidate validation failed:\n${candidateErrors.join("\n")}`);
    }
    result.coverage = summarizeJapanZueCoverage(document.candidates, JAPAN_ZUE_EVIDENCE_ITEMS, document.edition);
  }
  console.log(JSON.stringify(result, null, 2));
  if (!lineage.isClean) process.exitCode = 1;
}

async function coverage(options: CliOptions): Promise<void> {
  assertJapanZueEvidenceItems(JAPAN_ZUE_EVIDENCE_ITEMS);
  const document = await readCandidateDocument(options);
  const summary = summarizeJapanZueCoverage(document.candidates, JAPAN_ZUE_EVIDENCE_ITEMS, document.edition);
  if (!options.dryRun) await writeJson(path.join(options.stateDir, "summary.json"), summary);
  console.log(JSON.stringify(summary, null, 2));
  if (options.check && !summary.isComplete) process.exitCode = 1;
}

async function structureAudit(options: CliOptions): Promise<void> {
  const manifest = await readManifest(options);
  const pages = await readVerifiedPages(options, manifest);
  const document = await readCandidateDocument(options);
  const result = auditJapanZueStructure(document, pages);
  if (!options.dryRun) await writeJson(path.join(options.stateDir, "structure-audit.json"), result);
  console.log(JSON.stringify(result, null, 2));
  if (options.check && (!result.isPageCoverageClean || !result.isSourceScopeComplete)) process.exitCode = 1;
}

async function reviewQueue(options: CliOptions): Promise<void> {
  const manifest = await readManifest(options);
  const [pages, document] = await Promise.all([
    readVerifiedPages(options, manifest),
    readCandidateDocument(options),
  ]);
  const candidateErrors = validateJapanZueCandidateDocument(document);
  if (candidateErrors.length > 0) throw new Error(`Candidate validation failed:\n${candidateErrors.join("\n")}`);
  const result = buildJapanZueReviewQueue(document.candidates, pages, document.edition);
  if (!options.dryRun) await writeJson(path.join(options.stateDir, "review-queue.json"), result);
  const { groups: _groups, ...summary } = result;
  console.log(JSON.stringify(summary, null, 2));
  if (options.check && !result.isComplete) process.exitCode = 1;
}

async function metricSuggestions(options: CliOptions): Promise<void> {
  const manifest = await readManifest(options);
  const [pages, document, dataConfigs] = await Promise.all([
    readVerifiedPages(options, manifest),
    readCandidateDocument(options),
    import("@stats47/data-configs"),
  ]);
  const queue = buildJapanZueReviewQueue(document.candidates, pages, document.edition);
  const metrics = Object.values(dataConfigs.METRICS_REGISTRY).map((metric) => ({
    key: metric.key,
    title: metric.title,
    subtitle: metric.subtitle,
    surveyIds: dataConfigs
      .resolveMetricProvenance(metric, dataConfigs.METRICS_REGISTRY)
      .map(({ id }) => id),
  }));
  const surveys = JSON.parse(
    await readFile(path.join(PROJECT_ROOT, "packages/ranking/src/data/surveys.json"), "utf8"),
  ) as Array<{ id: string; name: string }>;
  const sourceSuggestions = suggestJapanZueSourceMatches(queue, pages, surveys);
  const result = suggestJapanZueMetricMatches(queue, document.candidates, pages, metrics, sourceSuggestions);
  if (!options.dryRun) await writeJson(path.join(options.stateDir, "metric-suggestions.json"), result);
  const { suggestions: _suggestions, ...summary } = result;
  console.log(JSON.stringify(summary, null, 2));
}

async function sourceSuggestions(options: CliOptions): Promise<void> {
  const manifest = await readManifest(options);
  const [pages, document, surveys] = await Promise.all([
    readVerifiedPages(options, manifest),
    readCandidateDocument(options),
    readFile(path.join(PROJECT_ROOT, "packages/ranking/src/data/surveys.json"), "utf8").then(
      (content) => JSON.parse(content) as Array<{ id: string; name: string }>,
    ),
  ]);
  const queue = buildJapanZueReviewQueue(document.candidates, pages, document.edition);
  const result = suggestJapanZueSourceMatches(queue, pages, surveys);
  if (!options.dryRun) await writeJson(path.join(options.stateDir, "source-suggestions.json"), result);
  const { suggestions: _suggestions, unmatchedDirectGroupIds: _unmatched, ...summary } = result;
  console.log(JSON.stringify(summary, null, 2));
  if (options.check && (!result.isCatalogClean || result.ambiguousGroupIds.length > 0)) process.exitCode = 1;
}

async function mappingQueue(options: CliOptions): Promise<void> {
  const manifest = await readManifest(options);
  const [pages, document, dataConfigs, surveys] = await Promise.all([
    readVerifiedPages(options, manifest),
    readCandidateDocument(options),
    import("@stats47/data-configs"),
    readFile(path.join(PROJECT_ROOT, "packages/ranking/src/data/surveys.json"), "utf8").then(
      (content) => JSON.parse(content) as Array<{ id: string; name: string }>,
    ),
  ]);
  const review = buildJapanZueReviewQueue(document.candidates, pages, document.edition);
  const source = suggestJapanZueSourceMatches(review, pages, surveys);
  const metrics = Object.values(dataConfigs.METRICS_REGISTRY).map((metric) => ({
    key: metric.key,
    title: metric.title,
    subtitle: metric.subtitle,
    surveyIds: dataConfigs
      .resolveMetricProvenance(metric, dataConfigs.METRICS_REGISTRY)
      .map(({ id }) => id),
  }));
  const metric = suggestJapanZueMetricMatches(review, document.candidates, pages, metrics, source);
  const result = buildJapanZueMappingQueue(review, source, metric, JAPAN_ZUE_EVIDENCE_ITEMS);
  if (!options.dryRun) await writeJson(path.join(options.stateDir, "mapping-queue.json"), result);
  const { entries: _entries, ...summary } = result;
  console.log(JSON.stringify(summary, null, 2));
  if (options.check && !result.isComplete) process.exitCode = 1;
}

async function correctionAudit(options: CliOptions): Promise<void> {
  const document = await readCandidateDocument(options);
  const result = auditJapanZueCorrections(document.candidates, undefined, document.edition);
  if (!options.dryRun) await writeJson(path.join(options.stateDir, "correction-audit.json"), result);
  console.log(JSON.stringify(result, null, 2));
  if (options.check && !result.isClean) process.exitCode = 1;
}

async function collectTextFiles(roots: readonly string[]): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  const visit = async (entryPath: string): Promise<void> => {
    if (!existsSync(entryPath)) return;
    const info = await stat(entryPath);
    if (info.isDirectory()) {
      const children = await readdir(entryPath, { withFileTypes: true });
      for (const child of children) {
        if (child.name === "node_modules" || child.name.startsWith(".")) continue;
        await visit(path.join(entryPath, child.name));
      }
      return;
    }
    if (!TEXT_EXTENSIONS.has(path.extname(entryPath).toLowerCase()) || info.size > MAX_AUDIT_FILE_BYTES) return;
    result[path.relative(PROJECT_ROOT, entryPath).replace(/\\/g, "/")] = await readFile(entryPath, "utf8");
  };
  for (const root of roots) await visit(root);
  return result;
}

async function expressionAudit(options: CliOptions): Promise<void> {
  const manifest = await readManifest(options);
  const pages = await readVerifiedPages(options, manifest);
  const publicFiles = await collectTextFiles(options.contentRoots);
  const sources = Object.fromEntries(pages.map(({ markdownPath, content }) => [markdownPath, content]));
  const runtimeReferences = findJapanZueRuntimeSourceReferences(publicFiles);
  const expressionMatches = auditJapanZueExpressionSimilarity(sources, publicFiles);
  const result = {
    sourcePages: pages.length,
    publicFiles: Object.keys(publicFiles).length,
    runtimeReferences,
    expressionMatches,
    isClean: runtimeReferences.length === 0 && expressionMatches.length === 0,
  };
  console.log(JSON.stringify(result, null, 2));
  if (options.check && !result.isClean) process.exitCode = 1;
}

async function diffCandidates(argv: readonly string[]): Promise<void> {
  const previousPath = flagValue(argv, "previous");
  const nextPath = flagValue(argv, "next");
  if (!previousPath || !nextPath) throw new Error("diff requires --previous=<candidates.json> and --next=<candidates.json>");
  const [previous, next] = await Promise.all(
    [previousPath, nextPath].map(async (entry) =>
      JSON.parse(await readFile(path.resolve(PROJECT_ROOT, entry), "utf8")) as JapanZueCandidateDocument,
    ),
  );
  const validationErrors = [
    ...validateJapanZueCandidateDocument(previous).map((error) => `previous: ${error}`),
    ...validateJapanZueCandidateDocument(next).map((error) => `next: ${error}`),
  ];
  if (validationErrors.length > 0) throw new Error(`Candidate diff validation failed:\n${validationErrors.join("\n")}`);
  const result = diffJapanZueCandidates(previous, next, JAPAN_ZUE_EVIDENCE_ITEMS);
  const outputPath = flagValue(argv, "out");
  if (outputPath) await writeJson(path.resolve(PROJECT_ROOT, outputPath), result);
  console.log(JSON.stringify(result, null, 2));
}

async function main(): Promise<void> {
  const [command, ...argv] = process.argv.slice(2);
  if (command === "diff") return diffCandidates(argv);
  const options = parseOptions(argv);
  assertSupported(options);
  if (command === "extract") return extract(options);
  if (command === "validate") return validate(options);
  if (command === "coverage") return coverage(options);
  if (command === "structure-audit") return structureAudit(options);
  if (command === "review-queue") return reviewQueue(options);
  if (command === "metric-suggestions") return metricSuggestions(options);
  if (command === "source-suggestions") return sourceSuggestions(options);
  if (command === "mapping-queue") return mappingQueue(options);
  if (command === "correction-audit") return correctionAudit(options);
  if (command === "expression-audit") return expressionAudit(options);
  throw new Error("Usage: japan-zue.ts <extract|validate|coverage|structure-audit|review-queue|metric-suggestions|source-suggestions|mapping-queue|correction-audit|expression-audit|diff> [options]");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
