import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  METRICS_REGISTRY,
} from "../../src/registry";
import { THEME_CATALOGS } from "../../src/theme-catalog";
import { resolveMetricProvenance } from "../../src/provenance/resolve-metric-provenance";
import type { MetricConfig } from "../../src/types";
import {
  JAPAN_ZUE_MANUAL_OVERRIDES,
  JAPAN_ZUE_POLICY_VERSION,
  JAPAN_ZUE_REVIEWED_AT,
  JAPAN_ZUE_SOURCE_POLICIES,
  resolveJapanZueCandidate,
  type MetricLineage,
} from "../../src/evidence-inventory/japan-zue/policy";
import {
  diffEvidenceInventory,
  evidenceLogicalKey,
  findExpressionMatches,
} from "../../src/evidence-inventory/japan-zue/audit";
import { JAPAN_ZUE_MASTER_CONTENT, JAPAN_ZUE_PILOT_ITEMS } from "../../src/evidence-inventory/japan-zue/pilot";
import type {
  EvidenceGeoScope,
  JapanZueCandidate,
  JapanZueEvidenceItem,
} from "../../src/evidence-inventory/types";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const SOURCE_KEY = "japan-zue";
const EDITION = "2025-26";
const SCHEMA_VERSION = 1;
const EXTRACTION_VERSION = 1;
const PAGE_START = 26;
const PAGE_END = 529;
const EXPECTED_PAGE_COUNT = PAGE_END - PAGE_START + 1;
const EXPECTED_COUNTS = { table: 757, figure: 201, "text-stat": 458 } as const;
const EXPECTED_TABLE_HEADINGS = 721;
const EXPECTED_TABLE_CONTINUATION_PAGES = 12;
const EXPECTED_TABLE_SUBITEMS_SELECTED = 48;
const EXPECTED_FIGURE_HEADINGS = 200;
const EXPECTED_CHAPTER_NUMBER_CORRECTIONS = 1;
const TABLE_SUBITEM_LIMIT = 48;
const TEXT_STAT_LIMIT = EXPECTED_COUNTS["text-stat"];
const STATE_DIR = path.join(PROJECT_ROOT, ".claude/state/source-inventory/japan-zue/2025-26");
const CANDIDATES_PATH = path.join(STATE_DIR, "candidates.json");
const SUMMARY_PATH = path.join(STATE_DIR, "evidence-summary.json");
const ITEMS_PATH = path.join(
  PROJECT_ROOT,
  "packages/data-configs/src/evidence-inventory/japan-zue/items.generated.ts",
);
const ITEM_SHARD_COUNT = 3;
const ITEM_SHARD_PATHS = Array.from({ length: ITEM_SHARD_COUNT }, (_, index) =>
  path.join(
    PROJECT_ROOT,
    `packages/data-configs/src/evidence-inventory/japan-zue/items.generated.${index}.ts`,
  ),
);
const SURVEYS_PATH = path.join(PROJECT_ROOT, "packages/ranking/src/data/surveys.json");
const EXPERIMENTS_PATH = path.join(PROJECT_ROOT, ".claude/state/experiments.json");
const SNS_POSTS_PATH = path.join(PROJECT_ROOT, ".claude/state/sns/posts.json");
const SNS_UTM_POLICY_PATH = path.join(PROJECT_ROOT, ".claude/scripts/lib/sns-utm.cjs");

type EvidenceKind = JapanZueCandidate["source"]["kind"];

interface PrivateCandidate {
  page: number;
  chapter?: number;
  kind: EvidenceKind;
  itemNumber?: string;
  continuationPages?: number[];
  rawLabel: string;
  rawContext: string;
  score?: number;
}

interface CandidateDocument {
  schemaVersion: number;
  sourceKey: typeof SOURCE_KEY;
  edition: typeof EDITION;
  sourceManifestSha256: string;
  extractionVersion: number;
  scan: {
    pageStart: number;
    pageEnd: number;
    pageCount: number;
    missingPages: number[];
    duplicatePages: number[];
  };
  accounting: {
    tableHeadings: number;
    tableLogicalHeadings: number;
    tableContinuationPages: number;
    tableSubitemsDetected: number;
    tableSubitemsSelected: number;
    foldedTableSubitems: number;
    foldedNonstandardTables: number;
    figureHeadings: number;
    figureImageExtras: number;
    numericSentencePool: number;
    textStatsSelected: number;
    textStatsExcluded: number;
    chapterNumberCorrections: number;
    numberingGaps: { table: string[]; figure: string[] };
  };
  counts: Record<EvidenceKind, number> & { total: number };
  candidatesSha256: string;
  candidates: JapanZueCandidate[];
}

interface SummaryDocument {
  schemaVersion: number;
  sourceKey: typeof SOURCE_KEY;
  edition: typeof EDITION;
  extractionVersion: number;
  candidatesSha256: string;
  counts: CandidateDocument["counts"];
  resolutionCounts: Record<string, number>;
  resolutionCoverage: number;
  primarySourceCoverage: number;
  rightsAllowedCount: number;
  productionReadyCount: number;
  publicCandidateCount: number;
  pilotReadyCount: number;
  manualOverrideCount: number;
  metricMappedCount: number;
  surveyMappedCount: number;
  themeMappedCount: number;
  blockers: {
    primarySourceUnavailable: number;
    rightsHold: number;
    unreviewed: number;
  };
  nextWave: string[];
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function stableJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function parseArgs(argv: string[]): {
  command: string;
  sourceRoot: string;
  dryRun: boolean;
  check: boolean;
  against?: string;
  current?: string;
  source?: string;
  edition?: string;
} {
  const [command = "help", ...rest] = argv;
  let sourceRoot = path.join(
    tmpdir(),
    "stats47-source-vault/work/japan-zue/2025-26/日本国勢図絵",
  );
  let dryRun = false;
  let check = false;
  let against: string | undefined;
  let current: string | undefined;
  let source: string | undefined;
  let edition: string | undefined;
  for (let index = 0; index < rest.length; index += 1) {
    const arg = rest[index];
    if (arg === "--source-root") sourceRoot = path.resolve(rest[index + 1] ?? "");
    if (arg === "--dry-run") dryRun = true;
    if (arg === "--check") check = true;
    if (arg === "--against") against = path.resolve(rest[index + 1] ?? "");
    if (arg === "--current") current = path.resolve(rest[index + 1] ?? "");
    if (arg === "--source") source = rest[index + 1];
    if (arg === "--edition") edition = rest[index + 1];
  }
  return {
    command,
    sourceRoot,
    dryRun,
    check,
    ...(against ? { against } : {}),
    ...(current ? { current } : {}),
    ...(source ? { source } : {}),
    ...(edition ? { edition } : {}),
  };
}

function normalizeText(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/<[^>]+>/g, "")
    .replace(/[\s\p{P}\p{S}]+/gu, "")
    .toLowerCase();
}

function bigrams(value: string): Set<string> {
  const normalized = normalizeText(value);
  const out = new Set<string>();
  for (let index = 0; index < normalized.length - 1; index += 1) {
    out.add(normalized.slice(index, index + 2));
  }
  return out;
}

interface MatchText {
  normalized: string;
  bigrams: Set<string>;
}

const METRIC_MATCH_TEXT = new Map<string, MatchText>();

function prepareMatchText(value: string, cache?: Map<string, MatchText>): MatchText {
  const cached = cache?.get(value);
  if (cached) return cached;
  const prepared = { normalized: normalizeText(value), bigrams: bigrams(value) };
  cache?.set(value, prepared);
  return prepared;
}

function similarity(left: MatchText, right: MatchText): number {
  const normalizedLeft = left.normalized;
  const normalizedRight = right.normalized;
  if (!normalizedLeft || !normalizedRight) return 0;
  if (normalizedLeft === normalizedRight) return 1;
  if (normalizedLeft.includes(normalizedRight) || normalizedRight.includes(normalizedLeft)) {
    const shorter = Math.min(normalizedLeft.length, normalizedRight.length);
    const longer = Math.max(normalizedLeft.length, normalizedRight.length);
    if (shorter >= 4) return 0.85 * (shorter / longer);
  }
  const intersection = [...left.bigrams].filter((value) => right.bigrams.has(value)).length;
  const union = left.bigrams.size + right.bigrams.size - intersection;
  return union ? intersection / union : 0;
}

function sourceName(metric: MetricConfig): string {
  if ("displayName" in metric.source && metric.source.displayName) return metric.source.displayName;
  if (metric.source.kind === "estat") return "e-Stat";
  if (metric.source.kind === "calculated") return "既存指標からの計算";
  return metric.source.kind;
}

function sourceUrl(metric: MetricConfig): string | undefined {
  if ("url" in metric.source && metric.source.url) return metric.source.url;
  if (metric.source.kind === "estat") return "https://www.e-stat.go.jp/";
  return undefined;
}

function datasetId(metric: MetricConfig): string | undefined {
  if (metric.source.kind === "estat") return metric.source.statsDataId;
  if (metric.source.kind === "kakei-chousa") {
    const id = metric.source.filter?.statsDataId;
    return typeof id === "string" ? id : undefined;
  }
  return undefined;
}

function metricYears(metric: MetricConfig): string[] {
  const years = metric.years;
  if (years === "all") return [];
  if ("years" in years) return years.years.map(String);
  return Array.from(
    { length: years.to - years.from + 1 },
    (_, index) => String(years.from + index),
  );
}

function buildMetricLineages(): Record<string, MetricLineage> {
  const metricThemes = new Map<string, string[]>();
  for (const catalog of Object.values(THEME_CATALOGS)) {
    for (const metric of catalog.metrics) {
      metricThemes.set(metric.rankingKey, [...(metricThemes.get(metric.rankingKey) ?? []), catalog.key]);
    }
  }
  return Object.fromEntries(
    Object.values(METRICS_REGISTRY).map((metric) => [
      metric.key,
      {
        key: metric.key,
        title: metric.title,
        category: metric.category,
        sourceName: sourceName(metric),
        ...(sourceUrl(metric) ? { sourceUrl: sourceUrl(metric) } : {}),
        ...(datasetId(metric) ? { datasetId: datasetId(metric) } : {}),
        surveyIds: resolveMetricProvenance(metric, METRICS_REGISTRY)
          .map(({ id }) => id)
          .filter((id) => !id.includes(":")),
        themeSlugs: [...new Set(metricThemes.get(metric.key) ?? [])],
        unit: metric.unit,
        geoScopes: metric.entities.includes("prefecture") ? ["prefecture-set"] : [],
        dataYears: metricYears(metric),
        isActive: metric.isActive === true,
      },
    ]),
  );
}

function parseSections(text: string): Array<{ title: string; body: string }> {
  const headings = [...text.matchAll(/^##\s+(.+)$/gm)];
  return headings.map((heading, index) => ({
    title: heading[1].trim(),
    body: text.slice(heading.index, headings[index + 1]?.index ?? text.length),
  }));
}

function tableSeparatorCount(value: string): number {
  return value.split("\n").filter((line) => /^\|(?:[-: ]+\|)+$/.test(line)).length;
}

function imageCount(value: string): number {
  return value.split("\n").filter((line) => line.startsWith("![")).length;
}

function extractItemNumber(title: string, kind: "table" | "figure"): string | undefined {
  const prefix = kind === "table" ? "表" : "図";
  return title.match(new RegExp(`^${prefix}\\s*([0-9０-９]+[-―][0-9０-９]+)`))?.[1]?.normalize("NFKC");
}

function normalizeItemNumber(
  itemNumber: string | undefined,
  chapter: number | undefined,
  title: string,
): { itemNumber?: string; corrected: boolean } {
  if (!itemNumber || !chapter) return { ...(itemNumber ? { itemNumber } : {}), corrected: false };
  const [, item] = itemNumber.split("-");
  const declaredChapter = Number(itemNumber.split("-")[0]);
  if (declaredChapter === chapter) return { itemNumber, corrected: false };
  if (/\[\?\]/.test(title) && item) return { itemNumber: `${chapter}-${item}`, corrected: true };
  return { itemNumber, corrected: false };
}

function numberingGaps(candidates: readonly PrivateCandidate[], kind: "table" | "figure"): string[] {
  const byChapter = new Map<number, Set<number>>();
  for (const candidate of candidates) {
    if (candidate.kind !== kind || !candidate.itemNumber || candidate.itemNumber.includes(":")) continue;
    const match = candidate.itemNumber.match(/^([0-9]+)-([0-9]+)$/);
    if (!match) continue;
    const chapter = Number(match[1]);
    const item = Number(match[2]);
    const items = byChapter.get(chapter) ?? new Set<number>();
    items.add(item);
    byChapter.set(chapter, items);
  }
  const gaps: string[] = [];
  for (const [chapter, items] of [...byChapter.entries()].sort(([left], [right]) => left - right)) {
    const max = Math.max(...items);
    for (let item = 1; item <= max; item += 1) {
      if (!items.has(item)) gaps.push(`${kind}:${chapter}-${item}`);
    }
  }
  return gaps;
}

function numericSentenceScore(sentence: string): number {
  const normalized = sentence.normalize("NFKC");
  const numericTokens = normalized.match(/[0-9]+(?:[.,][0-9]+)*/g)?.length ?? 0;
  const unitTokens = normalized.match(
    /(?:%|人|世帯|戸|社|事業所|円|ドル|トン|\bt\b|ha|km|キロ|平方|件|台|隻|校|倍|割|ポイント|兆|億|万|千|百|枚|冊|部|床|室|頭|羽|kW|Wh|リットル|歳|か国|カ国|か所|度|℃)/gi,
  )?.length ?? 0;
  const change = /増|減|上昇|低下|伸び|縮小|拡大|ピーク|最多|最少|最高|最低/.test(normalized) ? 3 : 0;
  const attribution = /省|庁|局|調査|統計|年報|白書|報告/.test(normalized) ? 2 : 0;
  const artifact = /ページ|続く|中断|判読|スキャン/.test(normalized) ? -20 : 0;
  return numericTokens * 2 + unitTokens * 3 + change + attribution + artifact;
}

function extractPrivateCandidates(pages: Array<{ page: number; text: string }>): {
  candidates: PrivateCandidate[];
  accounting: CandidateDocument["accounting"];
} {
  const tableBase: PrivateCandidate[] = [];
  const tableSubitems: PrivateCandidate[] = [];
  const figureCandidates: PrivateCandidate[] = [];
  const textPool: PrivateCandidate[] = [];
  let currentChapter: number | undefined;
  let tableHeadings = 0;
  let tableContinuationPages = 0;
  let chapterNumberCorrections = 0;
  let foldedNonstandardTables = 0;
  let figureHeadings = 0;
  let figureImageExtras = 0;

  for (const { page, text } of pages) {
    const chapterMatches = [...text.matchAll(/第([0-9０-９]+)章/g)];
    // ページ冒頭の章見出しを使う。本文中の「第26章参照」等で所属章を上書きしない。
    const chapter = chapterMatches[0]?.[1];
    if (chapter) currentChapter = Number(chapter.normalize("NFKC"));
    const sections = parseSections(text);
    for (const section of sections) {
      const isTable = section.title.startsWith("表");
      const isFigure = section.title.startsWith("図");
      const separators = tableSeparatorCount(section.body);
      const images = imageCount(section.body);
      if (isTable) {
        tableHeadings += 1;
        const normalized = normalizeItemNumber(extractItemNumber(section.title, "table"), currentChapter, section.title);
        if (normalized.corrected) chapterNumberCorrections += 1;
        const previous = [...tableBase].reverse().find((candidate) => (
          candidate.chapter === currentChapter &&
          candidate.itemNumber === normalized.itemNumber
        ));
        const isMarkedContinuation = /[（(]続/.test(section.title);
        const isSplitContinuation = /右半/.test(section.title) && /左半/.test(previous?.rawLabel ?? "");
        if (isMarkedContinuation || isSplitContinuation) {
          if (!previous) throw new Error(`orphan table continuation: p${page} ${section.title}`);
          previous.continuationPages = [...(previous.continuationPages ?? []), page];
          previous.rawContext = `${previous.rawContext}\n${section.body}`;
          tableContinuationPages += 1;
        } else {
          tableBase.push({
            page,
            chapter: currentChapter,
            kind: "table",
            ...(normalized.itemNumber ? { itemNumber: normalized.itemNumber } : {}),
            rawLabel: section.title,
            rawContext: section.body,
          });
        }
        const h3 = [...section.body.matchAll(/^###\s+(.+)$/gm)].map((match) => match[1].trim());
        for (let index = 1; index < h3.length; index += 1) {
          tableSubitems.push({
            page,
            chapter: currentChapter,
            kind: "table",
            itemNumber: `${normalized.itemNumber ?? `p${page}`}:${index + 1}`,
            rawLabel: h3[index],
            rawContext: section.body,
          });
        }
      } else if (!isFigure && section.title !== "本文" && separators > 0) {
        foldedNonstandardTables += 1;
      }
      if (isFigure) {
        figureHeadings += 1;
        const count = Math.max(1, images);
        figureImageExtras += Math.max(0, count - 1);
        const normalized = normalizeItemNumber(extractItemNumber(section.title, "figure"), currentChapter, section.title);
        if (normalized.corrected) chapterNumberCorrections += 1;
        for (let index = 0; index < count; index += 1) {
          figureCandidates.push({
            page,
            chapter: currentChapter,
            kind: "figure",
            itemNumber: index
              ? `${normalized.itemNumber ?? `p${page}`}:${index + 1}`
              : normalized.itemNumber,
            rawLabel: section.title,
            rawContext: section.body,
          });
        }
      } else if (images > 0 && section.title !== "本文" && !isTable) {
        for (let index = 0; index < images; index += 1) {
          figureCandidates.push({
            page,
            chapter: currentChapter,
            kind: "figure",
            itemNumber: `p${page}:${index + 1}`,
            rawLabel: section.title,
            rawContext: section.body,
          });
        }
      }
    }

    const body = text.match(/^## 本文\s*\n([\s\S]*?)(?=^## |\z)/m)?.[1] ?? "";
    const sentences = body
      .replace(/^#.*$/gm, " ")
      .replace(/\n+/g, " ")
      .split(/(?<=[。！？!?])\s*/)
      .map((sentence) => sentence.trim())
      .filter((sentence) => sentence.length >= 20 && /[0-9０-９]/.test(sentence));
    for (const sentence of sentences) {
      textPool.push({
        page,
        chapter: currentChapter,
        kind: "text-stat",
        rawLabel: sentence,
        rawContext: sentence,
        score: numericSentenceScore(sentence),
      });
    }
  }

  const selectedSubitems = tableSubitems.slice(0, TABLE_SUBITEM_LIMIT);
  const selectedText = [...textPool]
    .sort((left, right) => (right.score ?? 0) - (left.score ?? 0) || left.page - right.page || left.rawLabel.localeCompare(right.rawLabel, "ja"))
    .slice(0, TEXT_STAT_LIMIT)
    .sort((left, right) => left.page - right.page || left.rawLabel.localeCompare(right.rawLabel, "ja"));
  const candidates = [...tableBase, ...selectedSubitems, ...figureCandidates, ...selectedText].sort(
    (left, right) => left.page - right.page || left.kind.localeCompare(right.kind) || left.rawLabel.localeCompare(right.rawLabel, "ja"),
  );

  return {
    candidates,
    accounting: {
      tableHeadings,
      tableLogicalHeadings: tableBase.length,
      tableContinuationPages,
      tableSubitemsDetected: tableSubitems.length,
      tableSubitemsSelected: selectedSubitems.length,
      foldedTableSubitems: tableSubitems.length - selectedSubitems.length,
      foldedNonstandardTables,
      figureHeadings,
      figureImageExtras,
      numericSentencePool: textPool.length,
      textStatsSelected: selectedText.length,
      textStatsExcluded: textPool.length - selectedText.length,
      chapterNumberCorrections,
      numberingGaps: {
        table: numberingGaps([...tableBase, ...selectedSubitems], "table"),
        figure: numberingGaps(figureCandidates, "figure"),
      },
    },
  };
}

function extractOrganizations(value: string): string[] {
  return [...new Set(JAPAN_ZUE_SOURCE_POLICIES.filter(({ pattern }) => pattern.test(value)).map(({ organization }) => organization))];
}

function extractPublications(value: string): string[] {
  return [...new Set(
    [...value.matchAll(/「([^」]{2,80})」/g)]
      .map((match) => match[1].trim())
      .filter((title) => /調査|統計|年報|白書|報告|資料|データ|センサス|推計/.test(title)),
  )].slice(0, 3);
}

function extractYears(value: string): string[] {
  return [...new Set([...value.normalize("NFKC").matchAll(/(?:19|20)[0-9]{2}/g)].map((match) => match[0]))].sort();
}

function inferGeoScopes(value: string): EvidenceGeoScope[] {
  if (/都道府県|主産県|県別/.test(value)) return ["prefecture-set"];
  if (/市区町村|市町村|都市別|市別/.test(value)) return ["municipality-set"];
  if (/世界|各国|主要国|国際比較/.test(value)) return ["world"];
  return ["japan"];
}

function cleanMetricLabel(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/^(?:表|図)\s*(?:[0-9]+[-―][0-9]+)?(?:\s*\([^)]*続[^)]*\))?[\s　]*/, "")
    .replace(/\([^)]*(?:19|20)[0-9]{2}[^)]*\)/g, "")
    .replace(/\([^)]*(?:単位|%|円|人|件|t|ha|km)[^)]*\)/gi, "")
    .replace(/[\s　]+/g, " ")
    .trim();
}

function metricCandidates(label: string, metrics: Readonly<Record<string, MetricLineage>>): Array<{ key: string; score: number }> {
  const preparedLabel = prepareMatchText(cleanMetricLabel(label));
  return Object.values(metrics)
    .map((metric) => ({
      key: metric.key,
      score: Number(
        similarity(preparedLabel, prepareMatchText(metric.title, METRIC_MATCH_TEXT)).toFixed(4),
      ),
    }))
    .filter(({ score }) => score >= 0.55)
    .sort((left, right) => right.score - left.score || left.key.localeCompare(right.key))
    .slice(0, 3);
}

function toPublicCandidates(
  privateCandidates: readonly PrivateCandidate[],
  metrics: Readonly<Record<string, MetricLineage>>,
): JapanZueCandidate[] {
  const pageCounters = new Map<string, number>();
  return privateCandidates.map((candidate) => {
    const counterKey = `${candidate.page}:${candidate.kind}`;
    const sequence = (pageCounters.get(counterKey) ?? 0) + 1;
    pageCounters.set(counterKey, sequence);
    const matches = metricCandidates(candidate.rawLabel, metrics);
    const organizations = extractOrganizations(candidate.rawContext);
    const publications = extractPublications(candidate.rawContext);
    const kindToken = candidate.kind === "text-stat" ? "textstat" : candidate.kind;
    const id = `${SOURCE_KEY}-${EDITION}-p${String(candidate.page).padStart(3, "0")}-${kindToken}${String(sequence).padStart(2, "0")}`;
    const topicHint = matches[0]?.score === 1
      ? metrics[matches[0].key].title
      : publications[0] ?? `第${candidate.chapter ?? "不明"}章の${candidate.kind}項目`;
    return {
      id,
      source: {
        key: SOURCE_KEY,
        edition: EDITION,
        ...(candidate.chapter ? { chapter: candidate.chapter } : {}),
        page: candidate.page,
        ...(candidate.continuationPages?.length ? { continuationPages: candidate.continuationPages } : {}),
        kind: candidate.kind,
        ...(candidate.itemNumber ? { itemNumber: candidate.itemNumber } : {}),
      },
      topicHint,
      sourceFingerprint: sha256(`${candidate.page}\0${candidate.kind}\0${candidate.rawLabel}\0${candidate.rawContext}`),
      primarySourceOrganizations: organizations,
      publicationHints: publications,
      dataYears: extractYears(`${candidate.rawLabel}\n${candidate.rawContext}`),
      geoScopes: inferGeoScopes(candidate.rawLabel),
      metricCandidates: matches,
    };
  });
}

async function readPages(sourceRoot: string): Promise<Array<{ page: number; text: string }>> {
  const mdRoot = path.join(sourceRoot, "md");
  const fileNames = (await readdir(mdRoot)).filter((fileName) => /^p[0-9]{3}\.md$/.test(fileName)).sort();
  return Promise.all(
    fileNames.map(async (fileName) => ({
      page: Number(fileName.slice(1, 4)),
      text: await readFile(path.join(mdRoot, fileName), "utf8"),
    })),
  );
}

async function sourceManifestSha256(): Promise<string> {
  return sha256(await readFile(path.join(STATE_DIR, "source-bundle-manifest.json"), "utf8"));
}

function countKinds(candidates: readonly JapanZueCandidate[]): CandidateDocument["counts"] {
  const table = candidates.filter(({ source }) => source.kind === "table").length;
  const figure = candidates.filter(({ source }) => source.kind === "figure").length;
  const textStat = candidates.filter(({ source }) => source.kind === "text-stat").length;
  return { table, figure, "text-stat": textStat, total: table + figure + textStat };
}

async function buildCandidateDocument(sourceRoot: string): Promise<{ document: CandidateDocument; items: JapanZueEvidenceItem[] }> {
  const pages = await readPages(sourceRoot);
  const pageCounts = new Map<number, number>();
  for (const { page } of pages) pageCounts.set(page, (pageCounts.get(page) ?? 0) + 1);
  const missingPages = Array.from({ length: EXPECTED_PAGE_COUNT }, (_, index) => PAGE_START + index).filter(
    (page) => !pageCounts.has(page),
  );
  const duplicatePages = [...pageCounts].filter(([, count]) => count > 1).map(([page]) => page);
  const { candidates: privateCandidates, accounting } = extractPrivateCandidates(pages);
  const metrics = buildMetricLineages();
  const candidates = toPublicCandidates(privateCandidates, metrics);
  const counts = countKinds(candidates);
  const document: CandidateDocument = {
    schemaVersion: SCHEMA_VERSION,
    sourceKey: SOURCE_KEY,
    edition: EDITION,
    sourceManifestSha256: await sourceManifestSha256(),
    extractionVersion: EXTRACTION_VERSION,
    scan: { pageStart: PAGE_START, pageEnd: PAGE_END, pageCount: pages.length, missingPages, duplicatePages },
    accounting,
    counts,
    candidatesSha256: sha256(JSON.stringify(candidates)),
    candidates,
  };
  const items = candidates.map((candidate) => resolveJapanZueCandidate(candidate, metrics));
  return { document, items };
}

function buildSummary(document: CandidateDocument, items: readonly JapanZueEvidenceItem[]): SummaryDocument {
  const resolutionCounts: Record<string, number> = {};
  for (const item of items) resolutionCounts[item.resolution] = (resolutionCounts[item.resolution] ?? 0) + 1;
  const resolved = items.filter(({ resolution }) => resolution !== "unreviewed").length;
  const primary = items.filter(({ primarySources }) => primarySources.length > 0).length;
  const allowed = items.filter(({ primarySources }) => primarySources.length > 0 && primarySources.every(({ rights }) => rights === "allowed")).length;
  const metricLineages = buildMetricLineages();
  const evidenceReady = items.filter(
    ({ resolution, primarySources, dataContract, mapping }) =>
      !["unreviewed", "primary-source-unavailable", "rights-hold", "not-quantitative"].includes(resolution) &&
      primarySources.length > 0 &&
      primarySources.every(({ rights }) => rights === "allowed") &&
      Boolean(mapping.metricKeys?.length) &&
      dataContract.units.length > 0 &&
      dataContract.geoScopes.length > 0,
  );
  const productionReady = evidenceReady.filter(({ mapping }) =>
    (mapping.metricKeys ?? []).every((key) => metricLineages[key]?.isActive),
  );
  const publicCandidates = items.filter(({ mapping }) => (mapping.contentRoles?.length ?? 0) > 0);
  const pilotIds = new Set(Object.keys(JAPAN_ZUE_MANUAL_OVERRIDES));
  return {
    schemaVersion: SCHEMA_VERSION,
    sourceKey: SOURCE_KEY,
    edition: EDITION,
    extractionVersion: EXTRACTION_VERSION,
    candidatesSha256: document.candidatesSha256,
    counts: document.counts,
    resolutionCounts: Object.fromEntries(Object.entries(resolutionCounts).sort(([left], [right]) => left.localeCompare(right))),
    resolutionCoverage: Number((resolved / Math.max(items.length, 1)).toFixed(6)),
    primarySourceCoverage: Number((primary / Math.max(items.length, 1)).toFixed(6)),
    rightsAllowedCount: allowed,
    productionReadyCount: productionReady.length,
    publicCandidateCount: publicCandidates.length,
    pilotReadyCount: evidenceReady.filter(({ id }) => pilotIds.has(id)).length,
    manualOverrideCount: items.filter(({ review }) => review.method === "manual-override").length,
    metricMappedCount: items.filter(({ mapping }) => mapping.metricKeys?.length).length,
    surveyMappedCount: items.filter(({ mapping }) => mapping.surveyIds?.length).length,
    themeMappedCount: items.filter(({ mapping }) => mapping.themeSlugs?.length).length,
    blockers: {
      primarySourceUnavailable: resolutionCounts["primary-source-unavailable"] ?? 0,
      rightsHold: resolutionCounts["rights-hold"] ?? 0,
      unreviewed: resolutionCounts.unreviewed ?? 0,
    },
    nextWave: evidenceReady.slice(0, 25).map(({ id }) => id),
  };
}

function generatedItemsShardSource(
  items: readonly JapanZueEvidenceItem[],
  candidatesSha256: string,
  shardIndex: number,
): string {
  return `/*\n * AUTOGENERATED by packages/data-configs/scripts/evidence/japan-zue.ts\n * candidatesSha256: ${candidatesSha256}\n * shard: ${shardIndex + 1}/${ITEM_SHARD_COUNT}\n * DO NOT EDIT. Change policy.ts and rerun evidence:resolve.\n */\nimport type { JapanZueEvidenceItem } from "../types";\n\nexport const JAPAN_ZUE_EVIDENCE_ITEMS_${shardIndex}: readonly JapanZueEvidenceItem[] = ${JSON.stringify(items, null, 2)};\n`;
}

function generatedItemsIndexSource(candidatesSha256: string): string {
  const imports = ITEM_SHARD_PATHS.map(
    (_, index) => `import { JAPAN_ZUE_EVIDENCE_ITEMS_${index} } from "./items.generated.${index}";`,
  ).join("\n");
  const spreads = ITEM_SHARD_PATHS.map(
    (_, index) => `  ...JAPAN_ZUE_EVIDENCE_ITEMS_${index},`,
  ).join("\n");
  return `/*\n * AUTOGENERATED by packages/data-configs/scripts/evidence/japan-zue.ts\n * candidatesSha256: ${candidatesSha256}\n * DO NOT EDIT. Change policy.ts and rerun evidence:resolve.\n */\nimport type { JapanZueEvidenceItem } from "../types";\n${imports}\n\nexport const JAPAN_ZUE_EVIDENCE_ITEMS: readonly JapanZueEvidenceItem[] = [\n${spreads}\n];\n`;
}

function validateDocuments(document: CandidateDocument, items: readonly JapanZueEvidenceItem[]): string[] {
  const errors: string[] = [];
  if (document.scan.pageCount !== EXPECTED_PAGE_COUNT) errors.push(`page count ${document.scan.pageCount} != ${EXPECTED_PAGE_COUNT}`);
  if (document.scan.missingPages.length) errors.push(`missing pages: ${document.scan.missingPages.join(",")}`);
  if (document.scan.duplicatePages.length) errors.push(`duplicate pages: ${document.scan.duplicatePages.join(",")}`);
  if (document.accounting.tableHeadings !== EXPECTED_TABLE_HEADINGS) {
    errors.push(`table headings ${document.accounting.tableHeadings} != ${EXPECTED_TABLE_HEADINGS}`);
  }
  if (document.accounting.tableContinuationPages !== EXPECTED_TABLE_CONTINUATION_PAGES) {
    errors.push(`table continuation pages ${document.accounting.tableContinuationPages} != ${EXPECTED_TABLE_CONTINUATION_PAGES}`);
  }
  if (document.accounting.tableLogicalHeadings !== document.accounting.tableHeadings - document.accounting.tableContinuationPages) {
    errors.push("logical table heading accounting drift");
  }
  if (document.accounting.tableSubitemsSelected !== EXPECTED_TABLE_SUBITEMS_SELECTED) {
    errors.push(`selected table subitems ${document.accounting.tableSubitemsSelected} != ${EXPECTED_TABLE_SUBITEMS_SELECTED}`);
  }
  if (document.accounting.figureHeadings !== EXPECTED_FIGURE_HEADINGS) {
    errors.push(`figure headings ${document.accounting.figureHeadings} != ${EXPECTED_FIGURE_HEADINGS}`);
  }
  if (document.accounting.chapterNumberCorrections !== EXPECTED_CHAPTER_NUMBER_CORRECTIONS) {
    errors.push(`chapter number corrections ${document.accounting.chapterNumberCorrections} != ${EXPECTED_CHAPTER_NUMBER_CORRECTIONS}`);
  }
  if (document.accounting.numberingGaps.table.length || document.accounting.numberingGaps.figure.length) {
    errors.push(`numbering gaps: ${[...document.accounting.numberingGaps.table, ...document.accounting.numberingGaps.figure].join(",")}`);
  }
  for (const [kind, expected] of Object.entries(EXPECTED_COUNTS)) {
    const actual = document.counts[kind as EvidenceKind];
    if (actual !== expected) errors.push(`${kind} count ${actual} != ${expected}`);
  }
  if (document.candidates.length !== items.length) errors.push("candidate/item length mismatch");
  if (new Set(document.candidates.map(({ id }) => id)).size !== document.candidates.length) errors.push("duplicate candidate id");
  if (new Set(document.candidates.map(evidenceLogicalKey)).size !== document.candidates.length) {
    errors.push("duplicate logical evidence key");
  }
  if (new Set(items.map(({ id }) => id)).size !== items.length) errors.push("duplicate item id");
  const candidateIds = new Set(document.candidates.map(({ id }) => id));
  const metricKeys = new Set(Object.keys(buildMetricLineages()));
  const unknownOverrides = Object.keys(JAPAN_ZUE_MANUAL_OVERRIDES).filter((id) => !candidateIds.has(id));
  if (unknownOverrides.length) errors.push(`unknown manual overrides: ${unknownOverrides.join(",")}`);
  for (const item of items) {
    if (item.source.continuationPages?.some((page, index, pages) => page <= item.source.page || pages.indexOf(page) !== index)) {
      errors.push(`${item.id}: invalid continuationPages`);
    }
    if (item.resolution === "unreviewed") errors.push(`${item.id}: unreviewed`);
    if (["reuse-existing-metric", "new-metric", "combined-analysis", "context-only"].includes(item.resolution) && !item.primarySource) {
      errors.push(`${item.id}: ${item.resolution} requires primarySource`);
    }
    if ((item.mapping.contentRoles?.length ?? 0) > 0) {
      if (!item.primarySources.length || item.primarySources.some(({ rights }) => rights !== "allowed")) {
        errors.push(`${item.id}: public role requires allowed primarySources`);
      }
      if (!item.mapping.metricKeys?.length) errors.push(`${item.id}: public role requires metric mapping`);
      if (!item.dataContract.units.length) errors.push(`${item.id}: public role requires units`);
      if (!item.dataContract.geoScopes.length) errors.push(`${item.id}: public role requires geoScopes`);
    }
    if (item.topicHint.length > 120) errors.push(`${item.id}: topicHint too long`);
    for (const metricKey of item.mapping.metricKeys ?? []) {
      if (!metricKeys.has(metricKey)) errors.push(`${item.id}: unknown metric ${metricKey}`);
    }
    const serialized = JSON.stringify(item);
    if (/scanPath|ocrText|bookValue|imagePath|rawLabel|rawContext/.test(serialized)) errors.push(`${item.id}: forbidden source material field`);
  }
  return errors;
}

async function validatePilot(document: CandidateDocument, items: readonly JapanZueEvidenceItem[]): Promise<string[]> {
  const errors: string[] = [];
  const candidateIds = new Set(document.candidates.map(({ id }) => id));
  const itemById = new Map(items.map((item) => [item.id, item]));
  const metricKeys = new Set(Object.keys(buildMetricLineages()));
  const surveys = JSON.parse(await readFile(SURVEYS_PATH, "utf8")) as Array<{ id: string }>;
  const surveyIds = new Set(surveys.map(({ id }) => id));
  const experimentsDocument = JSON.parse(await readFile(EXPERIMENTS_PATH, "utf8")) as {
    experiments: Array<{ id: string; pilot_videos?: unknown[] }>;
  };
  const postsDocument = JSON.parse(await readFile(SNS_POSTS_PATH, "utf8")) as {
    posts: Array<{ content_key?: string | null }>;
  };
  if (JAPAN_ZUE_PILOT_ITEMS.length !== 10) errors.push(`pilot count ${JAPAN_ZUE_PILOT_ITEMS.length} != 10`);
  if (new Set(JAPAN_ZUE_PILOT_ITEMS.map(({ evidenceId }) => evidenceId)).size !== JAPAN_ZUE_PILOT_ITEMS.length) {
    errors.push("duplicate pilot evidenceId");
  }
  for (const pilot of JAPAN_ZUE_PILOT_ITEMS) {
    if (!candidateIds.has(pilot.evidenceId)) errors.push(`${pilot.evidenceId}: unknown candidate`);
    const item = itemById.get(pilot.evidenceId);
    if (!item || item.review.method !== "manual-override") errors.push(`${pilot.evidenceId}: not manually reviewed`);
    if (!pilot.question.endsWith("？")) errors.push(`${pilot.evidenceId}: question must be independent question`);
    if (!pilot.provenanceUrls.length || pilot.provenanceUrls.some((url) => !url.startsWith("https://"))) {
      errors.push(`${pilot.evidenceId}: provenance URL required`);
    }
    for (const metricKey of pilot.metricKeys) {
      if (!metricKeys.has(metricKey)) errors.push(`${pilot.evidenceId}: unknown pilot metric ${metricKey}`);
      if (!item?.mapping.metricKeys?.includes(metricKey)) errors.push(`${pilot.evidenceId}: metric lineage drift ${metricKey}`);
    }
    for (const surveyId of pilot.surveyIds) {
      if (!surveyIds.has(surveyId)) errors.push(`${pilot.evidenceId}: unknown survey ${surveyId}`);
    }
  }
  const master = JAPAN_ZUE_MASTER_CONTENT;
  if (!candidateIds.has(master.lineage.evidenceId)) errors.push(`master: unknown evidence ${master.lineage.evidenceId}`);
  for (const metricKey of master.metricKeys) {
    if (!metricKeys.has(metricKey)) errors.push(`master: unknown metric ${metricKey}`);
  }
  for (const surveyId of master.surveyIds) {
    if (!surveyIds.has(surveyId)) errors.push(`master: unknown survey ${surveyId}`);
  }
  if (master.article.status !== "draft-ready-review-pending") errors.push("master: article draft is not ready");
  if (master.article.sections.length < 4) errors.push("master: article requires at least 4 authored sections");
  for (const section of master.article.sections) {
    if (section.heading.length < 10 || section.body.length < 100) errors.push(`master: thin article section ${section.heading}`);
    for (const metricKey of section.metricKeys) {
      if (!master.metricKeys.includes(metricKey)) errors.push(`master: article lineage drift ${metricKey}`);
    }
  }
  const experiment = experimentsDocument.experiments.find(({ id }) => id === master.youtube.experimentId);
  const plannedMasters = experiment?.pilot_videos?.length ?? 0;
  const capacity = master.youtube.experimentCapacity;
  if (!experiment) errors.push(`master: unknown experiment ${master.youtube.experimentId}`);
  if (capacity.maxMasters !== 3 || capacity.plannedMasters !== plannedMasters) {
    errors.push(`master: experiment capacity drift ${plannedMasters}/${capacity.maxMasters}`);
  }
  if (capacity.availableSlots !== Math.max(0, capacity.maxMasters - plannedMasters)) {
    errors.push("master: available experiment slots drift");
  }
  const registeredPosts = postsDocument.posts.filter(({ content_key }) => content_key === master.contentKey);
  if (capacity.availableSlots === 0 && registeredPosts.length > 0) {
    errors.push(`master: ${registeredPosts.length} post(s) registered without experiment slot`);
  }
  if (capacity.availableSlots === 0 && master.youtube.registration.status !== "not-registered-no-slot") {
    errors.push("master: no-slot registration state drift");
  }
  await readFile(SNS_UTM_POLICY_PATH, "utf8");
  const derivativeCounts = JAPAN_ZUE_MASTER_CONTENT.derivatives.reduce<Record<string, number>>((counts, derivative) => {
    counts[derivative.platform] = (counts[derivative.platform] ?? 0) + 1;
    return counts;
  }, {});
  if ((derivativeCounts.instagram ?? 0) < 2 || (derivativeCounts.instagram ?? 0) > 4) errors.push("Instagram derivatives must be 2-4");
  if ((derivativeCounts.x ?? 0) < 2 || (derivativeCounts.x ?? 0) > 4) errors.push("X derivatives must be 2-4");
  if (JAPAN_ZUE_MASTER_CONTENT.youtube.targetDurationMinutes < 6 || JAPAN_ZUE_MASTER_CONTENT.youtube.targetDurationMinutes > 12) {
    errors.push("YouTube master duration must be 6-12 minutes");
  }
  for (const derivative of master.derivatives) {
    if (derivative.contentKey !== master.contentKey || derivative.parentContentKey !== master.contentKey) {
      errors.push(`master: derivative lineage drift ${derivative.platform}/${derivative.sourceTimecode}`);
    }
    if (derivative.parentPlatform !== "youtube" || derivative.status !== "planned-unregistered") {
      errors.push(`master: derivative registration drift ${derivative.platform}/${derivative.sourceTimecode}`);
    }
    if (!/^\d{2}:\d{2}-\d{2}:\d{2}$/.test(derivative.sourceTimecode)) {
      errors.push(`master: invalid source timecode ${derivative.sourceTimecode}`);
    }
  }
  return errors;
}

async function writeArtifacts(document: CandidateDocument, items: JapanZueEvidenceItem[], dryRun: boolean): Promise<SummaryDocument> {
  const summary = buildSummary(document, items);
  if (!dryRun) {
    await mkdir(STATE_DIR, { recursive: true });
    const shardSize = Math.ceil(items.length / ITEM_SHARD_COUNT);
    const shardWrites = ITEM_SHARD_PATHS.map((shardPath, index) =>
      writeFile(
        shardPath,
        generatedItemsShardSource(
          items.slice(index * shardSize, (index + 1) * shardSize),
          document.candidatesSha256,
          index,
        ),
        "utf8",
      ),
    );
    await Promise.all([
      writeFile(CANDIDATES_PATH, stableJson(document), "utf8"),
      writeFile(SUMMARY_PATH, stableJson(summary), "utf8"),
      writeFile(ITEMS_PATH, generatedItemsIndexSource(document.candidatesSha256), "utf8"),
      ...shardWrites,
    ]);
  }
  return summary;
}

async function readArtifacts(): Promise<{ document: CandidateDocument; items: JapanZueEvidenceItem[] }> {
  const document = JSON.parse(await readFile(CANDIDATES_PATH, "utf8")) as CandidateDocument;
  const generated = await import("../../src/evidence-inventory/japan-zue/items.generated");
  return { document, items: generated.JAPAN_ZUE_EVIDENCE_ITEMS as JapanZueEvidenceItem[] };
}

async function validateArtifactSync(document: CandidateDocument, items: readonly JapanZueEvidenceItem[]): Promise<string[]> {
  const errors: string[] = [];
  if (document.candidatesSha256 !== sha256(JSON.stringify(document.candidates))) errors.push("candidate hash drift");
  const itemsSource = await readFile(ITEMS_PATH, "utf8");
  if (!itemsSource.includes(`candidatesSha256: ${document.candidatesSha256}`)) errors.push("generated items hash drift");
  const storedSummary = JSON.parse(await readFile(SUMMARY_PATH, "utf8")) as SummaryDocument;
  if (stableJson(storedSummary) !== stableJson(buildSummary(document, items))) errors.push("summary drift");
  return errors;
}

async function main(): Promise<void> {
  const { command, sourceRoot, dryRun, check, against, current, source, edition } = parseArgs(process.argv.slice(2));
  if (source && source !== SOURCE_KEY) throw new Error(`unsupported source: ${source}`);
  if (edition && !current && edition !== EDITION) {
    throw new Error(`edition ${edition} requires a pre-extracted --current candidates.json; extraction profile is ${EDITION}`);
  }
  if (command === "extract") {
    const { document, items } = await buildCandidateDocument(sourceRoot);
    const errors = [...validateDocuments(document, items), ...(await validatePilot(document, items))];
    if (errors.length) throw new Error(errors.join("\n"));
    const summary = await writeArtifacts(document, items, dryRun);
    console.log(JSON.stringify({ dryRun, sourceRoot, summary }, null, 2));
    return;
  }
  if (command === "resolve") {
    const document = JSON.parse(await readFile(CANDIDATES_PATH, "utf8")) as CandidateDocument;
    const metricLineages = buildMetricLineages();
    const items = document.candidates.map((candidate) => resolveJapanZueCandidate(candidate, metricLineages));
    const errors = [...validateDocuments(document, items), ...(await validatePilot(document, items))];
    if (errors.length) throw new Error(errors.join("\n"));
    const summary = buildSummary(document, items);
    if (check) {
      errors.push(...(await validateArtifactSync(document, items)));
      if (errors.length) throw new Error(errors.join("\n"));
      console.log(`evidence resolution clean: ${items.length} items / policy v${JAPAN_ZUE_POLICY_VERSION}`);
      return;
    }
    await writeArtifacts(document, items, dryRun);
    console.log(JSON.stringify({ dryRun, summary }, null, 2));
    return;
  }
  if (command === "validate") {
    const { document, items } = await readArtifacts();
    const errors = [
      ...validateDocuments(document, items),
      ...(await validatePilot(document, items)),
      ...(await validateArtifactSync(document, items)),
    ];
    if (errors.length) throw new Error(errors.join("\n"));
    console.log(`evidence inventory valid: ${items.length} items / policy v${JAPAN_ZUE_POLICY_VERSION}`);
    return;
  }
  if (command === "coverage") {
    const { document, items } = await readArtifacts();
    const summary = buildSummary(document, items);
    if (summary.resolutionCoverage !== 1) throw new Error(`resolution coverage ${summary.resolutionCoverage}`);
    if (check && (summary.manualOverrideCount !== 10 || summary.pilotReadyCount !== 10)) {
      throw new Error(`pilot coverage ${summary.pilotReadyCount}/${summary.manualOverrideCount}`);
    }
    console.log(JSON.stringify(summary, null, 2));
    return;
  }
  if (command === "expression-audit") {
    const pages = await readPages(sourceRoot);
    const publicTexts = JAPAN_ZUE_PILOT_ITEMS.flatMap((pilot) => [
      { id: `${pilot.evidenceId}:question`, text: pilot.question },
      { id: `${pilot.evidenceId}:next`, text: pilot.nextAction },
    ]).concat([
      { id: "master:title", text: JAPAN_ZUE_MASTER_CONTENT.title },
      { id: "master:question", text: JAPAN_ZUE_MASTER_CONTENT.question },
      { id: "master:claim", text: JAPAN_ZUE_MASTER_CONTENT.youtube.claim },
      { id: "master:article-lead", text: JAPAN_ZUE_MASTER_CONTENT.article.lead },
      ...JAPAN_ZUE_MASTER_CONTENT.article.sections.flatMap((section, index) => [
        { id: `master:article-heading-${index + 1}`, text: section.heading },
        { id: `master:article-body-${index + 1}`, text: section.body },
      ]),
    ]);
    const matches = findExpressionMatches(publicTexts, pages.map(({ text }) => text).join("\n"));
    console.log(JSON.stringify({ checked: publicTexts.length, windowLength: 24, matchCount: matches.length, matches }, null, 2));
    if (matches.length) throw new Error(`expression overlap detected: ${matches.length}`);
    return;
  }
  if (command === "diff") {
    if (!against) throw new Error("diff requires --against <candidates.json>");
    const artifacts = await readArtifacts();
    const document = current
      ? JSON.parse(await readFile(current, "utf8")) as CandidateDocument
      : artifacts.document;
    if (edition && document.edition !== edition) throw new Error(`current edition ${document.edition} != ${edition}`);
    const previous = JSON.parse(await readFile(against, "utf8")) as CandidateDocument;
    console.log(JSON.stringify(diffEvidenceInventory(document.candidates, previous.candidates, artifacts.items), null, 2));
    return;
  }
  console.log(`Usage:
  evidence:extract -- --source japan-zue --edition 2025-26 [--source-root <dir>] [--dry-run]
  evidence:resolve -- [--check] [--dry-run]
  evidence:validate -- --source japan-zue --edition 2025-26
  evidence:coverage -- --source japan-zue --edition 2025-26 --check
  evidence:expression-audit -- --source-root <private restored dir>
  evidence:diff -- --against <previous candidates.json> [--current <new candidates.json> --edition <edition>]

Policy: v${JAPAN_ZUE_POLICY_VERSION}, reviewed ${JAPAN_ZUE_REVIEWED_AT}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
