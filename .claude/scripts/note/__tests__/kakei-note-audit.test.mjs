// lib/kakei-note-audit.mjs のテスト。
// 熊本の実 chart-data.json + 合成 evidence-data/ranking-data/SSOT/known-ranking-keys で、
// (1) 生成直後の draft が全 check PASS になること、(2) 1条件ずつ壊すと当該 check だけが
// FAIL に転じ、他の check は PASS のまま残ることを確認する。
// SSOT/known-ranking-keys も合成にする理由: auditDraft() は既定でリポジトリの実ファイル
// (expense-evidence.json / known-ranking-keys.ts) を読むが、このテストは「監査ロジックの
// 正しさ」だけを検証したいので opts.expenseEvidenceSsot / opts.knownRankingKeys で注入し、
// 実ファイルの現在の中身に依存しないようにする (再現性)。
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { buildDraft, imageNames, titleSha256 } from "../lib/kakei-note-body.mjs";
import { auditDraft } from "../lib/kakei-note-audit.mjs";

const NOTE_DIR = join(dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = join(NOTE_DIR, "..", "..", "..");
const CHART_DATA = JSON.parse(
  readFileSync(join(ROOT, "docs/31_note記事原稿/a-kakei-kumamoto/chart-data.json"), "utf8"),
);

const TITLE = "テスト用タイトル: 熊本県の家計は教育に偏っている";

const EVIDENCE_DATA = {
  _meta: {
    slug: "a-kakei-kumamoto",
    prefCode: "43000",
    prefName: "熊本県",
    cityName: "熊本市",
    year: "2024",
    titleSha: titleSha256(TITLE),
    thresholds: { strong: 15, weak: 31 },
    ssotVersion: "test",
  },
  dominant: {
    catName: "教育",
    ratio: 1.439828888667507,
    side: "above",
    shareMetricKey: "education-expenditure-ratio-multi-person-households",
    shareTitle: "教育費が消費支出全体に占める割合を都道府県別にまとめた教育費支出割合の総合指数",
    unit: "％",
    year: "2024",
    rank: 9,
    value: 4.5,
    rankingUrl: "https://stats47.jp/ranking/education-expenditure-ratio-multi-person-households",
    chartName: "education-expenditure-ratio-multi-person-households-tile-grid",
  },
  evidence: [
    {
      metricKey: "private-university-student-ratio",
      title: "大学生全体に占める私立大学在籍者数の割合を都道府県別にまとめた私立大学進学傾向の総合指標",
      unit: "％",
      year: "2024",
      rank: 20,
      value: 59.4,
      direction: "same",
      verdict: "weak",
      rankingUrl: "https://stats47.jp/ranking/private-university-student-ratio",
    },
    {
      metricKey: "high-school-advancement-rate",
      title: "高等学校卒業者のうち大学等への進学者が占める割合を都道府県別にまとめた高校卒業後進学率の指標",
      unit: "％",
      year: "2023",
      rank: 38,
      value: 50.4,
      direction: "same",
      verdict: "contrary",
      rankingUrl: "https://stats47.jp/ranking/high-school-advancement-rate",
    },
  ],
};

function makeRanking(rows) {
  return { unit: "％", data: rows };
}
const SHARE_RANKING = makeRanking([
  { rank: 1, areaName: "埼玉県", value: 6.0 },
  { rank: 2, areaName: "千葉県", value: 6.0 },
  { rank: 2, areaName: "東京都", value: 6.0 },
  { rank: 9, areaName: "熊本県", value: 4.5 },
  { rank: 47, areaName: "秋田県", value: 0.9 },
]);
const EV1_RANKING = makeRanking([
  { rank: 1, areaName: "神奈川県", value: 92.7 },
  { rank: 20, areaName: "熊本県", value: 59.4 },
  { rank: 47, areaName: "島根県", value: 0.0 },
]);
const EV2_RANKING = makeRanking([
  { rank: 1, areaName: "東京都", value: 74.1 },
  { rank: 38, areaName: "熊本県", value: 50.4 },
  { rank: 47, areaName: "沖縄県", value: 46.7 },
]);

const EXISTING_MARKDOWN = `---
title: "${TITLE}"
description: "旧いdescription (上書きされるはず)"
status: published
note_url: "https://note.com/stats47/n/nOLDVALUE"
published_at: "2026-09-06"
published: true
tags:
  - 家計調査
  - 熊本県
  - 都道府県
  - 統計データ
  - stats47
---

旧い本文。生成器はこれを丸ごと置き換える。
`;

const draftResult = buildDraft({
  chartData: CHART_DATA,
  evidenceData: EVIDENCE_DATA,
  existingMarkdown: EXISTING_MARKDOWN,
  shareRanking: SHARE_RANKING,
  ev1Ranking: EV1_RANKING,
  ev2Ranking: EV2_RANKING,
});
assert.equal(draftResult.ok, true, "テスト前提: buildDraft が成功すること");
const BASE_MARKDOWN = draftResult.markdown;

const NAMES = imageNames(EVIDENCE_DATA);
const FILES = {
  images: [
    `${NAMES.categoryRatio}.png`,
    `${NAMES.shareTileGrid}.png`,
    `${NAMES.extremeItems}.png`,
    `${NAMES.ev1Ranking}.png`,
    `${NAMES.ev2Ranking}.png`,
  ],
  data: [
    `${NAMES.shareTileGrid}.json`,
    `${NAMES.shareTileGrid}.source.json`,
    `${NAMES.ev1Ranking}.json`,
    `${NAMES.ev1Ranking}.source.json`,
    `${NAMES.ev2Ranking}.json`,
    `${NAMES.ev2Ranking}.source.json`,
  ],
  dataJson: {
    [`${NAMES.shareTileGrid}.json`]: SHARE_RANKING,
    [`${NAMES.ev1Ranking}.json`]: EV1_RANKING,
    [`${NAMES.ev2Ranking}.json`]: EV2_RANKING,
  },
};

const SSOT = {
  version: "test",
  thresholds: { strong: 15, weak: 31 },
  entries: [
    {
      catName: "教育",
      shareMetricKey: "education-expenditure-ratio-multi-person-households",
      evidence: [
        { metricKey: "private-university-student-ratio", direction: "same", priority: 1, rationale: "x" },
        { metricKey: "high-school-advancement-rate", direction: "same", priority: 2, rationale: "x" },
      ],
    },
  ],
};
const KNOWN_KEYS = new Set([
  "education-expenditure-ratio-multi-person-households",
  "private-university-student-ratio",
  "high-school-advancement-rate",
]);
const AUDIT_OPTS = { expenseEvidenceSsot: SSOT, knownRankingKeys: KNOWN_KEYS };

function audit(markdown) {
  return auditDraft({ markdown, chartData: CHART_DATA, evidenceData: EVIDENCE_DATA, files: FILES }, AUDIT_OPTS);
}

function checksById(result) {
  return Object.fromEntries(result.checks.map((c) => [c.id, c]));
}

/** markdown を frontmatter ブロックと本文に分ける (mutation を片方だけに閉じ込めるため) */
function splitFrontmatterAndBody(markdown) {
  const m = markdown.match(/^(---\n[\s\S]*?\n---\n)([\s\S]*)$/);
  assert.ok(m, "markdown に frontmatter が見つからない");
  return { fmBlock: m[1], body: m[2] };
}

function mutateBody(searchStr, replaceStr) {
  const { fmBlock, body } = splitFrontmatterAndBody(BASE_MARKDOWN);
  assert.ok(body.includes(searchStr), `mutation対象がbodyに見つからない: ${searchStr}`);
  return fmBlock + body.replace(searchStr, replaceStr);
}

function mutateFrontmatter(searchRe, replaceStr) {
  const { fmBlock, body } = splitFrontmatterAndBody(BASE_MARKDOWN);
  assert.ok(searchRe.test(fmBlock), `mutation対象がfrontmatterに見つからない: ${searchRe}`);
  return fmBlock.replace(searchRe, replaceStr) + body;
}

/** failingId だけが FAIL で、他の全 check は PASS のままであることを検証する */
function assertOnlyFails(markdown, failingId) {
  const result = audit(markdown);
  const byId = checksById(result);
  assert.equal(result.ok, false, "audit全体はNGになるはず");
  assert.equal(byId[failingId].ok, false, `${failingId} が FAIL になるはず: ${byId[failingId].detail}`);
  for (const [id, c] of Object.entries(byId)) {
    if (id === failingId) continue;
    assert.equal(c.ok, true, `${id} は PASS のままのはずが FAIL: ${c.detail}`);
  }
}

// ---------- 生成直後の draft は全 PASS ----------

test("生成直後の draft.md は全 check が PASS", () => {
  const result = audit(BASE_MARKDOWN);
  assert.equal(result.ok, true, JSON.stringify(result.checks.filter((c) => !c.ok), null, 2));
  assert.deepEqual(
    result.checks.map((c) => c.id).sort(),
    ["evidence-ssot", "frontmatter", "images", "length", "links", "mentions", "ng-words", "numbers"].sort(),
  );
  for (const c of result.checks) assert.equal(c.ok, true, `${c.id}: ${c.detail}`);
});

// ---------- 1条件ずつ壊す ----------

test("数値を1箇所だけ入力に無い値 (1.45倍) に変えると numbers だけ FAIL", () => {
  const mutated = mutateBody("1.44倍", "1.45倍");
  assertOnlyFails(mutated, "numbers");
});

test("画像行を1行削除すると images だけ FAIL", () => {
  const mutated = mutateBody("\n\n![47県庁所在市平均と比べて特徴的な品目](images/extreme-items.png)\n\n", "\n\n");
  assertOnlyFails(mutated, "images");
});

test("NG語を1語挿入すると ng-words だけ FAIL", () => {
  const mutated = mutateBody("ここで示した対応関係", "ここで示した対応関係(かもしれない)");
  assertOnlyFails(mutated, "ng-words");
});

test("ranking link の key を偽物に差し替えると links だけ FAIL", () => {
  const mutated = mutateBody(
    "/ranking/high-school-advancement-rate)",
    "/ranking/fake-metric-key-xyz)",
  );
  assertOnlyFails(mutated, "links");
});

test("frontmatter の description を改変すると frontmatter だけ FAIL", () => {
  const mutated = mutateFrontmatter(/^description:.*$/m, 'description: "改変後のdescription"');
  assertOnlyFails(mutated, "frontmatter");
});

test("frontmatter の title を改変すると (titleSha不一致で) frontmatter だけ FAIL", () => {
  const mutated = mutateFrontmatter(/^title:.*$/m, 'title: "改変後のタイトル"');
  assertOnlyFails(mutated, "frontmatter");
});

// ---------- --no-files 相当: files が空でも images/svg-lint 系だけ非致命 ----------

test("opts.noFiles=true で png (images) だけ未生成のとき images は skipped (非致命) になる", () => {
  // 実運用の --no-files と同じ状況を再現する: data/*.json (evidence-data 由来) は既に
  // あるが、images/*.png (チャート生成は別ワークパッケージ) がまだ無い。
  const result = auditDraft(
    { markdown: BASE_MARKDOWN, chartData: CHART_DATA, evidenceData: EVIDENCE_DATA, files: { ...FILES, images: [] } },
    { ...AUDIT_OPTS, noFiles: true },
  );
  const byId = checksById(result);
  assert.equal(byId.images.skipped, true);
  assert.equal(byId.images.ok, false);
  // images 以外は全部 PASS のままで、全体としては ok:true (skipped は集計から除外される)
  for (const [id, c] of Object.entries(byId)) {
    if (id === "images") continue;
    assert.equal(c.ok, true, `${id}: ${c.detail}`);
  }
  assert.equal(result.ok, true);
});

test("opts.noFiles=false (既定) で png が無いと images が致命 FAIL になり全体もNG", () => {
  const result = auditDraft(
    { markdown: BASE_MARKDOWN, chartData: CHART_DATA, evidenceData: EVIDENCE_DATA, files: { ...FILES, images: [] } },
    AUDIT_OPTS,
  );
  const byId = checksById(result);
  assert.equal(byId.images.ok, false);
  assert.equal(byId.images.skipped, undefined);
  assert.equal(result.ok, false);
});
