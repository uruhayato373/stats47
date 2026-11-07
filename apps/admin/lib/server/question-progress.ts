import "server-only";

import fs from "node:fs";
import path from "node:path";

import { datasetDir, datasetPath } from "../../../../config/datasets.mjs";
import { readDraftStates } from "../../../../.claude/scripts/issues/issue-draft-state.mjs";
import { indexPages } from "../../../../.claude/scripts/issues/issue-graph-core.mjs";
import { buildQuestionProgress, type ExternalLink, type QuestionAnalysis, type QuestionFigure, type QuestionIssue, type QuestionLink, type QuestionProgress } from "../question-progress";
import { projectRoot } from "./project-root";
import { readJson, statePath, type Wrapped } from "./state-io";

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
