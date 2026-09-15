import "server-only";

import {
  runCatalogValidation,
  type CatalogValidationResult,
} from "@stats47/data-configs/theme-catalog-validator";
import type { HarmAxis, ThemeCatalog } from "@stats47/data-configs/theme-catalog/types";

import { cached, TTL } from "./state-io";

export interface ThemeCompletenessRow {
  key: string;
  title: string;
  metricCount: number;
  primaryAndSecondaryCount: number;
  selectionCount: number;
  adoptionCriteriaCount: number;
  readerQuestionCount: number;
  harmAxes: HarmAxis[];
  errorCount: number;
  warnCount: number;
}

export interface HarmThemeRow {
  key: string;
  title: string;
  axis: HarmAxis;
  reason: string;
}

export interface ViolationTallyRow {
  tag: string;
  count: number;
}

export interface CatalogAuditSummary {
  themeCount: number;
  totalErrorCount: number;
  totalWarnCount: number;
  errorTally: ViolationTallyRow[];
  warnTally: ViolationTallyRow[];
  themes: ThemeCompletenessRow[];
  harmThemes: HarmThemeRow[];
  errorSamples: string[];
  warnSamples: string[];
}

function tagOf(message: string): string {
  return message.match(/^\[([a-z0-9-]+)\]/)?.[1] ?? "other";
}

function tally(messages: string[]): ViolationTallyRow[] {
  const counts = new Map<string, number>();
  for (const m of messages) {
    const tag = tagOf(m);
    counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

function countByTheme(messages: string[], themeKey: string): number {
  const prefix = new RegExp(`^\\[[a-z0-9-]+\\] ${themeKey}[:/ ]`);
  return messages.filter((m) => prefix.test(m)).length;
}

function themeCompletenessRow(
  c: ThemeCatalog,
  result: CatalogValidationResult
): ThemeCompletenessRow {
  const primaryAndSecondary = c.metrics.filter(
    (m) => m.role === "primary" || m.role === "secondary"
  );
  return {
    key: c.key,
    title: c.title,
    metricCount: c.metrics.length,
    primaryAndSecondaryCount: primaryAndSecondary.length,
    selectionCount: primaryAndSecondary.filter((m) => m.selection).length,
    adoptionCriteriaCount: primaryAndSecondary.filter(
      (m) => (m.selection?.adoptionCriteria?.length ?? 0) > 0
    ).length,
    readerQuestionCount: primaryAndSecondary.filter((m) => m.selection?.readerQuestion).length,
    harmAxes: (c.harmRelevance ?? []).map((h) => h.axis),
    errorCount: countByTheme(result.errors, c.key),
    warnCount: countByTheme(result.warns, c.key),
  };
}

function buildSummary(): CatalogAuditSummary {
  const result = runCatalogValidation();

  const harmThemes: HarmThemeRow[] = result.catalogs.flatMap((c) =>
    (c.harmRelevance ?? []).map((h) => ({
      key: c.key,
      title: c.title,
      axis: h.axis,
      reason: h.reason,
    }))
  );

  return {
    themeCount: result.catalogs.length,
    totalErrorCount: result.errors.length,
    totalWarnCount: result.warns.length,
    errorTally: tally(result.errors),
    warnTally: tally(result.warns),
    themes: result.catalogs
      .map((c) => themeCompletenessRow(c, result))
      .sort((a, b) => b.errorCount * 100 + b.warnCount - (a.errorCount * 100 + a.warnCount)),
    harmThemes,
    errorSamples: result.errors.slice(0, 50),
    warnSamples: result.warns.slice(0, 50),
  };
}

/**
 * ThemeCatalog (git TS SSOT) を都度検証して完全性を集計する。
 * 別台帳・キャッシュファイルは持たず、正典から毎回導出する (完全DBレス)。
 * TTL はビルド全体の再計算コストを抑えるためだけの表示キャッシュで、SSOT ではない。
 */
export function catalogAuditSummary(): CatalogAuditSummary {
  return cached("catalog-audit", TTL.daily, buildSummary);
}
