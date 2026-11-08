#!/usr/bin/env node
/**
 * 問いの分析の前に、使える指標を棚卸しする (npm run analysis:inventory)。
 *
 *   npm run analysis:inventory -- --terms 製造,工業 --level city [--check-r2] [--out <json>]
 *
 * data/metrics/*.ts の key・title・subtitle・description が語に当たる指標を、粒度・年・公開状態・出典つきで並べる。
 * --check-r2 は公開 R2 の app/stats/<key>/cities.json (prefecture は prefectures.json) を読むだけで、書かない。
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import { datasetDir } from "../../../config/datasets.mjs";
import { parseMetric, selectMetrics, summarizeRows } from "./analysis-inventory-core.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const R2_PUBLIC = "https://storage.stats47.jp/app/stats";

const { values } = parseArgs({
  options: {
    terms: { type: "string" },
    level: { type: "string" },
    "check-r2": { type: "boolean", default: false },
    out: { type: "string" },
  },
});
if (!values.terms) {
  console.error("使い方: npm run analysis:inventory -- --terms 製造,工業 [--level city|prefecture] [--check-r2] [--out <json>]");
  process.exit(2);
}
if (values.level && !["city", "prefecture"].includes(values.level)) {
  console.error(`--level は city か prefecture: ${values.level}`);
  process.exit(2);
}
const terms = values.terms.split(",").map((t) => t.trim()).filter(Boolean);

const dir = join(ROOT, datasetDir("metrics.definitions"));
const metrics = readdirSync(dir)
  .filter((f) => f.endsWith(".ts"))
  .map((f) => parseMetric(readFileSync(join(dir, f), "utf8"), f))
  .filter((m) => m !== null);

const selected = selectMetrics(metrics, { terms, level: values.level });

if (values["check-r2"]) {
  const file = values.level === "prefecture" ? "prefectures.json" : "cities.json";
  for (const m of selected) {
    const url = `${R2_PUBLIC}/${m.key}/${file}`;
    try {
      const res = await fetch(url);
      m.r2 = res.ok ? { url, ...summarizeRows((await res.json()).rows) } : { url, status: res.status };
    } catch (error) {
      m.r2 = { url, error: String(error) };
    }
  }
}

const report = { terms, level: values.level ?? null, scanned: metrics.length, count: selected.length, metrics: selected };
if (values.out) {
  writeFileSync(values.out, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`${selected.length} 件 (走査 ${metrics.length} 件) → ${values.out}`);
} else {
  console.log(JSON.stringify(report, null, 2));
}
