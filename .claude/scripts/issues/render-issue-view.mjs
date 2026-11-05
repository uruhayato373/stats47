#!/usr/bin/env node
/**
 * 問いの台帳を人が読む一覧の画面 (HTML 1 枚) にする。台帳を変えたら作り直す。
 *
 *   node .claude/scripts/issues/render-issue-view.mjs [出力先]   # 既定は /tmp/stats47-issue-view.html
 *
 * 出力は Artifact (claude.ai) に載せる前提の断片 (<title>・<style>・本文・<script>)。データは埋め込むので外部取得をしない。
 * 台帳・検査・棚卸しの規則は issue-graph-core.mjs が正本で、ここは見せ方だけを持つ。
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { datasetDir, datasetPath } from "../../../config/datasets.mjs";
import { classifyCoverage, computeReach, indexPages, parentIdOf, parseCsv, READ_THRESHOLD, sumTraffic } from "./issue-graph-core.mjs";

const PROJECT_ROOT = resolve(fileURLToPath(import.meta.url), "../../../..");
const SITE = "https://stats47.jp";
const out = process.argv[2] ?? "/tmp/stats47-issue-view.html";
const readJson = (rel) => JSON.parse(readFileSync(join(PROJECT_ROOT, rel), "utf8"));

/** ID の頭文字 → 分野名。画面の見出しだけに使う (分類軸ではない) */
const DOMAINS = {
  A: "結婚・出生・家族", B: "外国人・人の移動", C: "治安・安全", D: "所得・仕事・格差", E: "教育・子ども",
  F: "健康・医療・体格", G: "高齢化・介護", H: "まち・住まい・交通", I: "行政・財政・政治", J: "気候・災害・環境",
  K: "食と家計", L: "住む場所の選択", M: "産業・産地",
};

const pagesDir = datasetDir("content.pages");
const pages = indexPages(readdirSync(join(PROJECT_ROOT, pagesDir)).filter((f) => f.endsWith(".json")).map((f) => readJson(`${pagesDir}/${f}`)));
const { issues } = readJson(datasetPath("content.issues"));
const { links } = readJson(datasetPath("content.issue-links"));

const snapDir = datasetDir("gsc.snapshots");
const weeks = existsSync(join(PROJECT_ROOT, snapDir))
  ? readdirSync(join(PROJECT_ROOT, snapDir)).filter((w) => /^\d{4}-W\d{2}$/.test(w)).sort().slice(-4)
  : [];
const traffic = sumTraffic(weeks.map((w) => join(PROJECT_ROOT, snapDir, w, "pages.csv")).filter(existsSync).map((f) => parseCsv(readFileSync(f, "utf8"))));
const { byKind, orphanRead } = classifyCoverage({ pages, reach: computeReach({ issues, links, pages }), traffic });

const ref = (id) => {
  const p = pages.get(id);
  return p ? { id, kind: p.kind, title: p.title, href: SITE + p.href } : { id, kind: id.split(":")[0], title: id, href: null };
};
const view = issues.map((i) => ({
  id: i.id.slice("issue:".length),
  parent: parentIdOf(i.id)?.slice("issue:".length) ?? null,
  level: i.level,
  question: i.question,
  unit: i.unit,
  answerability: i.answerability,
  sensitive: i.sensitive,
  status: i.status,
  theme: i.primaryTheme ? ref(i.primaryTheme) : null,
  dataNote: i.dataNote ?? null,
  pitfall: i.pitfall ?? null,
  queries: i.queries ?? [],
  answers: links.filter((l) => l.issue === i.id && l.role === "answers").map((l) => ref(l.page)),
  evidence: links.filter((l) => l.issue === i.id && l.role === "evidence").map((l) => ref(l.page)),
}));

const payload = {
  generated: new Date().toISOString().slice(0, 10),
  weeks,
  threshold: READ_THRESHOLD,
  domains: DOMAINS,
  issues: view,
  coverage: byKind,
  orphanTop: orphanRead.slice(0, 20).map((o) => ({ ...o, href: SITE + (pages.get(o.id)?.href ?? "") })),
};

const html = readFileSync(join(PROJECT_ROOT, ".claude/scripts/issues/issue-view.template.html"), "utf8")
  .replace("/*__DATA__*/null", JSON.stringify(payload).replace(/</g, "\\u003c"));
writeFileSync(out, html);
console.log(`✓ 問いの一覧: ${view.length} 件 → ${out}`);
