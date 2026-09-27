/**
 * validate-display-semantics — 表示ラベルと指標定義の意味の食い違いを定義単位で検査する (コミット前・CI)。
 *
 * 規約: `.claude/rules/area-databook-standards.md`「表示の意味の検査」/ 判定規則: `src/display-semantics/`
 *
 * 対象: 県データブックのテンプレート (AREA_DATABOOK_TEMPLATE)・ThemeCatalog・page-components JSON・
 *       数値カードの部品 (年の表示)。
 * error (exit 1): RULE_SEVERITY が error の規則。warning は表示のみ (--strict で error)。
 *
 * 使い方: npx tsx packages/data-configs/scripts/validate-display-semantics.ts [--strict] [--json]
 */
import { readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { AREA_DATABOOK_TEMPLATE } from "../src/area-databook";
import type { SemanticFinding } from "../src/display-semantics";
import {
  auditAreaDatabookTemplate,
  auditCardYearDisplay,
  auditPageComponents,
  auditThemeCatalogs,
  type PageComponentRow,
} from "../src/display-semantics/audit";
import { METRICS_REGISTRY } from "../src/registry";
import { listThemeCatalogs } from "../src/theme-catalog";

const ROOT = resolve(fileURLToPath(new URL(".", import.meta.url)), "../../..");
const PAGE_COMPONENTS_DIR = join(ROOT, "apps/web/scripts/data/page-components");
/** 数値カード (値 + 全国順位) を描く部品。値と年は必ず組で出す。 */
export const NUMERIC_CARD_COMPONENTS = [
  "apps/web/src/features/area-databook/components/RankedKpiGrid.tsx",
  "apps/web/src/features/area-databook/components/GenderPairedKpiGrid.tsx",
];

function walkJson(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walkJson(join(dir, e.name)) : e.name.endsWith(".json") ? [join(dir, e.name)] : [],
  );
}

export function collectFindings(): SemanticFinding[] {
  const lookup = (key: string) => METRICS_REGISTRY[key];
  const findings: SemanticFinding[] = [
    ...auditAreaDatabookTemplate(AREA_DATABOOK_TEMPLATE, lookup),
    ...auditThemeCatalogs(listThemeCatalogs(), lookup),
    ...auditCardYearDisplay(
      NUMERIC_CARD_COMPONENTS.map((file) => ({ file, source: readFileSync(join(ROOT, file), "utf8") })),
    ),
  ];
  for (const file of walkJson(PAGE_COMPONENTS_DIR)) {
    // area/ は AREA_DATABOOK_TEMPLATE、theme/ は ThemeCatalog の生成物 (上で定義側を検査済み)
    const rel = relative(PAGE_COMPONENTS_DIR, file);
    if (rel.startsWith("area/") || rel.startsWith("theme/")) continue;
    const parsed = JSON.parse(readFileSync(file, "utf8")) as unknown;
    const rows = Array.isArray(parsed) ? (parsed as PageComponentRow[]).filter((r) => r && typeof r === "object") : [];
    findings.push(...auditPageComponents(`page-components/${rel}`, rows, lookup));
  }
  // 同じ定義行から出た同じ指摘は 1 件にまとめる
  const seen = new Set<string>();
  return findings.filter((f) => {
    const id = `${f.rule}|${f.where}|${f.rankingKey ?? ""}|${f.detail}`;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function main(): void {
  const strict = process.argv.includes("--strict");
  const findings = collectFindings();
  if (process.argv.includes("--json")) {
    console.log(JSON.stringify(findings, null, 2));
    return;
  }
  const errors = findings.filter((f) => f.severity === "error" || strict);
  const warns = findings.filter((f) => f.severity === "warning" && !strict);
  const byRule = new Map<string, number>();
  for (const f of findings) byRule.set(f.rule, (byRule.get(f.rule) ?? 0) + 1);
  for (const f of warns) console.warn(`  ⚠ [${f.rule}] ${f.where}: ${f.detail}`);
  for (const f of errors) console.error(`  ✗ [${f.rule}] ${f.where}: ${f.detail}`);
  const summary = [...byRule].map(([r, n]) => `${r}=${n}`).join(", ") || "該当なし";
  console.log(`display-semantics: error ${errors.length} / warning ${warns.length} (${summary})`);
  if (errors.length > 0) process.exit(1);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
