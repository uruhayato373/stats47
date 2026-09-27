/**
 * 定義 (県データブックのテンプレート・ThemeCatalog・page-components) を表示の意味で検査する。
 * 判定規則は `./index.ts`。CLI は `scripts/validate-display-semantics.ts`。
 */
import type { AreaDatabookTemplate } from "../area-databook/types";
import type { ThemeCatalog } from "../theme-catalog/types";
import {
  checkLabelAgainstMetric,
  checkTrendChart,
  RULE_SEVERITY,
  type MetricDeclaration,
  type SemanticFinding,
} from "./index";

export type MetricLookup = (key: string) => MetricDeclaration | undefined;

export function auditAreaDatabookTemplate(template: AreaDatabookTemplate, lookup: MetricLookup): SemanticFinding[] {
  const out: SemanticFinding[] = [];
  for (const section of template.sections) {
    for (const block of section.blocks) {
      if (block.blockType === "ranked-kpi-grid") {
        for (const m of block.metrics) {
          const metric = lookup(m.rankingKey);
          if (!metric) continue; // 実在は validate-area-databook の担当
          out.push(...checkLabelAgainstMetric({
            where: `area-databook/${section.sectionKey}/${block.blockKey}`,
            label: m.shortLabel,
            sectionDescription: section.description,
            metric,
          }));
        }
      } else if (block.blockType === "gender-paired-kpi") {
        for (const pair of block.pairs) {
          for (const key of [pair.maleKey, pair.femaleKey]) {
            const metric = lookup(key);
            if (!metric) continue;
            out.push(...checkLabelAgainstMetric({
              where: `area-databook/${section.sectionKey}/${block.blockKey}`,
              label: pair.label,
              sectionDescription: section.description,
              metric,
            }));
          }
        }
      } else if (block.blockType === "chart") {
        out.push(...checkTrendChart({
          where: `area-databook/${section.sectionKey}/${block.chart.componentKey}`,
          title: block.chart.title,
          componentType: block.chart.componentType,
        }));
      }
    }
  }
  return out;
}

export function auditThemeCatalogs(catalogs: ThemeCatalog[], lookup: MetricLookup): SemanticFinding[] {
  const out: SemanticFinding[] = [];
  for (const catalog of catalogs) {
    for (const m of catalog.metrics) {
      const metric = lookup(m.rankingKey);
      if (!metric) continue;
      out.push(...checkLabelAgainstMetric({ where: `theme/${catalog.key}/metrics`, label: m.shortLabel, metric }));
    }
    for (const chart of catalog.charts) {
      out.push(...checkTrendChart({ where: `theme/${catalog.key}/${chart.componentKey}`, title: chart.title, componentType: chart.componentType }));
    }
  }
  return out;
}

/** page-components JSON の行 (生成物・手書き問わず)。rankingLinks のラベルとリンク先指標を突き合わせる。 */
export interface PageComponentRow {
  componentKey: string;
  componentType: string;
  title: string;
  componentProps?: { rankingLinks?: Array<{ label?: string; url?: string }> } & Record<string, unknown>;
}

export function auditPageComponents(file: string, rows: PageComponentRow[], lookup: MetricLookup): SemanticFinding[] {
  const out: SemanticFinding[] = [];
  for (const row of rows) {
    out.push(...checkTrendChart({ where: `${file}#${row.componentKey}`, title: row.title ?? "", componentType: row.componentType }));
    for (const link of row.componentProps?.rankingLinks ?? []) {
      const key = link.url?.match(/^\/ranking\/([^/?#]+)/)?.[1];
      const metric = key ? lookup(key) : undefined;
      if (!metric || !link.label) continue;
      out.push(...checkLabelAgainstMetric({
        where: `${file}#${row.componentKey}`,
        label: link.label.replace(/ランキング$/, ""),
        metric,
      }));
    }
  }
  return out;
}

/**
 * 数値カードの年表示の必須化 (④)。数値カードを描く部品のソースが値の年 (`.year`) を参照しているか。
 * 年を出さない部品は、同じ見た目で古い値と新しい値が並ぶ (2026-09-25 の県ページで実際に起きた)。
 */
export function auditCardYearDisplay(sources: Array<{ file: string; source: string }>): SemanticFinding[] {
  return sources
    .filter((s) => !/\.year\b|\byear\s*[:=,)]|yearLabel|yearName/.test(s.source))
    .map((s) => ({
      rule: "card-year-missing" as const,
      severity: RULE_SEVERITY["card-year-missing"],
      where: s.file,
      detail: "数値カードの部品が値の年を表示していない (値と年は必ず組で出す)",
    }));
}
