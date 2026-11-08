#!/usr/bin/env tsx
/**
 * 分析の結果から、確認できる記事の下書きを作る。
 *
 *   npm run analysis:draft -- --analysis analysis:H01-vacancy-population --result .local/analysis/h01/result.json
 *   npm run analysis:draft -- --analysis <id> --result <file> --figures-only   # 図と指示文だけ (書き手を呼ばない)
 *
 * 図・データ・出典を contents/blog/<slug>/data へ書き、執筆の指示文を作り、headless の書き手と審査へ渡す。
 * published: false のまま止まり、公開も R2 への書き込みもしない。背景画像は別の工程で、残りは npm run issues:figures で見る。
 * 既に article.md がある記事は上書きしない。
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { renderStackedChart } from "../../../apps/admin/lib/template-composition-stacked";
import { renderGroupBoxplotChart } from "../../../apps/admin/lib/template-group-boxplot";
import { renderGroupedBarsChart } from "../../../apps/admin/lib/template-grouped-bars";
import { renderRelationshipScatterChart } from "../../../apps/admin/lib/template-relationship-scatter";
import { renderLineChart } from "../../../apps/admin/lib/template-trend-line";
import { CHART_THEMES } from "../../../apps/remotion/src/features/data-cards/chart-theme";
import { datasetPath } from "../../../config/datasets.mjs";
import { buildChart, buildChartData, buildChartSource, buildMaterials, draftInputProblems } from "./analysis-draft-core.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const GENERATED_BY = ".claude/scripts/analysis/analysis-draft.ts";
// line は chart.series を書くと 2 時点の変化 (スロープ) になる。stacked-bar は 100% 積み上げ
const RENDERERS = {
  "grouped-bar": renderGroupedBarsChart,
  "stacked-bar": renderStackedChart,
  line: renderLineChart,
  scatter: renderRelationshipScatterChart,
  boxplot: renderGroupBoxplotChart,
} as const;

const arg = (name: string) => {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
const analysisId = arg("--analysis");
const resultPath = arg("--result");
if (!analysisId || !resultPath) {
  console.error("引数: --analysis <id> --result <result.json> [--figures-only]");
  process.exit(2);
}
const readJson = (path: string) => JSON.parse(readFileSync(path, "utf8"));
const writeJson = (path: string, value: unknown) => writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
const run = (command: string, args: string[]) => {
  const { status } = spawnSync(command, args, { cwd: ROOT, stdio: "inherit", shell: process.platform === "win32" });
  if (status !== 0) throw new Error(`${command} ${args[0]} が exit ${status}`);
};

const analysis = readJson(join(ROOT, datasetPath("content.analyses"))).analyses.find((a: { id: string }) => a.id === analysisId);
if (!analysis) {
  console.error(`台帳に無い: ${analysisId}`);
  process.exit(2);
}
const figures = readJson(join(ROOT, datasetPath("content.figures"))).figures.filter((f: { analysis: string }) => f.analysis === analysisId);
const problems = draftInputProblems({ analysis, figures, supportedTemplates: Object.keys(RENDERERS) });
if (problems.length) {
  for (const p of problems) console.error(`✗ ${p}`);
  process.exit(1);
}

const result = readJson(resultPath);
const spec = readJson(join(ROOT, analysis.spec));
const { article } = analysis;
const articleDir = join(ROOT, "contents/blog", article.slug);
const dataDir = join(articleDir, "data");
mkdirSync(dataDir, { recursive: true });

for (const figure of figures) {
  const { name } = figure.chart;
  // buildChart は図の型に合った形を返す。図の型と描画の組は台帳の検査 draftInputProblems が保証する
  const render = RENDERERS[figure.template as keyof typeof RENDERERS] as unknown as (chart: unknown, theme: typeof CHART_THEMES.light) => string;
  const built = buildChart(figure, result);
  writeFileSync(join(dataDir, `${name}.svg`), render(built, CHART_THEMES.light));
  writeFileSync(join(dataDir, `${name}-dark.svg`), render(built, CHART_THEMES.dark));
  writeJson(join(dataDir, `${name}.json`), buildChartData(figure, built, result));
  writeJson(join(dataDir, `${name}.source.json`), buildChartSource({ figure, spec, generatedBy: GENERATED_BY, result }));
}
writeJson(join(dataDir, "analysis-summary.json"), result);
console.log(`図 ${figures.length} 枚 → ${join("contents/blog", article.slug, "data")}`);

if (process.argv.includes("--figures-only")) {
  console.log("図だけを描いた。指示文と書き手は使っていない (--figures-only)");
  process.exit(0);
}
const materials = join(ROOT, ".local/analysis", `${article.slug}.material.md`);
mkdirSync(dirname(materials), { recursive: true });
writeFileSync(materials, buildMaterials({ analysis }));
const pairs = (items: Array<{ href: string; label: string }> = []) => items.map((i) => `${i.href}|${i.label}`).join(",");
// node は shell を通さず起動する。題や説明に空白や | が入っても引数が割れないように
const prompt = spawnSync(process.execPath, [
  ".claude/scripts/blog/build-article-prompt.mjs",
  "--slug", article.slug,
  "--archetype", "Q",
  "--title-hint", article.titleHint,
  "--links", pairs(article.links),
  "--source-links", pairs(article.sourceLinks),
  "--figures", figures.map((f: { chart: { name: string; alt: string } }) => `${f.chart.name}.svg|${f.chart.alt}`).join(","),
  "--chars", article.chars,
  "--materials", materials,
], { cwd: ROOT, stdio: "inherit" });
if (prompt.status !== 0) process.exit(prompt.status ?? 1);

if (existsSync(join(articleDir, "article.md"))) {
  console.error(`✗ article.md が既にある。上書きしない: ${article.slug}`);
  process.exit(1);
}
run("npx", ["tsx", "packages/ai-content/src/scripts/write-blog-headless.ts", "--slugs", article.slug, "--retries", "2", "--revise-rounds", "2"]);
run("npm", ["run", "-s", "issues:figures"]);
console.log("公開はしていない。確認: npm run blog:preview -- --slug " + article.slug);
