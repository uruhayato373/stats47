import assert from "node:assert/strict";
import test from "node:test";

import {
  lintConsecutiveCallouts,
  lintSourceLinkPlacement,
  normalizeConsecutiveCallouts,
} from "../article-structure-lint.mjs";

test("通常本文を挟まない callout 連続配置を blocker にする", () => {
  const markdown = `> [!WARNING]
> 注意です。

> [!TIP]
> 読み方です。`;
  const result = lintConsecutiveCallouts(markdown);

  assert.equal(result.blockers.length, 1);
  assert.equal(result.stats.adjacentCalloutClusters, 1);
  assert.equal(result.stats.adjacentCalloutPairs, 1);
  assert.equal(result.stats.maxConsecutiveCallouts, 2);
  assert.deepEqual(result.stats.adjacentCalloutLocations, [
    { line: 1, types: ["WARNING", "TIP"] },
  ]);
});

test("3個の連続配置を1 cluster・2 pairsとして数える", () => {
  const markdown = `> [!NOTE]
> 定義です。

> [!WARNING]
> 注意です。

> [!TIP]
> 読み方です。`;
  const result = lintConsecutiveCallouts(markdown);

  assert.equal(result.stats.adjacentCalloutClusters, 1);
  assert.equal(result.stats.adjacentCalloutPairs, 2);
  assert.equal(result.stats.maxConsecutiveCallouts, 3);
});

test("通常本文・見出し・図を挟む配置は許可する", () => {
  const markdown = `> [!WARNING]
> 注意です。

### 読み解き

本文です。

> [!TIP]
> 読み方です。`;
  const result = lintConsecutiveCallouts(markdown);

  assert.equal(result.blockers.length, 0);
  assert.equal(result.stats.adjacentCalloutClusters, 0);
});

test("fenced code 内の callout 記法例は無視する", () => {
  const markdown = `\`\`\`markdown
> [!NOTE]
> 記法例

> [!TIP]
> 記法例
\`\`\``;
  const result = lintConsecutiveCallouts(markdown);

  assert.equal(result.stats.calloutCount, 0);
  assert.equal(result.blockers.length, 0);
});

test("正規化は最重要の WARNING を残し、NOTE と TIP の文言を通常本文へ戻す", () => {
  const markdown = `> [!NOTE]
> 定義です。

> [!WARNING]
> 注意です。

> [!TIP]
> 読み方です。`;
  const normalized = normalizeConsecutiveCallouts(markdown);

  assert.match(normalized, /\*\*補足:\*\* 定義です。/);
  assert.match(normalized, /> \[!WARNING\]\n> 注意です。/);
  assert.match(normalized, /\*\*読み解きのポイント:\*\* 読み方です。/);
  assert.equal(lintConsecutiveCallouts(normalized).stats.adjacentCalloutClusters, 0);
});

test("連続していない callout は正規化しても変更しない", () => {
  const markdown = `> [!NOTE]
> 定義です。

本文です。

> [!TIP]
> 読み方です。`;

  assert.equal(normalizeConsecutiveCallouts(markdown), markdown);
});

// BLOG-MUNI-SOURCE-LINK-01: 市区町村の図の直下に市区町村ランキングのカードを置けるようにする
const FIGURE = "![市区町村の人口増減率](./images/map.svg)";

function sectionWithCard(heading, href, withFigure = true) {
  return `## ${heading}\n\n本文です。\n\n${withFigure ? `${FIGURE}\n\n` : ""}<source-link href="${href}">ランキングをもっと見る</source-link>\n\n説明が続きます。\n`;
}

test("市区町村ランキングのカードを図のカードとして数え、図の直下なら通す", () => {
  const md = [
    sectionWithCard("市区町村の人口増減", "/municipalities/ranking/census-population-change-rate-5y"),
    sectionWithCard("県内の市町村", "/municipalities/ranking/census-population-change-rate-5y/01000"),
  ].join("\n");
  const result = lintSourceLinkPlacement(md);

  assert.equal(result.stats.rankingSourceLinks, 2);
  assert.deepEqual(result.blockers, []);
});

test("市区町村ランキングのカードにも重複・図の無い節の規則を当てる (都道府県版と同じキーは別ページなので重複にしない)", () => {
  const dup = lintSourceLinkPlacement(
    [
      sectionWithCard("A", "/municipalities/ranking/births"),
      sectionWithCard("B", "/municipalities/ranking/births/"),
      sectionWithCard("C", "/ranking/births"),
    ].join("\n"),
  );
  assert.equal(dup.stats.rankingSourceLinks, 3);
  assert.equal(dup.stats.dupRankingLinks, 1);
  assert.match(dup.blockers.join("\n"), /\[dup-ranking-link\] .*municipalities\/births×2/);

  const noFigure = lintSourceLinkPlacement(sectionWithCard("A", "/municipalities/ranking/births", false));
  assert.equal(noFigure.stats.noFigureSectionLinks, 1);
  assert.match(noFigure.blockers.join("\n"), /\[no-figure-section\]/);
});

test("市区町村ランキングの形でないパスは図のカードとして数えない", () => {
  for (const href of [
    "/municipalities/ranking/",
    "/municipalities/ranking/births/hokkaido",
    "/municipalities/ranking/births/01000/extra",
    "/municipalities/themes/kosodate",
    "/municipality/ranking/births",
    "/areas/01000/municipalities/ranking/births",
  ]) {
    const result = lintSourceLinkPlacement(sectionWithCard("A", href, false));
    assert.equal(result.stats.rankingSourceLinks, 0, href);
    assert.deepEqual(result.blockers, [], href);
  }
});
