import "server-only";

import { METRICS_REGISTRY } from "@stats47/data-configs/registry";
import { THEME_CATALOGS } from "@stats47/data-configs/theme-catalog";
import {
  countAdoptionCriteria,
  evaluateSelectionViewpoints,
  type MachineViewpointId,
  type ViewpointHit,
} from "@stats47/data-configs/theme-selection-viewpoints";

import { THEME_SELECTION_VIEWPOINTS } from "../../../../config/paths.mjs";
import { cached, readJson, TTL } from "./state-io";

/**
 * テーマの指標を選ぶ視点 (読み取り専用)。
 * 視点の定義は config/theme-selection-viewpoints.json、判定は data-configs の selection-viewpoints.ts、
 * 対象は ThemeCatalog (data/themes/catalogs/)。ここは三つを突き合わせて並べるだけで、判定を複製しない。
 */

type ViewpointConfig = {
  adoptionCriteria: Array<{ id: string; label: string; question: string }>;
  rules: Array<{
    id: string;
    title: string;
    statement: string;
    severity: "fix" | "review";
    check: { kind: "machine" | "review" };
  }>;
};

export interface ViewpointThemeCount {
  key: string;
  title: string;
  count: number;
}

export interface ViewpointRuleRow {
  id: string;
  title: string;
  statement: string;
  severity: "fix" | "review";
  checkKind: "machine" | "review";
  /** 人が確かめる規則は null (機械では数えない) */
  hitCount: number | null;
  themes: ViewpointThemeCount[];
}

export interface ViewpointCriterionRow {
  id: string;
  label: string;
  question: string;
  usage: number;
}

export interface ViewpointHitRow extends ViewpointHit {
  themeTitle: string;
}

export interface ThemeViewpointSummary {
  themeCount: number;
  primaryAndSecondaryCount: number;
  criteria: ViewpointCriterionRow[];
  rules: ViewpointRuleRow[];
  hits: Record<string, ViewpointHitRow[]>;
}

function buildSummary(): ThemeViewpointSummary {
  const config = readJson<ViewpointConfig>(THEME_SELECTION_VIEWPOINTS);
  const catalogs = Object.values(THEME_CATALOGS);
  const titles = new Map(catalogs.map((c) => [c.key, c.title]));
  const evaluated = evaluateSelectionViewpoints(catalogs, METRICS_REGISTRY);
  const usage = countAdoptionCriteria(catalogs);

  const hits: Record<string, ViewpointHitRow[]> = {};
  const rules = config.rules.map((rule): ViewpointRuleRow => {
    const ruleHits = rule.check.kind === "machine" ? evaluated[rule.id as MachineViewpointId] : undefined;
    if (!ruleHits) {
      return { ...rule, checkKind: rule.check.kind, hitCount: null, themes: [] };
    }
    hits[rule.id] = ruleHits.map((h) => ({ ...h, themeTitle: titles.get(h.themeKey) ?? h.themeKey }));
    const byTheme = new Map<string, number>();
    for (const h of ruleHits) byTheme.set(h.themeKey, (byTheme.get(h.themeKey) ?? 0) + 1);
    return {
      ...rule,
      checkKind: rule.check.kind,
      hitCount: ruleHits.length,
      themes: [...byTheme.entries()]
        .map(([key, count]) => ({ key, title: titles.get(key) ?? key, count }))
        .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key)),
    };
  });

  return {
    themeCount: catalogs.length,
    primaryAndSecondaryCount: catalogs.reduce(
      (n, c) => n + c.metrics.filter((m) => m.role !== "context").length,
      0,
    ),
    criteria: config.adoptionCriteria.map((c) => ({ ...c, usage: usage[c.id] ?? 0 })),
    rules,
    hits,
  };
}

export function themeViewpointSummary(): ThemeViewpointSummary {
  return cached("theme-viewpoints", TTL.daily, buildSummary);
}
