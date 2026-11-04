#!/usr/bin/env npx tsx
/**
 * 家計調査の全ランキングへのリンク一覧を、品目台帳の費目で分けて生成する (値は読まない)。
 * テーマは載せた指標の値をすべて読むので、全品目は表に載せず、この一覧から到達させる。
 * 出力: apps/web/src/features/theme-dashboard/lib/kakei-ranking-directory.generated.ts
 * 実行: npx tsx .claude/scripts/themes/generate-kakei-ranking-directory.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { METRICS_REGISTRY } from "@stats47/data-configs/registry";
import { datasetPath } from "../../../config/datasets.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const OUT_PATH = resolve(ROOT, "apps/web/src/features/theme-dashboard/lib/kakei-ranking-directory.generated.ts");
const LEDGER_PATH = resolve(ROOT, datasetPath("estat.kakei-ledger"));
const OTHER_GROUP = "家計全体";

interface LedgerItem {
  code: string;
  name: string;
  measure: string;
  level: string;
  parentCode: string | null;
  metrics: { key: string }[];
}

const { items } = JSON.parse(readFileSync(LEDGER_PATH, "utf8")) as { items: LedgerItem[] };
const amountByCode = new Map(items.filter((i) => i.measure === "amount").map((i) => [i.code, i]));

/** 品目の親をたどって 10 大費目の名前を返す。先頭の番号は読者に要らないので外す */
function majorGroupOf(item: LedgerItem): string {
  let current: LedgerItem | undefined = amountByCode.get(item.code) ?? item;
  while (current && current.level !== "1" && current.parentCode) current = amountByCode.get(current.parentCode);
  return current?.level === "1" && /^\d/.test(current.name) ? current.name.replace(/^\d+\s*/, "") : OTHER_GROUP;
}

const groupOfMetric = new Map<string, string>();
for (const item of items) {
  for (const { key } of item.metrics) groupOfMetric.set(key, majorGroupOf(item));
}

const groups = new Map<string, { rankingKey: string; label: string }[]>();
for (const metric of Object.values(METRICS_REGISTRY)) {
  if (metric.isActive === false || metric.source.kind !== "kakei-chousa") continue;
  const title = groupOfMetric.get(metric.key) ?? OTHER_GROUP;
  groups.set(title, [...(groups.get(title) ?? []), { rankingKey: metric.key, label: metric.title }]);
}

const directory = [...groups.entries()]
  .map(([title, links]) => ({ title, links: links.sort((a, b) => a.label.localeCompare(b.label, "ja")) }))
  .sort((a, b) => b.links.length - a.links.length);

writeFileSync(OUT_PATH, `// 生成物。手で編集しない。.claude/scripts/themes/generate-kakei-ranking-directory.ts が作る
export const KAKEI_RANKING_DIRECTORY = ${JSON.stringify(directory)} as const;
`);
console.log(directory.map((g) => `${g.title} ${g.links.length}`).join(" / "));
