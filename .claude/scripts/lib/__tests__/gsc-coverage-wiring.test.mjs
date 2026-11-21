// GSC カバレッジの部品 (packages/ops/src/gsc) と、.claude に残る CLI・取り込みの配線を確かめる基盤のテスト。
// 部品のテストは packages に移したが、CLI と Python の取り込みの本文は .claude にあるので、ここで突き合わせる (SCRIPTS-TO-PACKAGES-02)。
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { SUBMITTED_VIEW_SLUG } from "../../../../packages/ops/src/gsc/lib/coverage-submitted-view.mjs";

const read = (rel) => readFileSync(new URL(`../../gsc/${rel}`, import.meta.url), "utf8");

test("是正キューの CLI は drilldown の CSV を parseCoverageDrilldown で読む", () => {
  assert.match(read("build-coverage-queue.mjs"), /rows\.push\(\.\.\.parseCoverageDrilldown\(text, category\)\)/);
});

test("送信済みビューの書き出しのスラッグは、取り込み (ingest-gsc-export.py) が送信済みビューを分ける印と一致する", () => {
  assert.match(read("ingest-gsc-export.py"), new RegExp(`SUBMITTED_MARKER = "${SUBMITTED_VIEW_SLUG.slice(3)}"`));
});
