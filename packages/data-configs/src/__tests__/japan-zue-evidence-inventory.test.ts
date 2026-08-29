import { describe, expect, it } from "vitest";

import {
  auditJapanZueExpressionSimilarity,
  auditJapanZueLineage,
  auditJapanZueCorrections,
  auditJapanZueStructure,
  buildJapanZueReviewQueue,
  buildJapanZueMappingQueue,
  diffJapanZueCandidates,
  extractJapanZueCandidates,
  findJapanZueRuntimeSourceReferences,
  suggestJapanZueMetricMatches,
  suggestJapanZueSourceMatches,
  summarizeJapanZueCoverage,
  validateJapanZueCandidateDocument,
  validateJapanZueEvidenceItem,
  type JapanZueEvidenceItem,
} from "../evidence-inventory";

const PRIMARY_SOURCE = {
  organization: "総務省統計局",
  publicationOrDataset: "一次統計",
  datasetId: "fixture-1",
  url: "https://example.go.jp/data",
  termsUrl: "https://example.go.jp/terms",
  dataYears: ["2024"],
  checkedAt: "2026-08-28",
  rights: "allowed" as const,
};

describe("Japan Zue evidence inventory", () => {
  it("extracts stable candidates without retaining book text or values", () => {
    const source = [
      "# 第1章",
      "表1-1 書籍固有の見出し",
      "| 区分 | 値 |",
      "| --- | ---: |",
      "| A | 12.3 |",
      "図1-1 書籍固有の図見出し",
      "![図](../figures/p026-fig01.jpg)",
      "対象は前年比12.3%増加した。",
    ].join("\n");

    const first = extractJapanZueCandidates([{ page: 26, markdownPath: "md/p026.md", content: source }]);
    const second = extractJapanZueCandidates([{ page: 26, markdownPath: "md/p026.md", content: source }]);

    expect(second).toEqual(first);
    expect(first.map(({ id }) => id)).toEqual([
      "japan-zue-2025-26-p026-table01",
      "japan-zue-2025-26-p026-figure01",
      "japan-zue-2025-26-p026-textstat01",
    ]);
    const serialized = JSON.stringify(first);
    expect(serialized).not.toContain("書籍固有");
    expect(serialized).not.toContain("12.3");
    expect(first.every(({ contentSha256 }) => /^[a-f0-9]{64}$/.test(contentSha256))).toBe(true);
  });

  it("does not duplicate transcribed figure content as text statistics", () => {
    const candidates = extractJapanZueCandidates([{
      page: 26,
      markdownPath: "md/p026.md",
      content: [
        "## 図1-1 推移",
        "![図](../figures/p026-fig01.jpg)",
        "系列: A／B。縦軸 0〜100、横軸 2000〜2024年。",
        "- A 12.3%",
        "## 本文",
        "対象は前年比12.3%増加した。",
      ].join("\n"),
    }]);

    expect(candidates.map(({ source }) => source.kind)).toEqual(["figure", "text-stat"]);
    expect(candidates[1]?.id).toBe("japan-zue-2025-26-p026-textstat03");
    expect(candidates[1]?.locator.lineStart).toBe(6);
  });

  it("does not treat an explicit figure-description callout as a text statistic", () => {
    const candidates = extractJapanZueCandidates([{
      page: 26,
      markdownPath: "md/p026.md",
      content: [
        "## 図1-1 推移",
        "![図](../figures/p026-fig01.jpg)",
        "### 図の説明（欄外）",
        "図の説明では2024年の割合が12.3%である。",
      ].join("\n"),
    }]);

    expect(candidates.map(({ source }) => source.kind)).toEqual(["figure"]);
  });

  it("does not treat table transcription layout notes as statistics", () => {
    const candidates = extractJapanZueCandidates([{
      page: 26,
      markdownPath: "md/p026.md",
      content: [
        "## 表1-1 市の人口",
        "原表は「市｜人口」の3組を横に並べた3段組で、以下は1列へ展開したもの。",
        "男・女の欄は2024年の内訳。",
        "男・女・対前年増減数・割合の各欄は2024年の値（原表では「〃」で2024年を受ける）。",
        "※ 原表では3階級が中括弧でまとめられている。",
        "※2024年は原表で3項目が中かっこでくくられ、合計値として示されている。",
        "対象は前年比12.3%増加した。",
      ].join("\n"),
    }]);

    expect(candidates.map(({ source }) => source.kind)).toEqual(["text-stat"]);
    expect(candidates[0]?.id).toBe("japan-zue-2025-26-p026-textstat05");
    expect(candidates[0]?.locator.lineStart).toBe(7);
  });

  it("merges an adjacent page table continuation into the starting ID", () => {
    const candidates = extractJapanZueCandidates([
      {
        page: 26,
        markdownPath: "md/p026.md",
        content: ["表1-1", "| 区分 | 値 |", "| --- | ---: |", "| A | 1 |"].join("\n"),
      },
      {
        page: 27,
        markdownPath: "md/p027.md",
        content: ["<!-- table-continuation -->", "| 区分 | 値 |", "| --- | ---: |", "| B | 2 |"].join("\n"),
      },
    ]);

    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.id).toBe("japan-zue-2025-26-p026-table01");
    expect(candidates[0]?.source.continuationPages).toEqual([27]);
  });

  it("merges split markdown blocks governed by one table number", () => {
    const candidates = extractJapanZueCandidates([
      {
        page: 26,
        markdownPath: "md/p026.md",
        content: [
          "## 表1-1",
          "",
          "| 区分 | 値 |",
          "| --- | ---: |",
          "| A | 1 |",
          "",
          "| 区分 | 値 |",
          "| --- | ---: |",
          "| B | 2 |",
        ].join("\n"),
      },
    ]);

    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.source.itemNumber).toBe("1-1");
    expect(candidates[0]?.locator).toMatchObject({ lineStart: 3, lineEnd: 9 });
  });

  it("merges a numbered continuation even when another table appears first on the next page", () => {
    const candidates = extractJapanZueCandidates([
      {
        page: 26,
        markdownPath: "md/p026.md",
        content: ["## 表1-2 左半", "| 区分 | 値 |", "| --- | ---: |", "| A | 1 |"].join("\n"),
      },
      {
        page: 27,
        markdownPath: "md/p027.md",
        content: [
          "## 表1-1 別表",
          "| 区分 | 値 |",
          "| --- | ---: |",
          "| B | 2 |",
          "## 表1-2 右半",
          "| 区分 | 値 |",
          "| --- | ---: |",
          "| C | 3 |",
        ].join("\n"),
      },
    ]);

    expect(candidates.filter(({ source }) => source.kind === "table")).toHaveLength(2);
    expect(candidates.find(({ source }) => source.itemNumber === "1-2")?.source.continuationPages).toEqual([27]);
  });

  it("merges an unnumbered roman-numeral continuation and uses its final-page citation", () => {
    const pages = [
      {
        page: 57,
        markdownPath: "md/p057.md",
        content: ["## 表4-13 統計（I）", "| 区分 | 値 |", "| --- | ---: |", "| A | 1 |"].join("\n"),
      },
      {
        page: 58,
        markdownPath: "md/p058.md",
        content: [
          "## 表 統計（II）",
          "説明",
          "| 区分 | 値 |",
          "| --- | ---: |",
          "| B | 2 |",
          "総務省「一次統計調査」より作成。",
        ].join("\n"),
      },
    ];
    const candidates = extractJapanZueCandidates(pages);
    const queue = buildJapanZueReviewQueue(candidates, pages, "2025-26");

    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.source).toMatchObject({ itemNumber: "4-13", continuationPages: [58] });
    expect(queue.directCitationCandidateCount).toBe(1);
    expect(queue.localContextCandidateCount).toBe(0);
  });

  it("does not inherit a table number across a different markdown heading", () => {
    const candidates = extractJapanZueCandidates([
      {
        page: 26,
        markdownPath: "md/p026.md",
        content: [
          "## 表1-1 統計表",
          "| 区分 | 値 |",
          "| --- | ---: |",
          "| A | 1 |",
          "## 図1-1 図中データ",
          "| 区分 | 値 |",
          "| --- | ---: |",
          "| B | 2 |",
        ].join("\n"),
      },
    ]);

    const tables = candidates.filter(({ source }) => source.kind === "table");
    expect(tables).toHaveLength(2);
    expect(tables.map(({ source }) => source.itemNumber)).toEqual(["1-1", undefined]);
  });

  it("deduplicates an image separated from its figure heading by a blank line", () => {
    const candidates = extractJapanZueCandidates([
      {
        page: 26,
        markdownPath: "md/p026.md",
        content: ["図1-1", "", "![図](../figures/p026-fig01.jpg)"].join("\n"),
      },
    ]);

    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.source).toMatchObject({ kind: "figure", itemNumber: "1-1" });
  });

  it("does not classify provenance, notes, or unit labels as text statistics", () => {
    const candidates = extractJapanZueCandidates([
      {
        page: 26,
        markdownPath: "md/p026.md",
        content: ["出典：2024年人口10万人", "注：平均は10人", "単位：1件", "平均は10人だった。"].join("\n"),
      },
    ]);

    expect(candidates.map(({ id }) => id)).toEqual(["japan-zue-2025-26-p026-textstat01"]);
  });

  it("excludes index entries whose page references resemble quantitative text", () => {
    const candidates = extractJapanZueCandidates([
      {
        page: 498,
        markdownPath: "md/p498.md",
        content: ["# p.498", "# 索引", "- 人口 37, 509", "- 平均寿命 45, 459"].join("\n"),
      },
      {
        page: 499,
        markdownPath: "md/p499.md",
        content: ["# p.499", "# 索引（つづき）", "- 出生率 38, 509"].join("\n"),
      },
    ]);

    expect(candidates).toEqual([]);
  });

  it("groups direct citations and their cross-references without retaining citation text", () => {
    const pages = [
      {
        page: 26,
        markdownPath: "md/p026.md",
        content: [
          "# 第2章",
          "## 表2-1 固有見出し",
          "| 区分 | 値 |",
          "| --- | ---: |",
          "| A | 12.3 |",
          "総務省「固有統計調査」より作成。",
        ].join("\n"),
      },
      {
        page: 27,
        markdownPath: "md/p027.md",
        content: ["## 図2-2 固有図名", "![図](x)", "資料は表2-1に同じ。"].join("\n"),
      },
    ];
    const candidates = extractJapanZueCandidates(pages);
    const queue = buildJapanZueReviewQueue(candidates, pages, "2025-26");

    expect(queue.isComplete).toBe(true);
    expect(queue.candidateCount).toBe(2);
    expect(queue.groupCount).toBe(1);
    expect(queue.directCitationGroupCount).toBe(1);
    expect(queue.referenceCandidateCount).toBe(1);
    expect(queue.groups[0]?.candidateIds).toEqual([
      "japan-zue-2025-26-p026-table01",
      "japan-zue-2025-26-p027-figure01",
    ]);
    const serialized = JSON.stringify(queue);
    expect(serialized).not.toContain("固有統計調査");
    expect(serialized).not.toContain("12.3");
  });

  it("normalizes annual editions into one source-review group", () => {
    const pages = [2023, 2024].map((year, index) => ({
      page: 26 + index,
      markdownPath: `md/p0${26 + index}.md`,
      content: [
        `## 表2-${index + 1}`,
        "| 区分 | 値 |",
        "| --- | ---: |",
        "| A | 1 |",
        `総務省「一次統計」（${year}年版）より作成。`,
      ].join("\n"),
    }));
    const candidates = extractJapanZueCandidates(pages);
    const queue = buildJapanZueReviewQueue(candidates, pages, "2025-26");

    expect(queue.groupCount).toBe(1);
    expect(queue.groups[0]?.candidateIds).toHaveLength(2);
  });

  it("does not inherit a previous table citation across a section heading", () => {
    const pages = [{
      page: 26,
      markdownPath: "md/p026.md",
      content: [
        "## 表2-1 気象",
        "| 区分 | 値 |",
        "| --- | ---: |",
        "| A | 1 |",
        "気象庁資料より作成。",
        "## 海上保安庁",
        "組織は1948年に設置され、全国を11管区に分ける。",
        "## 表 海上保安体制",
        "| 区分 | 値 |",
        "| --- | ---: |",
        "| B | 2 |",
        "海上保安庁資料より作成。",
      ].join("\n"),
    }];
    const candidates = extractJapanZueCandidates(pages);
    const queue = buildJapanZueReviewQueue(candidates, pages, "2025-26");
    const narrativeGroup = queue.groups.find(({ candidateIds }) =>
      candidateIds.includes("japan-zue-2025-26-p026-textstat01"),
    );

    expect(narrativeGroup?.evidence.kind).toBe("local-context");
    expect(narrativeGroup?.candidateIds).toEqual(["japan-zue-2025-26-p026-textstat01"]);
  });

  it("suggests existing metric keys without retaining source expressions", () => {
    const pages = [{
      page: 26,
      markdownPath: "md/p026.md",
      content: ["## 表2-1 都道府県別の総人口", "| 区分 | 値 |", "| --- | ---: |", "| A | 1 |"].join("\n"),
    }];
    const candidates = extractJapanZueCandidates(pages);
    const queue = buildJapanZueReviewQueue(candidates, pages, "2025-26");
    const report = suggestJapanZueMetricMatches(queue, candidates, pages, [
      { key: "total-population", title: "総人口" },
      { key: "annual-rainfall", title: "年間降水量" },
    ]);

    expect(report.suggestions[0]).toMatchObject({
      candidateId: "japan-zue-2025-26-p026-table01",
      matches: [{ metricKey: "total-population", score: 0.92, sourceCompatible: false }],
    });
    expect(JSON.stringify(report)).not.toContain("都道府県別の総人口");
  });

  it("restricts metric suggestions to metrics backed by the matched source survey", () => {
    const pages = [{
      page: 26,
      markdownPath: "md/p026.md",
      content: [
        "## 表2-1 都道府県別の総人口",
        "| 区分 | 値 |",
        "| --- | ---: |",
        "| A | 1 |",
        "総務省「国勢調査」より作成。",
      ].join("\n"),
    }];
    const candidates = extractJapanZueCandidates(pages);
    const queue = buildJapanZueReviewQueue(candidates, pages, "2025-26");
    const sourceMatches = suggestJapanZueSourceMatches(queue, pages, [{ id: "census", name: "国勢調査" }]);
    const report = suggestJapanZueMetricMatches(queue, candidates, pages, [
      { key: "census-population", title: "総人口", surveyIds: ["census"] },
      { key: "estimate-population", title: "総人口", surveyIds: ["population-estimates"] },
    ], sourceMatches);

    expect(report.sourceConstrainedCandidateCount).toBe(1);
    expect(report.suggestions[0]?.matches).toEqual([
      { metricKey: "census-population", score: 0.92, sourceCompatible: true },
    ]);

    const mappingQueue = buildJapanZueMappingQueue(queue, sourceMatches, report, [{
      id: "japan-zue-2025-26-p026-table01",
      source: { key: "japan-zue", edition: "2025-26", page: 26, kind: "table", itemNumber: "2-1" },
      topicHint: "fixture",
      resolution: "reuse-existing-metric",
    }]);
    expect(mappingQueue).toMatchObject({
      candidateCount: 1,
      queuedCandidateCount: 1,
      reviewedCandidateCount: 1,
      pendingCandidateCount: 0,
      tierCounts: {
        "metric-and-survey-review": 1,
        "survey-only-review": 0,
        "direct-source-review": 0,
        "local-context-review": 0,
      },
      pendingTierCounts: {
        "metric-and-survey-review": 0,
        "survey-only-review": 0,
        "direct-source-review": 0,
        "local-context-review": 0,
      },
      duplicateCandidateIds: [],
      missingCandidateIds: [],
      isComplete: true,
    });
    expect(mappingQueue.entries[0]).toMatchObject({
      candidateId: "japan-zue-2025-26-p026-table01",
      reviewedResolution: "reuse-existing-metric",
      surveyIds: ["census"],
      metricKeys: ["census-population"],
    });
    expect(JSON.stringify(mappingQueue)).not.toContain("都道府県別の総人口");
  });

  it("reuses an existing survey ID from an exact source alias without retaining the citation", () => {
    const pages = [{
      page: 26,
      markdownPath: "md/p026.md",
      content: [
        "## 表2-1 固有見出し",
        "| 区分 | 値 |",
        "| --- | ---: |",
        "| A | 1 |",
        "厚生労働省「人口動態統計」2024年版より作成。",
      ].join("\n"),
    }];
    const candidates = extractJapanZueCandidates(pages);
    const queue = buildJapanZueReviewQueue(candidates, pages, "2025-26");
    const report = suggestJapanZueSourceMatches(queue, pages, [
      { id: "vital-statistics", name: "人口動態統計" },
    ]);

    expect(report).toMatchObject({
      directCitationGroupCount: 1,
      suggestedGroupCount: 1,
      suggestedCandidateCount: 1,
      matchedSurveyCount: 1,
      ambiguousGroupIds: [],
    });
    expect(report.suggestions[0]).toMatchObject({
      surveyIds: ["vital-statistics"],
      matchMethod: "exact-alias",
    });
    expect(JSON.stringify(report)).not.toContain("人口動態統計");
  });

  it("keeps every exact survey match when one table combines multiple primary sources", () => {
    const pages = [{
      page: 26,
      markdownPath: "md/p026.md",
      content: [
        "## 表2-1 固有見出し",
        "| 区分 | 値 |",
        "| --- | ---: |",
        "| A | 1 |",
        "総務省「国勢調査」および同「人口推計」より作成。",
      ].join("\n"),
    }];
    const candidates = extractJapanZueCandidates(pages);
    const queue = buildJapanZueReviewQueue(candidates, pages, "2025-26");
    const report = suggestJapanZueSourceMatches(queue, pages, [
      { id: "census", name: "国勢調査" },
      { id: "population-estimates", name: "人口推計" },
    ]);

    expect(report.ambiguousGroupIds).toEqual([]);
    expect(report.suggestions[0]?.surveyIds).toEqual(["census", "population-estimates"]);
  });

  it("keeps an OCR table with no heading and a co-located figure as distinct stable candidates", () => {
    const source = [
      "| 区分 | 値 |",
      "| --- | ---: |",
      "| A | 1 |",
      "![OCRで見出しを失った図](../figures/p028-fig01.jpg)",
    ].join("\n");

    const candidates = extractJapanZueCandidates([{ page: 28, markdownPath: "md/p028.md", content: source }]);

    expect(candidates.map(({ id }) => id)).toEqual([
      "japan-zue-2025-26-p028-table01",
      "japan-zue-2025-26-p028-figure01",
    ]);
    expect(candidates[0]?.source.itemNumber).toBeUndefined();
  });

  it("rejects book payload fields and malformed production provenance", () => {
    const errors = validateJapanZueEvidenceItem({
      id: "japan-zue-2025-26-p026-table01",
      source: { key: "japan-zue", edition: "2025-26", page: 26, kind: "table", imagePath: "scan.jpg" },
      topicHint: "人口構造の地域差",
      resolution: "new-metric",
      bookValue: 123,
      primarySource: { ...PRIMARY_SOURCE, termsUrl: undefined },
      mapping: { geoScopes: ["prefecture-set"] },
    });

    expect(errors).toContain("item.bookValue: unknown field");
    expect(errors).toContain("item.source.imagePath: unknown field");
    expect(errors).toContain("item.primarySource.termsUrl: required when rights=allowed");
  });

  it("accepts multiple primary sources and requires every source to be production-ready", () => {
    const item: JapanZueEvidenceItem = {
      id: "japan-zue-2025-26-p026-table01",
      source: { key: "japan-zue", edition: "2025-26", page: 26, kind: "table" },
      topicHint: "複数の公式統計を組み合わせた地域比較",
      resolution: "combined-analysis",
      primarySources: [
        PRIMARY_SOURCE,
        { ...PRIMARY_SOURCE, datasetId: "fixture-2", url: "https://example.go.jp/data-2" },
      ],
      mapping: { geoScopes: ["japan"] },
    };

    expect(validateJapanZueEvidenceItem(item)).toEqual([]);
    expect(summarizeJapanZueCoverage([], [item]).productionBlockers).toEqual([]);

    const malformed = {
      ...item,
      primarySource: PRIMARY_SOURCE,
      primarySources: [{ ...PRIMARY_SOURCE, termsUrl: undefined }],
    };
    const errors = validateJapanZueEvidenceItem(malformed);
    expect(errors).toContain("item: primarySource and primarySources are mutually exclusive");
    expect(errors).toContain("item.primarySources[0].termsUrl: required when rights=allowed");
  });

  it("requires every candidate decision and production-ready provenance for completion", () => {
    const candidates = extractJapanZueCandidates([
      {
        page: 26,
        markdownPath: "md/p026.md",
        content: ["表1-1", "| 区分 | 値 |", "| --- | ---: |", "| A | 1 |", "全国平均は10人だった。"].join("\n"),
      },
    ]);
    const resolved: JapanZueEvidenceItem[] = [
      {
        id: "japan-zue-2025-26-p026-table01",
        source: { key: "japan-zue", edition: "2025-26", page: 26, kind: "table" },
        topicHint: "地域差を比較する統計",
        resolution: "reuse-existing-metric",
        primarySource: PRIMARY_SOURCE,
        mapping: { metricKeys: ["fixture"], geoScopes: ["prefecture-set"], contentRoles: ["ranking"] },
      },
      {
        id: "japan-zue-2025-26-p026-textstat01",
        source: { key: "japan-zue", edition: "2025-26", page: 26, kind: "text-stat" },
        topicHint: "説明文であり独立統計ではない",
        resolution: "not-quantitative",
      },
    ];

    const complete = summarizeJapanZueCoverage(candidates, resolved);
    expect(complete.decisionCoveragePercent).toBe(100);
    expect(complete.resolutionCoveragePercent).toBe(100);
    expect(complete.isComplete).toBe(true);

    const incomplete = summarizeJapanZueCoverage(candidates, resolved.slice(0, 1));
    expect(incomplete.missingInventoryIds).toEqual(["japan-zue-2025-26-p026-textstat01"]);
    expect(incomplete.unreviewedIds).toEqual(["japan-zue-2025-26-p026-textstat01"]);
    expect(incomplete.isComplete).toBe(false);
  });

  it("flags long expression reuse but ignores short unavoidable labels", () => {
    const copied = "この文章は書籍固有の長い説明であり公開原稿へそのまま移してはいけない内容です";
    const matches = auditJapanZueExpressionSimilarity(
      { "md/p026.md": `総務省統計局 ${copied}` },
      { "article.md": `独自の導入。${copied}` },
    );

    expect(matches.length).toBeGreaterThan(0);
    expect(
      auditJapanZueExpressionSimilarity(
        { "md/p026.md": "総務省統計局" },
        { "article.md": "総務省統計局" },
      ),
    ).toEqual([]);
  });

  it("does not confuse unrelated transcript assets with the private source bundle", () => {
    expect(
      findJapanZueRuntimeSourceReferences({
        "draft.md": "transcripts/ は動画音声の文字起こしを置く一般ディレクトリです。",
      }),
    ).toEqual([]);
    expect(
      findJapanZueRuntimeSourceReferences({
        "page.ts": "const source = 'books/日本国勢図絵/ocr-raw/p026.tsv';",
      }),
    ).toEqual([{ path: "page.ts", pattern: "books/日本国勢図絵" }]);
  });

  it("rejects raw candidate payloads, duplicate IDs, and incomplete page scans", () => {
    const candidates = extractJapanZueCandidates([
      { page: 26, markdownPath: "md/p026.md", content: "全国平均は10人だった。" },
    ]);
    const document = {
      schemaVersion: 1,
      sourceKey: "japan-zue",
      edition: "2025-26",
      sourceBundleSha256: "a".repeat(64),
      pageRange: { start: 26, end: 27 },
      pagesScanned: [26],
      candidates: [{ ...candidates[0], rawText: "書籍本文" }, candidates[0]],
    };

    const errors = validateJapanZueCandidateDocument(document);
    expect(errors).toContain("document.pagesScanned: must contain every page exactly once in ascending order");
    expect(errors).toContain("document.candidates[0].rawText: unknown field");
    expect(errors.some((error) => error.includes("duplicate IDs"))).toBe(true);
  });

  it("audits taxonomy lineage against existing catalog keys", () => {
    const inventory: JapanZueEvidenceItem[] = [
      {
        id: "japan-zue-2025-26-p026-table01",
        source: { key: "japan-zue", edition: "2025-26", page: 26, kind: "table" },
        topicHint: "地域差を比較する統計",
        resolution: "reuse-existing-metric",
        primarySource: PRIMARY_SOURCE,
        mapping: {
          metricKeys: ["missing-metric"],
          surveyIds: ["known-survey"],
          themeSlugs: ["known-theme"],
          categoryKey: "known-category",
          geoScopes: ["prefecture-set"],
        },
      },
    ];
    const audit = auditJapanZueLineage(inventory, {
      metricKeys: new Set(),
      surveyIds: new Set(["known-survey"]),
      themeSlugs: new Set(["known-theme"]),
      categoryKeys: new Set(["known-category"]),
    });

    expect(audit.missingMetricKeys).toEqual([
      { id: "japan-zue-2025-26-p026-table01", key: "missing-metric" },
    ]);
    expect(audit.isClean).toBe(false);
  });

  it("enumerates source revision changes and their downstream impact", () => {
    const baseCandidates = extractJapanZueCandidates([
      { page: 26, markdownPath: "md/p026.md", content: "全国平均は10人だった。" },
    ]);
    const previous = {
      schemaVersion: 1 as const,
      sourceKey: "japan-zue" as const,
      edition: "2025-26" as const,
      sourceBundleSha256: "a".repeat(64),
      pageRange: { start: 26, end: 26 },
      pagesScanned: [26],
      candidates: baseCandidates,
    };
    const next = {
      ...previous,
      sourceBundleSha256: "b".repeat(64),
      candidates: baseCandidates.map((candidate) => ({ ...candidate, contentSha256: "c".repeat(64) })),
    };
    const inventory: JapanZueEvidenceItem[] = [
      {
        id: "japan-zue-2025-26-p026-textstat01",
        source: { key: "japan-zue", edition: "2025-26", page: 26, kind: "text-stat" },
        topicHint: "全国値の補足",
        resolution: "combined-analysis",
        primarySource: PRIMARY_SOURCE,
        mapping: { metricKeys: ["fixture"], geoScopes: ["japan"], contentRoles: ["blog", "youtube"] },
      },
    ];

    const diff = diffJapanZueCandidates(previous, next, inventory);
    expect(diff.changedIds).toEqual(["japan-zue-2025-26-p026-textstat01"]);
    expect(diff.impacted[0]).toMatchObject({ metricKeys: ["fixture"], contentRoles: ["blog", "youtube"] });
  });

  it("audits page coverage, ranges, headings, and numbering without retaining heading text", () => {
    const pages = [
      {
        page: 26,
        markdownPath: "md/p026.md",
        content: ["## 表1-1 固有見出し", "| 区分 | 値 |", "| --- | ---: |", "| A | 1 |", "## 図1-2 固有図名"].join("\n"),
      },
    ];
    const candidates = extractJapanZueCandidates(pages);
    const audit = auditJapanZueStructure(
      {
        schemaVersion: 1,
        sourceKey: "japan-zue",
        edition: "2025-26",
        sourceBundleSha256: "a".repeat(64),
        pageRange: { start: 26, end: 26 },
        pagesScanned: [26],
        candidates,
      },
      pages,
    );

    expect(audit.pageCoverage).toMatchObject({ expectedCount: 1, scannedCount: 1, missingPages: [] });
    expect(audit.sourceScope).toMatchObject({
      requiredStart: 26,
      requiredEnd: 26,
      availableStart: 26,
      missingPages: [],
      excludedRanges: [
        { start: 1, end: 25, reason: "outside-stats47-prefecture-content-scope" },
      ],
    });
    expect(audit.isSourceScopeComplete).toBe(true);
    expect(audit.headingCounts).toEqual({ table: 1, figure: 1, total: 2 });
    expect(audit.unmatchedHeadings).toEqual([]);
    expect(JSON.stringify(audit)).not.toContain("固有見出し");
    expect(JSON.stringify(audit)).not.toContain("固有図名");
  });

  it("requires every quantitative publisher correction to reach a candidate", () => {
    const candidates = extractJapanZueCandidates([
      {
        page: 26,
        markdownPath: "md/p026.md",
        content: ["## 表1-1", "| 区分 | 値 |", "| --- | ---: |", "| A | 1 |"].join("\n"),
      },
    ]);
    const correction = {
      id: "fixture-correction",
      page: 26,
      targetKind: "table" as const,
      itemNumber: "1-1",
      classification: "value" as const,
      affectsQuantitativeSemantics: true,
      sourceUrl: "https://example.go.jp/errata",
      checkedAt: "2026-08-28",
    };

    expect(auditJapanZueCorrections(candidates, [correction]).isClean).toBe(true);
    expect(auditJapanZueCorrections([], [correction]).missingQuantitativeTargets).toEqual(["fixture-correction"]);
  });
});
