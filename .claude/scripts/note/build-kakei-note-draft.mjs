#!/usr/bin/env node
// note 家計シリーズ (a-kakei-<pref>) の draft.md 本文を chart-data.json + evidence-data.json
// から決定的に生成する (LLM不使用)。frontmatter は既存 draft.md のものを保持し、description
// だけ生成値で上書きする。title の sha256 が evidence-data._meta.titleSha と一致しない場合は
// 何も書かず exit 1 (evidence-data が古い/別記事の可能性があるため)。
//
// 使い方:
//   node build-kakei-note-draft.mjs --slug a-kakei-kumamoto
//   node build-kakei-note-draft.mjs --all [--check]
//   node build-kakei-note-draft.mjs --slug a-kakei-kumamoto --check   (差分行数を出すだけで書かない)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildDraft } from "./lib/kakei-note-body.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const OUT_BASE = path.join(ROOT, "docs/31_note記事原稿");

const arg = (name) => {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : null;
};

function countLineDiff(oldText, newText) {
  const a = oldText.split("\n");
  const b = newText.split("\n");
  const max = Math.max(a.length, b.length);
  let diff = 0;
  for (let i = 0; i < max; i++) if (a[i] !== b[i]) diff++;
  return diff;
}

function processSlug(slug, { check }) {
  const slugDir = path.join(OUT_BASE, slug);
  const chartDataPath = path.join(slugDir, "chart-data.json");
  const evidenceDataPath = path.join(slugDir, "evidence-data.json");
  const draftPath = path.join(slugDir, "draft.md");
  for (const [label, p] of [
    ["chart-data.json", chartDataPath],
    ["evidence-data.json", evidenceDataPath],
    ["draft.md", draftPath],
  ]) {
    if (!fs.existsSync(p)) {
      console.error(`[skip] ${slug}: ${label} が無い`);
      return false;
    }
  }

  const chartData = JSON.parse(fs.readFileSync(chartDataPath, "utf8"));
  const evidenceData = JSON.parse(fs.readFileSync(evidenceDataPath, "utf8"));
  const existingMarkdown = fs.readFileSync(draftPath, "utf8");

  const [ev1, ev2] = evidenceData.evidence || [];
  const rankingDataPaths = {
    shareRanking: path.join(slugDir, "data", `${evidenceData.dominant?.shareMetricKey}-tile-grid.json`),
    ev1Ranking: ev1 ? path.join(slugDir, "data", `${ev1.metricKey}-prefecture-rankings.json`) : null,
    ev2Ranking: ev2 ? path.join(slugDir, "data", `${ev2.metricKey}-prefecture-rankings.json`) : null,
  };
  for (const [label, p] of Object.entries(rankingDataPaths)) {
    if (!p || !fs.existsSync(p)) {
      console.error(
        `[skip] ${slug}: ${label} (${p || "metricKey不明"}) が無い。build-kakei-note-evidence-data.mjs を先に実行すること`,
      );
      return false;
    }
  }
  const shareRanking = JSON.parse(fs.readFileSync(rankingDataPaths.shareRanking, "utf8"));
  const ev1Ranking = JSON.parse(fs.readFileSync(rankingDataPaths.ev1Ranking, "utf8"));
  const ev2Ranking = JSON.parse(fs.readFileSync(rankingDataPaths.ev2Ranking, "utf8"));

  const result = buildDraft({ chartData, evidenceData, existingMarkdown, shareRanking, ev1Ranking, ev2Ranking });
  if (!result.ok) {
    console.error(`[fail] ${slug}: ${result.reason} (title の sha256 と evidence-data の titleSha が不一致の可能性)`);
    return false;
  }

  if (check) {
    const diff = countLineDiff(existingMarkdown, result.markdown);
    console.log(`[check] ${slug}: ${diff} 行が変化する (旧 ${existingMarkdown.split("\n").length}行 -> 新 ${result.markdown.split("\n").length}行)`);
    return true;
  }

  fs.writeFileSync(draftPath, result.markdown);
  console.log(`[ok] ${slug}: draft.md を更新 (本文 ${result.body.length} 文字)`);
  return true;
}

function main() {
  const single = arg("--slug");
  const all = process.argv.includes("--all");
  const check = process.argv.includes("--check");
  if (!single && !all) {
    console.error("usage: --slug a-kakei-<pref> [--check] または --all [--check]");
    process.exit(1);
  }

  const targets = single
    ? [single]
    : fs
        .readdirSync(OUT_BASE)
        .filter((d) => /^a-kakei-/.test(d))
        .filter((d) => fs.existsSync(path.join(OUT_BASE, d, "chart-data.json")))
        .sort();

  let ok = 0;
  let failed = 0;
  for (const slug of targets) {
    if (processSlug(slug, { check })) ok += 1;
    else failed += 1;
  }
  console.log(`[done] ok=${ok} failed=${failed}`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
