/**
 * 実行: node --test packages/ops/src/blog/lint/__tests__/data-source-mismatch.test.mjs
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  articleSourceReferences,
  checkUrlsPerHost,
  compareTagToDerived,
  extractDataSourceTags,
  figureSourceReferences,
  normalizeLabel,
  normalizeUrl,
} from "../data-source-mismatch.mjs";

const MD = [
  "## ランキング",
  "",
  "![ひとり暮らし率](data/aging-solo-ranking.svg)",
  "",
  '<data-source url="https://www.e-stat.go.jp/dbview?sid=0000010201" label="e-Stat 社会生活統計指標"></data-source>',
  "",
  "本文の途中の出典 (図の直後ではない)。",
  '<data-source label="厚生労働省「賃金構造基本統計調査」" year="2023年"></data-source>',
].join("\n");

describe("extractDataSourceTags", () => {
  it("図の直後のタグには図の base を付け、図の直後でないタグには付けない", () => {
    const tags = extractDataSourceTags(MD);
    assert.equal(tags.length, 2);
    assert.deepEqual(
      { figureBase: tags[0].figureBase, label: tags[0].label, url: tags[0].url, line: tags[0].line },
      { figureBase: "aging-solo-ranking", label: "e-Stat 社会生活統計指標", url: "https://www.e-stat.go.jp/dbview?sid=0000010201", line: 5 },
    );
    assert.equal(tags[1].figureBase, null);
    assert.equal(tags[1].year, "2023年");
    assert.equal(tags[1].url, "");
  });
});

describe("正規化", () => {
  it("URL は http・末尾スラッシュ・フラグメントの違いを無視し、ラベルは e-Stat の接頭辞と括弧書きを落とす", () => {
    assert.equal(normalizeUrl("http://example.go.jp/a/#x"), "https://example.go.jp/a");
    assert.equal(normalizeUrl(undefined), "");
    assert.equal(normalizeLabel("e-Stat 社会・人口統計体系（教育）"), "社会・人口統計体系");
    assert.equal(normalizeLabel("厚生労働省「賃金構造基本統計調査」"), "厚生労働省賃金構造基本統計調査");
  });
});

describe("compareTagToDerived", () => {
  const derived = articleSourceReferences([
    {
      label: "社会・人口統計体系",
      url: "https://www.stat.go.jp/data/ssds/index.htm",
      tables: [{ label: "社会・人口統計体系", url: "https://www.e-stat.go.jp/dbview?sid=0000010201" }],
    },
  ]);
  const none = { labels: [], urls: [] };

  it("導出した名前と URL に合うタグは食い違いにしない", () => {
    const tag = { label: "e-Stat 社会・人口統計体系（教育）", url: "https://www.e-stat.go.jp/dbview?sid=0000010201/" };
    assert.deepEqual(compareTagToDerived(tag, none, derived), []);
  });

  it("★別の調査の名前と URL を書いたタグは LABEL_MISMATCH と URL_MISMATCH にする", () => {
    const tag = { label: "e-Stat 家計調査", url: "https://www.e-stat.go.jp/dbview?sid=0000999999" };
    assert.deepEqual(compareTagToDerived(tag, none, derived), ["LABEL_MISMATCH", "URL_MISMATCH"]);
  });

  it("URL が無いタグは名前だけを照らす", () => {
    assert.deepEqual(compareTagToDerived({ label: "社会・人口統計体系", url: "" }, none, derived), []);
    assert.deepEqual(compareTagToDerived({ label: "家計調査", url: "" }, none, derived), ["LABEL_MISMATCH"]);
  });

  it("図の source.json が直接持つ出典 (displaySources) とも照らす", () => {
    const figure = figureSourceReferences({ displaySources: [{ label: "国土地理院『電子国土基本図（地名情報）』", url: "https://maps.gsi.go.jp/" }] });
    const tag = { label: "国土地理院 地名情報", url: "https://maps.gsi.go.jp" };
    assert.deepEqual(compareTagToDerived(tag, figure, none), []);
  });

  it("★名前の共通部分が 4 字 (「社会生活」) だけの別の調査は同じ出典とみなさない", () => {
    const refs = articleSourceReferences([{ label: "社会生活基本調査", tables: [] }]);
    assert.deepEqual(compareTagToDerived({ label: "e-Stat 社会生活統計指標", url: "" }, { labels: [], urls: [] }, refs), ["LABEL_MISMATCH"]);
  });

  it("照らす先が無ければ食い違いではなく NO_DERIVED_SOURCE にする", () => {
    assert.deepEqual(compareTagToDerived({ label: "何か", url: "https://example.com" }, none, none), ["NO_DERIVED_SOURCE"]);
  });
});

describe("checkUrlsPerHost", () => {
  it("★同じホストへの同時リクエストは 2 本までで、別のホストは並行して進める", async () => {
    let active = 0;
    let maxSameHost = 0;
    const activeByHost = new Map();
    const head = async (url) => {
      const host = new URL(url).host;
      activeByHost.set(host, (activeByHost.get(host) ?? 0) + 1);
      active += 1;
      maxSameHost = Math.max(maxSameHost, activeByHost.get(host));
      await new Promise((r) => setTimeout(r, 10));
      activeByHost.set(host, activeByHost.get(host) - 1);
      active -= 1;
      return url.endsWith("/gone") ? 404 : 200;
    };
    const urls = [
      ...Array.from({ length: 6 }, (_, i) => `https://a.example/${i}`),
      "https://a.example/gone",
      ...Array.from({ length: 3 }, (_, i) => `https://b.example/${i}`),
      "https://a.example/0",
    ];
    const result = await checkUrlsPerHost(urls, head);
    assert.equal(maxSameHost, 2);
    assert.equal(active, 0);
    assert.equal(result.size, 10);
    assert.equal(result.get("https://a.example/gone"), 404);
    assert.equal(result.get("https://b.example/2"), 200);
  });
});
