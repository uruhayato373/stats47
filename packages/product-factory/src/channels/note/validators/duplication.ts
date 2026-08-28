/**
 * duplication validator (仕様 §2-2・§13)。
 * 同一 productId の重複割当・slug 重複・series↔theme 不整合を検出する。
 */
import type { NoteIssue } from "./types";
import type { NoteArticlePlan } from "../types";
import { CANONICAL_ARTICLES } from "../article-plan";
import { NOTE_SERIES_REGISTRY } from "../series";
import { ALL_PRODUCTS } from "../../../catalog/products";
import type { PackTheme, ProductDefinition } from "../../../catalog/types";

export function checkDuplication(
  products: readonly ProductDefinition[] = ALL_PRODUCTS,
  articles: readonly NoteArticlePlan[] = CANONICAL_ARTICLES,
): { errors: NoteIssue[]; warnings: NoteIssue[] } {
  const errors: NoteIssue[] = [];
  const warnings: NoteIssue[] = [];

  const themeById = new Map<string, PackTheme>(products.map((p) => [p.id, p.theme]));

  // 1. slug 重複 (canonicalSlug は記事の安定 ID なので記事間で一意)。
  const slugSeen = new Set<string>();
  for (const article of articles) {
    if (slugSeen.has(article.slug)) {
      errors.push({ code: "slug-duplicate", ref: article.slug, message: `記事 slug が重複: ${article.slug}` });
    }
    slugSeen.add(article.slug);
  }

  // 2. 同一 productId が複数記事に割当 (mapping 重複)。
  const assignedTo = new Map<string, string[]>();
  for (const article of articles) {
    for (const pid of article.memberProductIds) {
      const list = assignedTo.get(pid) ?? [];
      list.push(article.slug);
      assignedTo.set(pid, list);
    }
  }
  for (const [pid, slugs] of assignedTo) {
    if (slugs.length > 1) {
      errors.push({
        code: "product-duplicate-mapping",
        ref: pid,
        message: `商品 ${pid} が複数記事に重複割当: ${slugs.join(", ")}`,
      });
    }
  }

  // 3. series↔theme 整合 (記事 series が member の現行 pack theme を許容するか)。
  for (const article of articles) {
    const meta = NOTE_SERIES_REGISTRY[article.series];
    if (!meta) {
      errors.push({ code: "series-unknown", ref: article.slug, message: `未知の series: ${article.series}` });
      continue;
    }
    const allowed = new Set<PackTheme>(meta.themes);
    for (const pid of article.memberProductIds) {
      const theme = themeById.get(pid);
      if (theme && !allowed.has(theme)) {
        errors.push({
          code: "series-theme-mismatch",
          ref: article.slug,
          message: `記事 ${article.slug} (series=${article.series}) が theme=${theme} の商品 ${pid} を束ねている`,
        });
      }
    }
  }

  return { errors, warnings };
}
