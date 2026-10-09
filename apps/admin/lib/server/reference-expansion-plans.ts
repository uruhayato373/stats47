// Read-only parser shared by the Next.js server and the content audit CLI.

import fs from "node:fs";
import path from "node:path";

import {
  REFERENCE_PLACEMENT_DECISIONS,
  type ReferencePlacementDecision,
} from "../../../../packages/data-configs/src/evidence-inventory/placement-decisions";

const PLACEMENT_DECISIONS_PATH = "packages/data-configs/src/evidence-inventory/placement-decisions.ts";

export type ReferenceExpansionPlanStatus = "draft" | "blocked";

export interface ReferenceExpansionPlan {
  id: string;
  kind: "theme" | "blog";
  title: string;
  target: string;
  status: ReferenceExpansionPlanStatus;
  metricKeys: string[];
  summary: string;
  sourcePath: string;
}

function frontmatterValue(body: string, key: string): string | null {
  const value = body.match(new RegExp(`^${key}:\\s*(.+?)\\s*$`, "m"))?.[1]?.trim();
  if (!value) return null;
  return value.replace(/^(["'])(.*)\1$/, "$2");
}

/**
 * テーマ企画は見送りの記録 (packages/data-configs/src/evidence-inventory/placement-decisions.ts) の
 * channel=theme の planned / blocked から作る (2026-10-10 に backlog の表から移した)。rejected は企画ではないので出さない。
 */
export function referenceThemePlans(
  decisions: readonly ReferencePlacementDecision[] = REFERENCE_PLACEMENT_DECISIONS,
): ReferenceExpansionPlan[] {
  return decisions
    .filter((decision) => decision.channel === "theme" && decision.status !== "rejected")
    .map((decision) => ({
      id: `theme:${decision.metricKey}`,
      kind: "theme" as const,
      title: decision.title ?? decision.metricKey,
      target: decision.target ? `/themes/${decision.target}` : "/themes",
      status: decision.status === "planned" ? ("draft" as const) : ("blocked" as const),
      metricKeys: [decision.metricKey],
      summary: decision.reason,
      sourcePath: PLACEMENT_DECISIONS_PATH,
    }));
}

export function parseReferenceBlogDraft(
  body: string,
  sourcePath: string,
): ReferenceExpansionPlan | null {
  if (!/^referenceSourcePlan:\s*true\s*$/m.test(body)) return null;
  if (/^published:\s*true\s*$/m.test(body)) return null;

  const slug = frontmatterValue(body, "slug");
  const title = frontmatterValue(body, "title");
  const summary = frontmatterValue(body, "planSummary");
  if (!slug || !title || !summary) {
    throw new Error(`参考文献ブログ下書きのfrontmatterが不足しています: ${sourcePath}`);
  }
  const metricKeys = [...new Set([...body.matchAll(/\/ranking\/([a-z0-9-]+)/g)].map((m) => m[1]))];
  if (metricKeys.length < 2) {
    throw new Error(`参考文献ブログ下書きにはrankingを2件以上指定してください: ${sourcePath}`);
  }
  return {
    id: `blog:${slug}`,
    kind: "blog",
    title,
    target: `/blog/${slug}`,
    status: "draft",
    metricKeys,
    summary,
    sourcePath,
  };
}

export function referenceExpansionPlans(root: string): ReferenceExpansionPlan[] {
  const plans: ReferenceExpansionPlan[] = [...referenceThemePlans()];

  const outboxRel = "contents/blog";
  const outbox = path.join(root, outboxRel);
  if (!fs.existsSync(outbox)) return plans;
  for (const entry of fs.readdirSync(outbox, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const sourcePath = `${outboxRel}/${entry.name}/article.md`;
    const articlePath = path.join(root, sourcePath);
    if (!fs.existsSync(articlePath)) continue;
    const plan = parseReferenceBlogDraft(fs.readFileSync(articlePath, "utf8"), sourcePath);
    if (plan) plans.push(plan);
  }
  return plans;
}
