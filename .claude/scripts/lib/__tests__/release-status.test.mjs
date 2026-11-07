import assert from "node:assert/strict";
import { test } from "node:test";

import { recommendRelease } from "../release-status.mjs";

/** 守る意図: 本番に効かない変更や、今日すでに出した日に、main へのマージを勧めない */
const base = { sitePaths: 3, otherPaths: 5, deploysToday: 0, openPr: null };

test("本番に効く変更があり今日まだ出していなければ、オーナーに確認する", () => {
  assert.equal(recommendRelease(base).action, "ask-owner");
});

test("今日すでにデプロイしていれば待つ", () => {
  assert.equal(recommendRelease({ ...base, deploysToday: 1 }).action, "wait");
});

test("本番に効く変更が無ければ出さない", () => {
  assert.equal(recommendRelease({ ...base, sitePaths: 0 }).action, "none");
  assert.equal(recommendRelease({ ...base, sitePaths: 0, otherPaths: 0 }).action, "none");
});

test("PR が開いていれば他の条件より先に待つ", () => {
  const result = recommendRelease({ ...base, openPr: "1244" });
  assert.equal(result.action, "wait");
  assert.match(result.reason, /push しない/);
});
