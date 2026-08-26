import type { MetricConfig } from "../types";
import type { ThemeCatalog } from "./types";

/** ThemeCatalog が参照する全指標で authored description を必須にする。 */
export const THEME_METRIC_DESCRIPTION_MISSING_BASELINE = 0;

type MetricContent = Pick<MetricConfig, "description" | "note">;

export interface ThemeMetricContentCoverage {
  themeReferencedKeys: string[];
  missingDescriptionKeys: string[];
  populatedNoteKeys: string[];
  duplicateDescriptionGroups: Array<{
    normalizedDescription: string;
    keys: string[];
  }>;
}

function normalizeDescription(description: string): string {
  return description.trim().replace(/\s+/g, " ");
}

/** ThemeCatalog の relatedRankingKeys だけを対象に、定義文と注釈の充足状況を収集する。 */
export function collectThemeMetricContentCoverage(
  catalogs: ThemeCatalog[],
  registry: Record<string, MetricContent | undefined>,
): ThemeMetricContentCoverage {
  const themeReferencedKeys = [
    ...new Set(
      catalogs.flatMap((catalog) =>
        catalog.charts.flatMap((chart) => chart.relatedRankingKeys ?? []),
      ),
    ),
  ].sort();
  const missingDescriptionKeys = themeReferencedKeys.filter(
    (key) => !registry[key]?.description?.trim(),
  );
  const populatedNoteKeys = themeReferencedKeys.filter((key) =>
    Boolean(registry[key]?.note?.trim()),
  );

  const keysByDescription = new Map<string, string[]>();
  for (const key of themeReferencedKeys) {
    const description = registry[key]?.description;
    if (!description?.trim()) continue;
    const normalizedDescription = normalizeDescription(description);
    const keys = keysByDescription.get(normalizedDescription) ?? [];
    keys.push(key);
    keysByDescription.set(normalizedDescription, keys);
  }
  const duplicateDescriptionGroups = [...keysByDescription.entries()]
    .filter(([, keys]) => keys.length > 1)
    .map(([normalizedDescription, keys]) => ({
      normalizedDescription,
      keys: [...keys].sort(),
    }))
    .sort((a, b) =>
      a.normalizedDescription.localeCompare(b.normalizedDescription, "ja"),
    );

  return {
    themeReferencedKeys,
    missingDescriptionKeys,
    populatedNoteKeys,
    duplicateDescriptionGroups,
  };
}

/** description欠落と説明文の横展開を機械的に拒否する。note件数は観測だけに留める。 */
export function validateThemeMetricContentCoverage(
  coverage: ThemeMetricContentCoverage,
  options: {
    maxMissingDescriptions: number;
    errors: string[];
    warns: string[];
  },
): void {
  const { maxMissingDescriptions, errors, warns } = options;
  if (coverage.missingDescriptionKeys.length > maxMissingDescriptions) {
    errors.push(
      `[theme-metric-description-regression] description欠落 ${coverage.missingDescriptionKeys.length} 件 ` +
        `(baseline ${maxMissingDescriptions} 件) — 新しいテーマ参照指標には個別の定義文を追加する`,
    );
  }
  for (const group of coverage.duplicateDescriptionGroups) {
    errors.push(
      `[theme-metric-description-duplicate] 正規化後に同一のdescription: ` +
        `${group.keys.join(",")} 「${group.normalizedDescription}」`,
    );
  }
  if (coverage.missingDescriptionKeys.length > 0) {
    warns.push(
      `[theme-metric-content] themeReferenced=${coverage.themeReferencedKeys.length} ` +
        `descriptionMissing=${coverage.missingDescriptionKeys.length} ` +
        `notePopulated=${coverage.populatedNoteKeys.length} ` +
        `keys=${coverage.missingDescriptionKeys.join(",")}`,
    );
  }
}
