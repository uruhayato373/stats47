#!/usr/bin/env node
/**
 * 記事本文の数値を分析の summary JSON と照合する (npm run analysis:numbers)。
 *
 *   npm run analysis:numbers -- --article <article.md> --summary <analysis-summary.json> [--strict] [--out <json>]
 *
 * 丸め (本文の桁で四捨五入)・% と割合・割・百万円/億円/万円・万人・千の区切りを読む。
 * 一致しない数値は summary に根拠が無い候補で、警告にとどめる (終了コード 0)。--strict のときだけ 1 で止める。
 */
import { readFileSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";

import { checkArticleNumbers } from "./article-numbers-core.mjs";

const { values } = parseArgs({
  options: {
    article: { type: "string" },
    summary: { type: "string" },
    strict: { type: "boolean", default: false },
    out: { type: "string" },
  },
});
if (!values.article || !values.summary) {
  console.error("使い方: npm run analysis:numbers -- --article <md> --summary <json> [--strict] [--out <json>]");
  process.exit(2);
}

const result = checkArticleNumbers(readFileSync(values.article, "utf8"), JSON.parse(readFileSync(values.summary, "utf8")));
const json = `${JSON.stringify(result, null, 2)}\n`;
if (values.out) {
  writeFileSync(values.out, json);
  console.log(`照合 ${result.total} 件: 一致 ${result.matched.length} / 不一致 ${result.unmatched.length} → ${values.out}`);
} else {
  process.stdout.write(json);
}
if (values.strict && result.unmatched.length > 0) process.exit(1);
