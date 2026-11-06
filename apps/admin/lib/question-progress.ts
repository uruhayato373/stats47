import { listFigureDestinations } from "../../../.claude/scripts/issues/issue-graph-core.mjs";

/**
 * 問いの進み具合: 社会の問いの台帳 (data/content/issues.json) を起点に、ページ・分析・図・配信先の状態を 1 行に集める。
 * 台帳へ写さず毎回集計する。読み取りのみ。
 *
 * 事業の問い (data/business/issue-map.json) とは混ぜない (2026-11-06 オーナー判断)。ここは事業の台帳を読まず、
 * 問いの `revenue` も出さない。収益の判断は事業イシューマップが持つ。
 * 商品の列は配信先としての到達を数えるだけで、同じページを経由する関係であって、問いから企画した商品とは限らない。
 */

export type QuestionIssue = { id: string; level: "major" | "minor"; question: string; status: "active" | "dropped"; sensitive?: boolean };
export type QuestionLink = { issue: string; page: string; role: "answers" | "evidence" };
export type QuestionAnalysis = { id: string; issue: string; status: string };
export type QuestionDestination = { channel: string; status: string; page?: string; postId?: number; slug?: string };
export type QuestionFigure = { id: string; analysis: string; template: string; title: string; destinations: QuestionDestination[] };
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

export type OpenDestination = {
  issue: string | null;
  question: string;
  figure: string;
  figureTitle: string;
  template: string;
  channel: string;
  target: string;
  status: string;
  actual: string;
  drift: boolean;
  next: string;
};

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
  /** 問いのページを経由して辿れる外部の公開物。問いから直接指す項目は台帳に無い */
  relatedNotes: number;
  relatedPosts: number;
  relatedPaidNotes: number;
};

export type QuestionProgress = {
  rows: QuestionRow[];
  open: OpenDestination[];
  summary: { questions: number; answered: number; analyses: number; figures: number; openDestinations: number; imageWaiting: number; drift: number; withPaidNote: number };
};

/** 実際の状態から、次にする作業を 1 つ返す */
export function nextActionOf(d: { channel: string; status: string; actual: string; drift: boolean }): string {
  if (d.drift) return "台帳と実際のずれを直す";
  if (d.actual === "執筆待ち" || d.actual === "下書きなし") return "記事の下書きを作る";
  if (d.actual === "レビュー待ち") return "記事を審査する";
  if (d.actual === "背景待ち") return "背景画像を Codex で生成する";
  if (d.actual === "公開待ち") return "人が確認して公開する";
  if (d.actual === "公開処理中") return "公開の完了を待つ";
  if (d.channel === "site") return "ページへ図を載せる";
  return "投稿の承認へ回す";
}

export function stageOf(c: { answers: number; analyses: number; destinations: number; openDestinations: number }): QuestionStage {
  if (c.destinations > 0) return c.openDestinations > 0 ? "配信待ち" : "配信済み";
  if (c.analyses > 0) return "分析中";
  return c.answers > 0 ? "既存記事のみ" : "答えなし";
}

export function buildQuestionProgress(input: ProgressInput): QuestionProgress {
  const { issues, links, analyses, figures, posts, pages, drafts, externalLinks, paidNoteIds } = input;
  const active = issues.filter((i) => i.status === "active");
  const questionOf = new Map(issues.map((i) => [i.id, i.question]));
  const figureOf = new Map(figures.map((f) => [f.id, f]));
  const issueOfAnalysis = new Map(analyses.map((a) => [a.id, a.issue]));

  const rawOpen: Array<Omit<OpenDestination, "question" | "figureTitle" | "template" | "next">> = listFigureDestinations({ figures, analyses, posts, pages, drafts });
  const open: OpenDestination[] = rawOpen.map((d) => ({
    ...d,
    question: (d.issue && questionOf.get(d.issue)) || "問いが見つからない",
    figureTitle: figureOf.get(d.figure)?.title ?? d.figure,
    template: figureOf.get(d.figure)?.template ?? "",
    next: nextActionOf(d),
  }));

  const externalByPage = new Map<string, string[]>();
  for (const l of externalLinks) externalByPage.set(l.to, [...(externalByPage.get(l.to) ?? []), l.from]);

  const rows = active.map((issue): QuestionRow => {
    const own = links.filter((l) => l.issue === issue.id);
    const ownAnalyses = analyses.filter((a) => a.issue === issue.id);
    const ownFigures = figures.filter((f) => issueOfAnalysis.get(f.analysis) === issue.id);
    const related = new Set(own.flatMap((l) => externalByPage.get(l.page) ?? []));
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
    };
  });

  return {
    rows,
    open,
    summary: {
      questions: rows.length,
      answered: rows.filter((r) => r.answers > 0).length,
      analyses: analyses.length,
      figures: figures.length,
      openDestinations: open.length,
      imageWaiting: new Set(open.filter((d) => d.actual === "背景待ち").map((d) => d.target)).size,
      drift: open.filter((d) => d.drift).length,
      withPaidNote: rows.filter((r) => r.relatedPaidNotes > 0).length,
    },
  };
}
