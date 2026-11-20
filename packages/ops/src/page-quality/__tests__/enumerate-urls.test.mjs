import test from "node:test";
import assert from "node:assert/strict";
import { classifyPath } from "../lib/enumerate-urls.ts";

test("ホームは home", () => {
  assert.equal(classifyPath("/"), "home");
});

test("/areas は prefecture-list", () => {
  assert.equal(classifyPath("/areas"), "prefecture-list");
});

test("/areas/13000 は prefecture-detail", () => {
  assert.equal(classifyPath("/areas/13000"), "prefecture-detail");
});

test("/areas/13000/cities/13101 は municipality (prefecture-detailより先に判定)", () => {
  assert.equal(classifyPath("/areas/13000/cities/13101"), "municipality");
});

test("/ranking/xxx は ranking", () => {
  assert.equal(classifyPath("/ranking/total-population"), "ranking");
});

test("/blog/<slug> は記事詳細 (blog-article)、一覧と /blog/tags は blog", () => {
  assert.equal(classifyPath("/blog/some-article"), "blog-article");
  assert.equal(classifyPath("/blog"), "blog");
  assert.equal(classifyPath("/blog/tags"), "blog");
});

test("/survey/xxx は survey", () => {
  assert.equal(classifyPath("/survey/census"), "survey");
});

test("/tag/xxx など未分類は other", () => {
  assert.equal(classifyPath("/tag/population"), "other");
  assert.equal(classifyPath("/compare"), "other");
});
