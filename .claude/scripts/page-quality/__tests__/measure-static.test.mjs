import test from "node:test";
import assert from "node:assert/strict";
import { analyzeHtml } from "../lib/measure-static.ts";

const BASE = "https://stats47.jp/areas/13000";

test("正常ページ(重複なし)は誤検出しない", () => {
  const html = `<html><body>
    <a href="/ranking/a">a</a>
    <a href="/ranking/b">b</a>
    <a href="/ranking/c">c</a>
    <script type="application/ld+json">{"@context":"https://schema.org","@type":"BreadcrumbList"}</script>
  </body></html>`;
  const result = analyzeHtml(html, BASE);
  assert.equal(result.duplicate_links, 0);
  assert.equal(result.duplicate_link_ratio, 0);
  assert.equal(result.jsonld_syntax_errors, 0);
  assert.equal(result.ad_duplicate_count, 0);
});

test("同一hrefの大量重複を検出する", () => {
  const links = Array.from({ length: 5 }, () => `<a href="/ranking/total-population">x</a>`).join("");
  const html = `<html><body>${links}<a href="/ranking/other">y</a></body></html>`;
  const result = analyzeHtml(html, BASE);
  assert.equal(result.total_links, 6);
  assert.equal(result.unique_links, 2);
  assert.equal(result.duplicate_links, 4);
});

test("フラグメント違いのみのhrefは同一URLとして正規化する", () => {
  const html = `<html><body>
    <a href="/ranking/a#top">1</a>
    <a href="/ranking/a#bottom">2</a>
  </body></html>`;
  const result = analyzeHtml(html, BASE);
  assert.equal(result.unique_links, 1);
  assert.equal(result.duplicate_links, 1);
});

test("同一クリック先の広告リンク(rel=sponsored)の重複を検出する", () => {
  const html = `<html><body>
    <a href="https://a8.net/campaign/1" rel="noopener noreferrer sponsored">ad1</a>
    <a href="https://a8.net/campaign/1" rel="noopener noreferrer sponsored">ad1-again</a>
    <a href="https://a8.net/campaign/2" rel="noopener noreferrer sponsored">ad2</a>
    <a href="/ranking/normal">not an ad</a>
  </body></html>`;
  const result = analyzeHtml(html, BASE);
  assert.equal(result.ad_slots, 3); // 3枚のsponsoredリンク (重複含む)
  assert.equal(result.ad_duplicate_count, 1); // うち1枚が重複分
});

test("AdSenseスロット(ins.adsbygoogle)もad_slotsに数える", () => {
  const html = `<html><body><ins class="adsbygoogle"></ins></body></html>`;
  const result = analyzeHtml(html, BASE);
  assert.equal(result.ad_slots, 1);
});

test("JSON-LDの構文エラーを検出する", () => {
  const html = `<html><body>
    <script type="application/ld+json">{"@type": "BreadcrumbList", invalid}</script>
  </body></html>`;
  const result = analyzeHtml(html, BASE);
  assert.equal(result.jsonld_syntax_errors, 1);
  assert.equal(result.jsonld_errors.length, 1);
});

test("JSON-LDの@type出現数を数える(PropertyValue等)", () => {
  const html = `<html><body>
    <script type="application/ld+json">
      {"@context":"https://schema.org","@type":"Dataset","variableMeasured":[
        {"@type":"PropertyValue","name":"a"},
        {"@type":"PropertyValue","name":"b"}
      ]}
    </script>
  </body></html>`;
  const result = analyzeHtml(html, BASE);
  assert.equal(result.jsonld_type_counts.PropertyValue, 2);
  assert.equal(result.jsonld_type_counts.Dataset, 1);
});

test("DOM要素数を数える", () => {
  const html = `<html><body><div><p>a</p><p>b</p></div></body></html>`;
  const result = analyzeHtml(html, BASE);
  // html, head(暗黙), body, div, p, p = cheerioはheadを自動挿入しないため html/body/div/p/p = 5
  assert.ok(result.dom_nodes >= 5);
});
