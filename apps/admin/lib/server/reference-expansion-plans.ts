import "server-only";

import fs from "node:fs";
import path from "node:path";

import { projectRoot } from "./project-root";

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

const THEME_START = "<!-- reference-theme-plans:start -->";
const THEME_END = "<!-- reference-theme-plans:end -->";

function cells(line: string): string[] {
  return line
    .split("|")
    .slice(1, -1)
    .map((cell) => cell.trim());
}

function frontmatterValue(body: string, key: string): string | null {
  const value = body.match(new RegExp(`^${key}:\\s*(.+?)\\s*$`, "m"))?.[1]?.trim();
  if (!value) return null;
  return value.replace(/^(["'])(.*)\1$/, "$2");
}

export function parseReferenceThemePlans(markdown: string): ReferenceExpansionPlan[] {
  const start = markdown.indexOf(THEME_START);
  const end = markdown.indexOf(THEME_END);
  if (start < 0 || end <= start) return [];

  const plans: ReferenceExpansionPlan[] = [];
  for (const line of markdown.slice(start + THEME_START.length, end).split(/\r?\n/)) {
    if (!line.trim().startsWith("|")) continue;
    const [metricKey, title, targetTheme, status, summary] = cells(line);
    if (!metricKey || metricKey === "metricKey" || /^-+$/.test(metricKey)) continue;
    if (!/^[a-z0-9-]+$/.test(metricKey)) {
      throw new Error(`参考文献テーマ企画のmetricKeyが不正です: ${metricKey}`);
    }
    if (status !== "draft" && status !== "blocked") {
      throw new Error(`参考文献テーマ企画のstatusが不正です: ${metricKey}/${status}`);
    }
    plans.push({
      id: `theme:${metricKey}`,
      kind: "theme",
      title,
      target: `/themes/${targetTheme}`,
      status,
      metricKeys: [metricKey],
      summary,
      sourcePath: ".claude/todo/backlog.md",
    });
  }
  return plans;
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

export function referenceExpansionPlans(root = projectRoot()): ReferenceExpansionPlan[] {
  const plans: ReferenceExpansionPlan[] = [];
  const backlogRel = ".claude/todo/backlog.md";
  const backlog = path.join(root, backlogRel);
  if (fs.existsSync(backlog)) {
    plans.push(...parseReferenceThemePlans(fs.readFileSync(backlog, "utf8")));
  }

  const outboxRel = "docs/21_ブログ記事原稿";
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
