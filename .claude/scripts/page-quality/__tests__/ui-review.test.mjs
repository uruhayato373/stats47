import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PNG } from "pngjs";

import { compareScreenshots, sliceIntoTiles } from "../lib/screenshots.ts";
import { buildUiAlert, newUiViolations, structuredOutput, validateReview } from "../lib/ui-report.ts";

function png(width, height, paint) {
  const img = new PNG({ width, height });
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [r, g, b] = paint(x, y);
      const i = (y * width + x) * 4;
      img.data[i] = r;
      img.data[i + 1] = g;
      img.data[i + 2] = b;
      img.data[i + 3] = 255;
    }
  }
  return PNG.sync.write(img);
}

const white = () => [255, 255, 255];

test("同じ画面の変化率は 0、半分を塗り替えると約 0.5、ページの高さが変わればその割合も変化に数える", () => {
  const base = png(40, 40, white);
  assert.equal(compareScreenshots(base, base).changeRatio, 0);
  const half = png(40, 40, (x) => (x < 20 ? [0, 0, 0] : [255, 255, 255]));
  assert.ok(Math.abs(compareScreenshots(half, base).changeRatio - 0.5) < 0.01);
  const taller = png(40, 80, white);
  assert.equal(compareScreenshots(taller, base).changeRatio, 0.5);
});

test("縦長のスクショを画面 1 枚分ずつ上から切り出し、上限枚数で打ち切る", () => {
  const tall = png(10, 25, (x, y) => (y < 10 ? [255, 0, 0] : y < 20 ? [0, 255, 0] : [0, 0, 255]));
  const tiles = sliceIntoTiles(tall, 10, 5).map((t) => PNG.sync.read(t));
  assert.deepEqual(tiles.map((t) => t.height), [10, 10, 5]);
  assert.deepEqual([...tiles[1].data.subarray(0, 3)], [0, 255, 0], "2 枚目は 10px 目から始まる");
  assert.equal(sliceIntoTiles(tall, 10, 2).length, 2);
});

const violation = (url, metric_key) => ({
  url,
  template: "ranking",
  metric_key,
  comparison: "absolute",
  operator: "<=",
  threshold: 0,
  actual: 1,
  previous: null,
  severity: "warning",
});
const run = (violations) => ({ schemaVersion: 1, mode: "full", generated_at: "2026-09-27T18:00:00Z", commit_sha: null, environment: "x", results: [], violations });

test("新規の UI 違反は先週に無かった (URL, 指標) だけで、肥大化などの既存指標は含めない", () => {
  const prev = run([violation("u1", "clipped_text")]);
  const cur = run([violation("u1", "clipped_text"), violation("u2", "clipped_text"), violation("u1", "a11y_violations"), violation("u3", "duplicate_link_ratio")]);
  const fresh = newUiViolations(cur, prev);
  assert.equal(fresh.firstRun, false);
  assert.deepEqual(fresh.violations.map((v) => `${v.url}|${v.metric_key}`), ["u2|clipped_text", "u1|a11y_violations"]);
  const first = newUiViolations(cur, null);
  assert.equal(first.firstRun, true);
  assert.equal(first.violations.length, 3);
});

const input = {
  generatedAt: "2026-09-27T18:00:00Z",
  pages: [{ template: "home", url: "https://stats47.jp/", screenshots: [{ device: "mobile", localPath: "a.png", changeRatio: 0.35, height: 3000, tilePaths: ["a-1.png"] }], automatedFindings: [] }],
};
const finding = (over = {}) => ({ template: "home", device: "mobile", severity: "medium", location: "上から約 400px のカード", issue: "矢印がカードの数値に重なっている", suggestion: "矢印をカードの外に出す", ...over });

test("agent の指摘は撮影した画面だけを採用し、存在しない画面や形の崩れた指摘は捨てる", () => {
  const { report, rejected } = validateReview(
    { status: "reviewed", summary: "確認した", findings: [finding(), finding({ device: "desktop" }), finding({ template: "blog" }), finding({ severity: "urgent" })] },
    input
  );
  assert.equal(report.findings.length, 1);
  assert.equal(rejected.length, 3);
  assert.throws(() => validateReview({ status: "done", findings: [] }, input), /no valid status/);
});

test("通知本文は新規の機械検出も agent の指摘も無ければ null、あれば両方と大きく変わった画面を載せる", () => {
  const common = { date: "2026-09-27", firstRun: false, reviewError: null, input, screenshotBaseUrl: "https://s", keyOf: (t, d) => `k/${t}-${d}.png` };
  assert.equal(buildUiAlert({ ...common, newViolations: [], review: { status: "no-issues", summary: "問題なし", findings: [] } }), null);
  const body = buildUiAlert({ ...common, newViolations: [violation("https://stats47.jp/ranking/a", "clipped_text")], review: { status: "reviewed", summary: "x", findings: [finding()] } });
  assert.match(body, /`\/ranking\/a` clipped_text/);
  assert.match(body, /矢印がカードの数値に重なっている/);
  assert.match(body, /\(https:\/\/s\/k\/home-mobile\.png\)/);
  assert.match(body, /home \/ mobile: 35%/);
  const failed = buildUiAlert({ ...common, newViolations: [], review: null, reviewError: "agent step: failure" });
  assert.match(failed, /agent の確認は実行できなかった/);
});

test("execution file から成功した結果の構造化出力だけを取り出す", () => {
  const dir = mkdtempSync(join(tmpdir(), "ui-review-"));
  const ok = join(dir, "ok.json");
  writeFileSync(ok, JSON.stringify([{ type: "system" }, { type: "result", subtype: "success", is_error: false, structured_output: { status: "no-issues" } }]));
  assert.deepEqual(structuredOutput(ok), { status: "no-issues" });
  const ng = join(dir, "ng.json");
  writeFileSync(ng, JSON.stringify([{ type: "result", subtype: "error_max_turns", is_error: true }]));
  assert.throws(() => structuredOutput(ng), /did not succeed/);
});
