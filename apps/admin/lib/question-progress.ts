import { listFigureDestinations } from "../../../.claude/scripts/issues/issue-graph-core.mjs";

/**
 * 問いの進み具合: 社会の問いの台帳 (data/content/issues.json) を起点に、ページ・分析・図・配信先の状態を 1 行に集める。
 * 台帳へ写さず毎回集計する。読み取りのみ。
 *
 * 事業の問い (data/business/issue-map.json) とは混ぜない (2026-11-06 オーナー判断)。ここは事業の台帳を読まず、
 * 問いの `revenue` も出さない。収益の判断は事業イシューマップが持つ。
 * 有料 note の列は同じページを経由する関係で、問いから企画した商品とは限らない。問いから企画した商品は `products` が直接指す。
 */

export type QuestionIssue = { id: string; level: "major" | "minor"; question: string; status: "active" | "dropped"; sensitive?: boolean; products?: string[]; books?: string[] };
export type QuestionLink = { issue: string; page: string; role: "answers" | "evidence" };
export type QuestionAnalysis = { id: string; issue: string; status: string };
export type QuestionDestination = { channel: string; status: string; page?: string; postId?: number; slug?: string };
export type QuestionFigure = { id: string; analysis: string; template: string; title: string; reads?: string; destinations: QuestionDestination[] };
export type ExternalLink = { from: string; to: string };
export type ProgressInput = {
  issues: QuestionIssue[];
  links: QuestionLink[];
  analyses: QuestionAnalysis[];
  figures: QuestionFigure[];
  posts: Array<{ id: number; status: string }>;
  pages: Map<string, { published?: boolean }>;
  drafts: Map<string, string>;
  externalLinks: ExternalLink[];
  paidNoteIds: Set<string>;
};

export const QUESTION_STAGES = ["答えなし", "既存記事のみ", "分析中", "配信待ち", "配信済み"] as const;
export type QuestionStage = (typeof QUESTION_STAGES)[number];

export type QuestionRow = {
  id: string;
  question: string;
  level: "major" | "minor";
  sensitive: boolean;
  stage: QuestionStage;
  answers: number;
  evidence: number;
  analyses: number;
  figures: number;
  openDestinations: number;
  /** 問いのページを経由して辿れる note と投稿、図の配信先の投稿 */
  relatedNotes: number;
  relatedPosts: number;
  relatedPaidNotes: number;
  /** 問いから企画して台帳で直接指している商品 */
  products: number;
};

export type QuestionProgress = { rows: QuestionRow[] };

export function stageOf(c: { answers: number; analyses: number; destinations: number; openDestinations: number }): QuestionStage {
  if (c.destinations > 0) return c.openDestinations > 0 ? "配信待ち" : "配信済み";
  if (c.analyses > 0) return "分析中";
  return c.answers > 0 ? "既存記事のみ" : "答えなし";
}

export function buildQuestionProgress(input: ProgressInput): QuestionProgress {
  const { issues, links, analyses, figures, posts, pages, drafts, externalLinks, paidNoteIds } = input;
  const active = issues.filter((i) => i.status === "active");
  const issueOfAnalysis = new Map(analyses.map((a) => [a.id, a.issue]));
  const open: Array<{ issue: string | null }> = listFigureDestinations({ figures, analyses, posts, pages, drafts });

  const externalByPage = new Map<string, string[]>();
  for (const l of externalLinks) externalByPage.set(l.to, [...(externalByPage.get(l.to) ?? []), l.from]);

  const rows = active.map((issue): QuestionRow => {
    const own = links.filter((l) => l.issue === issue.id);
    const ownAnalyses = analyses.filter((a) => a.issue === issue.id);
    const ownFigures = figures.filter((f) => issueOfAnalysis.get(f.analysis) === issue.id);
    const figurePosts = ownFigures.flatMap((f) => f.destinations.flatMap((d) => (d.postId === undefined ? [] : [`sns:${d.postId}`])));
    const related = new Set([...own.flatMap((l) => externalByPage.get(l.page) ?? []), ...figurePosts]);
    const notes = [...related].filter((id) => id.startsWith("note:"));
    const answers = own.filter((l) => l.role === "answers").length;
    const destinations = ownFigures.reduce((n, f) => n + f.destinations.length, 0);
    const openDestinations = open.filter((d) => d.issue === issue.id).length;
    return {
      id: issue.id,
      question: issue.question,
      level: issue.level,
      sensitive: issue.sensitive === true,
      stage: stageOf({ answers, analyses: ownAnalyses.length, destinations, openDestinations }),
      answers,
      evidence: own.length - answers,
      analyses: ownAnalyses.length,
      figures: ownFigures.length,
      openDestinations,
      relatedNotes: notes.length,
      relatedPosts: related.size - notes.length,
      relatedPaidNotes: notes.filter((id) => paidNoteIds.has(id)).length,
      products: (issue.products?.length ?? 0) + (issue.books?.length ?? 0),
    };
  });

  return { rows };
}
