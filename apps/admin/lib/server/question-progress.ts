import "server-only";

import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { datasetDir, datasetPath } from "../../../../config/datasets.mjs";
import { classifyAll } from "../../../../.claude/scripts/content-types/classify-core.mjs";
import { readClassifyInputs } from "../../../../.claude/scripts/content-types/content-types-io.mjs";
import { analysisCycleErrors } from "../../../../.claude/scripts/analysis/analysis-cycle-core.mjs";
import { readDraftStates } from "../../../../.claude/scripts/issues/issue-draft-state.mjs";
import { indexPages } from "../../../../.claude/scripts/issues/issue-graph-core.mjs";
import { analysisInputs, articleFigures, frontmatterValue, outlineOf, verdictOf, viewpointRows, type AnalysisInput, type AnalysisViewpoint, type ViewpointLayer, type ViewpointRow } from "../question-detail";
import { buildQuestionProgress, type ExternalLink, type QuestionAnalysis, type QuestionDestination, type QuestionFigure, type QuestionIssue, type QuestionLink, type QuestionProgress } from "../question-progress";
import { projectRoot } from "./project-root";
import { fileExists, readJson, readText, statePath, type Wrapped } from "./state-io";

/** 問いの進み具合の入力を読む。読み取りのみで、事業の台帳 (business.issue-map) は読まない */
export function questionProgress(): Wrapped<QuestionProgress> {
  try {
    const pagesDir = datasetDir("content.pages");
    const pages = indexPages(
      fs
        .readdirSync(statePath(pagesDir))
        .filter((f) => f.endsWith(".json"))
        .map((f) => readJson(path.posix.join(pagesDir, f))),
    );
    const { figures } = readJson<{ figures: QuestionFigure[] }>(datasetPath("content.figures"));
    const { products } = readJson<{ products: Array<{ channel: string; key: string; priceYen: number | null }> }>(datasetPath("products.ledger"));
    return buildQuestionProgress({
      issues: readJson<{ issues: QuestionIssue[] }>(datasetPath("content.issues")).issues,
      links: readJson<{ links: QuestionLink[] }>(datasetPath("content.issue-links")).links,
      analyses: readJson<{ analyses: QuestionAnalysis[] }>(datasetPath("content.analyses")).analyses,
      figures,
      posts: readJson<{ posts: Array<{ id: number; status: string }> }>(datasetPath("sns.posts")).posts,
      pages,
      drafts: readDraftStates(projectRoot(), figures),
      externalLinks: readJson<{ links: ExternalLink[] }>(datasetPath("content.external")).links,
      paidNoteIds: new Set(products.filter((p) => p.channel === "note" && (p.priceYen ?? 0) > 0).map((p) => `note:${p.key}`)),
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

export type DraftView = {
  slug: string;
  title: string;
  description: string | null;
  state: string;
  verdict: string | null;
  type: string | null;
  issue: string | null;
  outline: string[];
  figures: string[];
  hasBackground: boolean;
  chars: number;
};

export type QuestionDetail = {
  issue: QuestionIssue & { dataNote?: string; pitfall?: string };
  analyses: Array<QuestionAnalysis & { question?: string; finding?: string; caveats?: string[] }>;
  /** 分析ごとの工程と視点の結果。npm run analysis:check と同じ判定を読む */
  cycles: Array<{ id: string; stage: string | null; rows: ViewpointRow[]; problems: string[] }>;
  pages: Array<{ id: string; role: string; title: string; href: string; published: boolean }>;
  drafts: DraftView[];
  figures: Array<{ id: string; title: string; template: string; reads?: string; destinations: QuestionDestination[] }>;
  posts: Array<{ id: number; status: string; platform: string; caption: string; approval: string }>;
  products: Array<{ id: string; title: string; href: string | null; priceJpy: number | null; status: string }>;
  /** 分析の spec と求めた指標から自動で作る。手で配線しない */
  inputs: AnalysisInput[];
  /** ページを経由して辿れる note と投稿。問いから企画したものとは限らない */
  relatedNotes: Array<{ id: string; title: string; href: string | null; via: string }>;
  relatedPosts: Array<{ id: number; caption: string; platform: string; status: string; via: string }>;
};

const issuesLedger = () => readJson<{ issues: Array<QuestionIssue & { dataNote?: string; pitfall?: string }> }>(datasetPath("content.issues")).issues;
const analysesLedger = () => readJson<{ analyses: Array<QuestionAnalysis & CycleFields & { question?: string; finding?: string; caveats?: string[]; spec?: string; derivedMetrics?: Array<{ key: string; label: string }>; article?: { slug: string } }> }>(datasetPath("content.analyses")).analyses;
const figuresLedger = () => readJson<{ figures: QuestionFigure[] }>(datasetPath("content.figures")).figures;

function readDrafts(): DraftView[] {
  const root = projectRoot();
  const inputs = readClassifyInputs(root);
  const classified = classifyAll(inputs);
  const analyses = analysesLedger();
  const issueBySlug = new Map(analyses.flatMap((a) => (a.article?.slug ? [[a.article.slug, a.issue] as const] : [])));
  const states = readDraftStates(root, [{ destinations: inputs.draftSlugs.map((slug: string) => ({ slug })) }]);
  return inputs.draftSlugs.map((slug: string): DraftView => {
    const dir = path.posix.join("contents/blog", slug);
    const markdown = readText(path.posix.join(dir, "article.md"));
    const review = fileExists(path.posix.join(dir, "review.md")) ? readText(path.posix.join(dir, "review.md")) : "";
    return {
      slug,
      title: frontmatterValue(markdown, "title") ?? slug,
      description: frontmatterValue(markdown, "description"),
      state: states.get(slug) ?? "不明",
      verdict: verdictOf(review),
      type: classified.get(`blog:${slug}`)?.type ?? null,
      issue: issueBySlug.get(slug) ?? null,
      outline: outlineOf(markdown),
      figures: articleFigures(markdown),
      hasBackground: fileExists(path.posix.join(datasetDir("blog.article-backgrounds"), `${slug}.jpg`)),
      chars: markdown.length,
    };
  });
}

type CycleFields = { stage?: string; questionTerms?: string[]; viewpoints?: AnalysisViewpoint[]; article?: { slug?: string } };
type CycleAnalysis = QuestionAnalysis & CycleFields & { finding?: string };

/** 1 つの分析の工程。下書きと審査は記事のフォルダから読む */
function analysisCycle(analysis: CycleAnalysis, issue: { question: string }, figures: QuestionFigure[]) {
  const { layers } = readJson<{ layers: ViewpointLayer[] }>(datasetPath("content.analysis-viewpoints"));
  const rows = viewpointRows(analysis.viewpoints ?? [], layers);
  if (!analysis.stage) return { id: analysis.id, stage: null, rows, problems: [] };
  const dir = analysis.article?.slug ? path.posix.join("contents/blog", analysis.article.slug) : null;
  const read = (name: string) => (dir && fileExists(path.posix.join(dir, name)) ? readText(path.posix.join(dir, name)) : null);
  const summary = read("data/analysis-summary.json");
  const article = read("article.md");
  const sha256 = (text: string | null) => (text === null ? null : createHash("sha256").update(text).digest("hex"));
  const problems: string[] = analysisCycleErrors({
    analysis,
    issue,
    layers,
    summary: summary ? JSON.parse(summary) : {},
    figures: figures.filter((f) => f.analysis === analysis.id),
    article,
    review: read("review.md"),
    hashes: { article: sha256(article), summary: sha256(summary) },
  });
  return { id: analysis.id, stage: analysis.stage, rows, problems };
}

/** 1 つの問いの配線。無い問いは null */
export function questionDetail(id: string): Wrapped<QuestionDetail | null> {
  try {
    const issue = issuesLedger().find((i) => i.id === id);
    if (!issue) return null;
    const analyses = analysesLedger().filter((a) => a.issue === id);
    const analysisIds = new Set(analyses.map((a) => a.id));
    const figures = figuresLedger().filter((f) => analysisIds.has(f.analysis));
    const { links } = readJson<{ links: QuestionLink[] }>(datasetPath("content.issue-links"));
    const inputs = readClassifyInputs(projectRoot());
    const pageById = new Map<string, { id: string; title: string; href: string; published?: boolean }>(inputs.pages.map((p: { id: string; title: string; href: string; published?: boolean }) => [p.id, p]));
    const postIds = new Set(figures.flatMap((f) => f.destinations.flatMap((d) => (d.postId === undefined ? [] : [d.postId]))));
    const noteOf = new Map<string, { key: string; title: string; noteUrl?: string; priceJpy?: number; status: string }>(inputs.notes.map((n: { key: string; title: string; noteUrl?: string; priceJpy?: number; status: string }) => [`note:${n.key}`, n]));
    const own = links.filter((l) => l.issue === id);
    const external = readJson<{ links: ExternalLink[] }>(datasetPath("content.external")).links.filter((l) => own.some((o) => o.page === l.to));
    const viaOf = (to: string) => pageById.get(to)?.title ?? to;
    const postOf = new Map<number, { id: number; platform: string; status: string; caption?: string }>(inputs.posts.map((p: { id: number; platform: string; status: string; caption?: string }) => [p.id, p]));
    const specKeys = analyses.flatMap((a) => (a.spec ? readJson<{ metrics: Array<{ key: string }> }>(a.spec).metrics.map((m) => m.key) : []));
    return {
      inputs: analysisInputs(specKeys, analyses.flatMap((a) => a.derivedMetrics ?? []), (pageId) => pageById.get(pageId)),
      relatedNotes: external.filter((l) => l.from.startsWith("note:")).map((l) => {
        const note = noteOf.get(l.from);
        return { id: l.from, title: note?.title ?? l.from, href: note?.noteUrl ?? null, via: viaOf(l.to) };
      }),
      relatedPosts: external.filter((l) => l.from.startsWith("sns:")).flatMap((l) => {
        const post = postOf.get(Number(l.from.slice(4)));
        return post && post.status !== "deleted" ? [{ id: post.id, caption: (post.caption ?? "").split("\n")[0], platform: post.platform, status: post.status, via: viaOf(l.to) }] : [];
      }),
      issue,
      analyses,
      cycles: analyses.map((a) => analysisCycle(a, issue, figures)),
      pages: links.filter((l) => l.issue === id).map((l) => {
        const page = pageById.get(l.page);
        return { id: l.page, role: l.role, title: page?.title ?? l.page, href: page?.href ?? "", published: page?.published === true };
      }),
      drafts: readDrafts().filter((d) => d.issue === id),
      figures,
      posts: inputs.posts.filter((p: { id: number }) => postIds.has(p.id)).map((p: { id: number; status: string; platform: string; caption?: string; approval?: { state?: string } }) => ({
        id: p.id, status: p.status, platform: p.platform, caption: p.caption ?? "", approval: p.approval?.state ?? "未設定",
      })),
      products: (issue.products ?? []).map((productId) => {
        const note = noteOf.get(productId);
        return { id: productId, title: note?.title ?? productId, href: note?.noteUrl ?? null, priceJpy: note?.priceJpy ?? null, status: note?.status ?? "不明" };
      }),
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}
