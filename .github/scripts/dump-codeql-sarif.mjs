#!/usr/bin/env node
/**
 * CodeQL の SARIF から検出内容 (rule / severity / file:line / message) の表を出す。
 *
 * 使い方:
 *   node .github/scripts/dump-codeql-sarif.mjs <sarif-dir>
 *
 * なぜ必要か:
 *   CodeQL の検出結果を読む経路は Security タブと code-scanning API の 2 つだけで、
 *   どちらも参照できない環境がある (このリポジトリの一部セッションは proxy が 403 を返す)。
 *   件数だけが見えて中身が見えないと原因を推測で当てにいくことになり、実際に 3 回外した。
 *   job summary に出しておけば誰でも読める。
 *
 * scope: 表示のみ。exit code は常に 0 (このスクリプトが job の合否を決めない)。
 *        合否は codeql-action 側の check run が持つ。
 */

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const dir = process.argv[2];
if (!dir) {
  console.log("usage: dump-codeql-sarif.mjs <sarif-dir>");
  process.exit(0);
}

/** SARIF 1 ファイルを行に畳む。rule メタ (severity) は driver.rules 側にあるので id で引く */
function rowsFromSarif(sarif) {
  const rows = [];
  for (const run of sarif.runs ?? []) {
    const meta = new Map((run.tool?.driver?.rules ?? []).map((r) => [r.id, r]));
    for (const res of run.results ?? []) {
      const rule = meta.get(res.ruleId) ?? {};
      const loc = res.locations?.[0]?.physicalLocation;
      rows.push({
        rule: res.ruleId ?? "?",
        sev: String(
          rule.properties?.["security-severity"] ??
            rule.properties?.severity ??
            res.level ??
            "?"
        ),
        path: loc?.artifactLocation?.uri ?? "?",
        line: loc?.region?.startLine ?? "?",
        msg: (res.message?.text ?? "").replace(/\s+/g, " ").slice(0, 160),
      });
    }
  }
  return rows;
}

let files;
try {
  files = readdirSync(dir).filter((f) => f.endsWith(".sarif"));
} catch {
  console.log(`### CodeQL findings\n\n${dir} が無い (analyze が SARIF を出す前に失敗した)`);
  process.exit(0);
}

const rows = [];
for (const f of files) {
  try {
    rows.push(...rowsFromSarif(JSON.parse(readFileSync(join(dir, f), "utf-8"))));
  } catch (e) {
    console.log(`- ${f} の読み込みに失敗: ${e.message}`);
  }
}

// severity は数値文字列 ("9.8") のことが多い。数値として降順、同値は path 順
rows.sort((a, b) => Number(b.sev) - Number(a.sev) || a.path.localeCompare(b.path));

const out = [`### CodeQL findings: ${rows.length} 件`, ""];
if (rows.length === 0) {
  out.push("検出なし");
} else {
  out.push("| severity | rule | file:line | message |", "|---|---|---|---|");
  for (const r of rows) {
    out.push(`| ${r.sev} | \`${r.rule}\` | \`${r.path}:${r.line}\` | ${r.msg} |`);
  }
}
console.log(out.join("\n"));
