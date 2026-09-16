import assert from "node:assert/strict";
import test from "node:test";
import { barGeometry, prepareStoryData, renderRankingStoryCard, STORY_LAYOUTS } from "../lib/ranking-story-card.ts";

const entries = [
  { areaCode: "13000", areaName: "東京都", value: 99.9 },
  { areaCode: "25000", areaName: "滋賀県", value: 99.2 },
  { areaCode: "36000", areaName: "徳島県", value: 68.5 },
];
const options = { title: "汚水処理人口普及率", year: "2023年度", unit: "％", source: "社会・人口統計体系" };

test("同値を一意の1位とせず、中央値は全国平均と混同しない", () => {
  const tied = [...entries, { areaCode: "27000", areaName: "大阪府", value: 99.9 }];
  const model = prepareStoryData(tied);
  assert.equal(model.highCount, 2);
  assert.ok(Math.abs(model.median - 99.55) < 1e-10);
  const svg = renderRankingStoryCard(tied, { ...options, layout: "spotlight" });
  assert.match(svg, /同値2県/);
  assert.match(svg, /中央値/);
  assert.doesNotMatch(svg, /全国平均|1位/);
  assert.equal(tied[0].areaCode, "13000");
});

test("百分率の差は倍率や%とせずポイントで示す", () => {
  const svg = renderRankingStoryCard(entries, { ...options, layout: "comparison" });
  assert.match(svg, /31.4 ポイント/);
  assert.doesNotMatch(svg, /31.4 ％|倍/);
});

test("2県の棒は0と尺度を共有し、負数を消さない", () => {
  const high = barGeometry(3, -4, 3, 0, 700);
  const low = barGeometry(-4, -4, 3, 0, 700);
  assert.deepEqual(high, { x: 400, width: 300, zero: 400 });
  assert.deepEqual(low, { x: 0, width: 400, zero: 400 });
  assert.equal(barGeometry(0, 0, 0, 10, 400).width, 0);
});

test("分布は全47県を描き、選んだ10県だけで全体を装わない", () => {
  const all = Array.from({ length: 47 }, (_, i) => ({ areaCode: String(i), areaName: `県${i}`, value: i - 23 }));
  const svg = renderRankingStoryCard(all, { ...options, layout: "distribution" });
  assert.equal([...svg.matchAll(/data-value=/g)].length, 47);
  assert.match(svg, /data-value="-23"/);
  assert.match(svg, /data-value="23"/);
  assert.doesNotMatch(svg, /NaN|Infinity/);
});

test("欠測・重複を含むデータを黙って比較図にしない", () => {
  assert.throws(() => prepareStoryData([{ ...entries[0], value: NaN }, entries[1]]));
  assert.throws(() => prepareStoryData([entries[0], entries[0]]));
  assert.throws(() => prepareStoryData([]));
});

test("全レイアウトで出典・年・単位を維持し、メタデータをXMLとして実行しない", () => {
  for (const layout of STORY_LAYOUTS) {
    const svg = renderRankingStoryCard(entries, { ...options, layout, title: '<script>"A&B"</script>' });
    assert.match(svg, /viewBox="0 0 960 404"/);
    assert.match(svg, /2023年度/);
    assert.match(svg, /社会・人口統計体系/);
    assert.match(svg, /％/);
    assert.match(svg, /&lt;script&gt;/);
    assert.doesNotMatch(svg, /<script>/);
  }
});
