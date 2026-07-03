/**
 * ニュースのトピック(自由文キーワード) → 該当統計指標キー を高速発見するための
 * ローカル索引 JSON を生成する。
 *
 * DB は使わない。metric config SSOT (packages/data-configs/src/metrics/*.ts) を
 * registry 経由で読み、索引に使えるフィールドだけを抽出して R2 から再生成できる
 * ローカルキャッシュ (.claude/state/sns/metric-discovery-index.json) に書き出す。
 *
 * 実行: npx tsx .claude/scripts/sns/build-discovery-index.ts
 *
 * 配置規約: .claude/rules/skill-code-placement.md (スキル利用スクリプトは .claude/scripts/<domain>/)
 */
import * as path from "path";
import * as fs from "fs";
import { listAllMetrics } from "../../../packages/data-configs/src/registry";

const PROJECT_ROOT = path.resolve(__dirname, "../../..");
const OUTPUT_PATH = path.join(
  PROJECT_ROOT,
  ".claude/state/sns/metric-discovery-index.json",
);

interface DiscoveryEntry {
  key: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  category: string;
  additionalCategories: string[];
  sourceName: string | null;
  unit: string;
}

function buildIndex(): DiscoveryEntry[] {
  const metrics = listAllMetrics();

  return metrics.map((m) => ({
    key: m.key,
    title: m.title,
    subtitle: m.subtitle ?? null,
    description: m.description ?? null,
    seoTitle: m.seoTitle ?? null,
    seoDescription: m.seoDescription ?? null,
    category: m.category,
    additionalCategories: m.additionalCategories ?? [],
    sourceName:
      "displayName" in m.source && m.source.displayName
        ? m.source.displayName
        : null,
    unit: m.unit,
  }));
}

function main() {
  const entries = buildIndex();

  const outDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    count: entries.length,
    entries,
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(payload, null, 0));

  console.log(
    `[build-discovery-index] wrote ${entries.length} metrics -> ${path.relative(PROJECT_ROOT, OUTPUT_PATH)}`,
  );
}

main();
