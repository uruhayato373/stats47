import "server-only";

import {
  expansionStatus,
  loadAnalyses,
  loadChannelIndex,
  loadExpansion,
  validateExpansion,
  type ExpansionChannel,
  type ExpansionState,
} from "../../../../.claude/scripts/source-vault/lib/reference-expansion.mjs";
import { projectRoot } from "./project-root";

/** 展開先の担当 (正典 .claude/rules/reference-source-standards.md §5「分析企画の展開」) */
export const EXPANSION_OWNERS: Record<ExpansionChannel, string> = {
  ranking: "ranking-expander",
  survey: "survey-curator",
  theme: "theme-designer",
  area: "area-curator",
  japan: "theme-designer",
  blog: "blog-seo-strategist",
  note: "note-manager",
  x: "x-strategist",
  instagram: "instagram-strategist",
  youtube: "strategy-advisor",
};

export interface ReferenceExpansionSummary {
  channel: ExpansionChannel;
  owner: string;
  counts: Record<ExpansionState, number>;
}

export interface ReferenceExpansionView {
  summary: ReferenceExpansionSummary[];
  records: number;
  errors: string[];
}

/** 教材の分析企画 × 展開先の状態 (読み取り専用)。書き込みは CLI の npm run reference:expansion -- record */
export function referenceExpansionView(): ReferenceExpansionView {
  const root = projectRoot();
  const analyses = loadAnalyses(root);
  const ledger = loadExpansion(root);
  const index = loadChannelIndex(root);
  const totals = new Map<ExpansionChannel, Record<ExpansionState, number>>();
  for (const row of expansionStatus(analyses, ledger, index)) {
    const counts = totals.get(row.channel) ?? { done: 0, derived: 0, planned: 0, declined: 0, pending: 0 };
    counts[row.state] += 1;
    totals.set(row.channel, counts);
  }
  return {
    summary: [...totals].sort(([a], [b]) => (a < b ? -1 : 1)).map(([channel, counts]) => ({ channel, owner: EXPANSION_OWNERS[channel], counts })),
    records: ledger.records.length,
    errors: validateExpansion(ledger, analyses, index),
  };
}
