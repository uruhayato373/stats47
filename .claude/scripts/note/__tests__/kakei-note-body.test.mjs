// lib/kakei-note-body.mjs のテスト。
// 熊本の実 chart-data.json + 合成 (hand-authored) evidence-data で検証する。
// evidence-data を合成にする理由: R2 の実データは時間とともに変わるため、テストを
// 「今日の R2 の値」に依存させない (再現性)。実 evidence-data.json での実測は
// build-kakei-note-draft.mjs / audit-kakei-note-content.mjs を直接実行して確認する。
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  MIN_BODY_CHARS,
  buildBody,
  buildDescription,
  buildDraft,
  buildPCategories,
  buildPEvidence,
  extractFrontmatterField,
  fmtRank,
  fmtRatio,
  fmtValue,
  imageNames,
  splitCategoryGroups,
  titleSha256,
} from "../lib/kakei-note-body.mjs";
import { countBodyLength } from "../lib/kakei-note-audit.mjs";

const NOTE_DIR = join(dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = join(NOTE_DIR, "..", "..", "..");
const CHART_DATA = JSON.parse(
  readFileSync(join(ROOT, "docs/31_note記事原稿/a-kakei-kumamoto/chart-data.json"), "utf8"),
);

// ---- 合成 evidence-data (熊本の実 chart-data の dominant=教育 と揃えるが、値は手書き) ----

const TITLE = "テスト用タイトル: 熊本県の家計は教育に偏っている";

function makeEvidenceData({ ev1Verdict = "weak", ev2Verdict = "contrary" } = {}) {
  return {
    _meta: {
      slug: "a-kakei-kumamoto",
      prefCode: "43000",
      prefName: "熊本県",
      cityName: "熊本市",
      year: "2024",
      titleSha: titleSha256(TITLE),
      thresholds: { strong: 15, weak: 31 },
      ssotVersion: "2026-09-15",
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
        verdict: ev1Verdict,
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
        verdict: ev2Verdict,
        rankingUrl: "https://stats47.jp/ranking/high-school-advancement-rate",
      },
    ],
  };
}

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

function buildFixtureBody(evidenceData = makeEvidenceData()) {
  return buildBody({
    chartData: CHART_DATA,
    evidenceData,
    shareRanking: SHARE_RANKING,
    ev1Ranking: EV1_RANKING,
    ev2Ranking: EV2_RANKING,
  });
}

// ---------- (a) 画像5行の順序 ----------

test("(a) body には画像行が仕様どおりの順序・名前で5枚出現する", () => {
  const evidenceData = makeEvidenceData();
  const body = buildFixtureBody(evidenceData);
  const names = imageNames(evidenceData);
  const imageLines = body
    .split("\n")
    .filter((l) => /^!\[[^\]]*\]\(images\/[^)]+\.png\)$/.test(l.trim()));
  assert.equal(imageLines.length, 5);
  const expectedOrder = [
    names.categoryRatio,
    names.shareTileGrid,
    names.extremeItems,
    names.ev1Ranking,
    names.ev2Ranking,
  ];
  const actualOrder = imageLines.map((l) => l.match(/images\/([^)]+)\.png/)[1]);
  assert.deepEqual(actualOrder, expectedOrder);
});

// ---------- (b) verdict 3分岐の1文目 ----------

test("(b) buildPEvidence の1文目は verdict (strong/weak/contrary) ごとに切り替わる", () => {
  const dominant = { catName: "教育", side: "above" };
  const pref = "熊本県";
  const baseEv = {
    title: "テスト指標",
    rank: 5,
    value: 10.5,
    unit: "％",
    year: "2024",
    rankingUrl: "https://stats47.jp/ranking/test-metric",
  };

  const strong = buildPEvidence({ ev: { ...baseEv, verdict: "strong" }, pref, dominant, ranking: EV1_RANKING });
  assert.ok(strong.startsWith("テスト指標は熊本県が全国5位(10.5%、2024年)で、教育が高くなることと整合します。"));

  const weak = buildPEvidence({ ev: { ...baseEv, verdict: "weak" }, pref, dominant, ranking: EV1_RANKING });
  assert.ok(
    weak.startsWith("テスト指標は熊本県が全国5位(10.5%、2024年)で中位にあり、教育が高くなる理由としては説明力が弱い指標です。"),
  );

  const contrary = buildPEvidence({ ev: { ...baseEv, verdict: "contrary" }, pref, dominant, ranking: EV1_RANKING });
  assert.ok(
    contrary.startsWith("テスト指標は熊本県が全国5位(10.5%、2024年)で、教育の偏りとは逆方向にあり、この指標では説明できません。"),
  );
});

// ---------- (c) above/below の群分け・0件省略 ----------

test("(c) splitCategoryGroups は above を降順・below を昇順・closest を |ratio-1| 最小で返す (熊本の実データ)", () => {
  const { above, below, closest } = splitCategoryGroups(CHART_DATA.categoryBreakdown);
  assert.deepEqual(
    above.map((c) => c.catName),
    ["教育", "保健医療", "被服及び履物", "住居", "交通・通信", "食料", "その他の消費支出", "教養娯楽"],
  );
  assert.deepEqual(below.map((c) => c.catName), ["光熱・水道", "家具・家事用品"]);
  assert.equal(closest.catName, "教養娯楽");
});

test("(c) below 群が0件のとき「下回るのは」の文がまるごと省かれる", () => {
  const allAbove = CHART_DATA.categoryBreakdown.map((c) => ({ ...c, ratio: Math.max(c.ratio, 1.01) }));
  const dominant = { ...makeEvidenceData().dominant, city: "熊本市" };
  const p = buildPCategories({ chartData: { ...CHART_DATA, categoryBreakdown: allAbove }, dominant });
  assert.ok(!p.includes("下回るのは"));
  assert.ok(p.includes("47市平均を上回るのは10費目で"));
});

test("(c) above 群が0件のとき「上回るのは」の文がまるごと省かれる", () => {
  const allBelow = CHART_DATA.categoryBreakdown.map((c) => ({ ...c, ratio: Math.min(c.ratio, 0.99) }));
  const dominant = { ...makeEvidenceData().dominant, catName: "光熱・水道", ratio: 0.5, side: "below", city: "熊本市" };
  const p = buildPCategories({ chartData: { ...CHART_DATA, categoryBreakdown: allBelow }, dominant });
  assert.ok(!p.includes("上回るのは"));
  assert.ok(p.includes("下回るのは10費目で"));
});

// ---------- (d) frontmatter 保持・description 置換 ----------

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

test("(d) buildDraft は description 以外の frontmatter を一字一句保持する", () => {
  const evidenceData = makeEvidenceData();
  const result = buildDraft({
    chartData: CHART_DATA,
    evidenceData,
    existingMarkdown: EXISTING_MARKDOWN,
    shareRanking: SHARE_RANKING,
    ev1Ranking: EV1_RANKING,
    ev2Ranking: EV2_RANKING,
  });
  assert.equal(result.ok, true);
  for (const line of [
    `title: "${TITLE}"`,
    "status: published",
    'note_url: "https://note.com/stats47/n/nOLDVALUE"',
    'published_at: "2026-09-06"',
    "published: true",
    "  - 家計調査",
    "  - stats47",
  ]) {
    assert.ok(result.markdown.includes(line), `frontmatter に保持されているべき行: ${line}`);
  }
  assert.ok(!result.markdown.includes("旧いdescription"));
  const expectedDescription = buildDescription({
    chartData: CHART_DATA,
    evidenceData,
    pref: evidenceData._meta.prefName,
    city: evidenceData._meta.cityName,
  });
  assert.equal(result.description, expectedDescription);
  assert.ok(result.markdown.includes(`description: "${expectedDescription}"`));
  assert.ok(!result.markdown.includes("旧い本文"));
});

test("(d) title の sha256 が evidence-data._meta.titleSha と不一致なら書き込まず ok:false を返す", () => {
  const evidenceData = makeEvidenceData();
  evidenceData._meta.titleSha = "0".repeat(64);
  const result = buildDraft({
    chartData: CHART_DATA,
    evidenceData,
    existingMarkdown: EXISTING_MARKDOWN,
    shareRanking: SHARE_RANKING,
    ev1Ranking: EV1_RANKING,
    ev2Ranking: EV2_RANKING,
  });
  assert.equal(result.ok, false);
  assert.equal(result.reason, "title-sha-mismatch");
});

// ---------- (e) 同じ入力で2回生成が byte 一致 ----------

test("(e) 同じ入力から2回 buildBody / buildDraft を呼んでも byte 一致する (決定的)", () => {
  const evidenceData1 = makeEvidenceData();
  const evidenceData2 = makeEvidenceData();
  const body1 = buildFixtureBody(evidenceData1);
  const body2 = buildFixtureBody(evidenceData2);
  assert.equal(body1, body2);

  const draft1 = buildDraft({
    chartData: CHART_DATA,
    evidenceData: makeEvidenceData(),
    existingMarkdown: EXISTING_MARKDOWN,
    shareRanking: SHARE_RANKING,
    ev1Ranking: EV1_RANKING,
    ev2Ranking: EV2_RANKING,
  });
  const draft2 = buildDraft({
    chartData: CHART_DATA,
    evidenceData: makeEvidenceData(),
    existingMarkdown: EXISTING_MARKDOWN,
    shareRanking: SHARE_RANKING,
    ev1Ranking: EV1_RANKING,
    ev2Ranking: EV2_RANKING,
  });
  assert.equal(draft1.markdown, draft2.markdown);
});

// ---------- (f) 文字数 >= MIN_BODY_CHARS ----------

test(`(f) 本文の実効文字数 (frontmatter・画像行・見出し記号を除く) は >= ${MIN_BODY_CHARS}`, () => {
  const body = buildFixtureBody();
  const len = countBodyLength(body);
  assert.ok(
    len >= MIN_BODY_CHARS,
    `本文が短すぎる: ${len} 字 (必要 >= ${MIN_BODY_CHARS})`,
  );
});

// ---------- fmt 群の書式 (仕様どおりの整形か) ----------

test("fmt群: fmtRatio/fmtRank/fmtValue が仕様の書式を返す", () => {
  assert.equal(fmtRatio(1.439828888667507), "1.44倍");
  assert.equal(fmtRank(9), "9位");
  assert.equal(fmtValue(4.5, "％"), "4.5%");
  assert.equal(fmtValue(4.5, "%"), "4.5%");
  assert.equal(fmtValue(1234.5, "円"), "1,234.5円");
});

test("extractFrontmatterField は quoted / bare な value を両方読める", () => {
  const raw = `title: "quoted value"\nstatus: published`;
  assert.equal(extractFrontmatterField(raw, "title"), "quoted value");
  assert.equal(extractFrontmatterField(raw, "status"), "published");
});
