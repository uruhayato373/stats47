import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const daily = readFileSync(".github/workflows/ai-content-gemini-daily.yml", "utf8");
const publisher = readFileSync(".github/workflows/publish-ai-content.yml", "utf8");

test("Gemini日次は少量・直列・structured preflight・独立criticを固定する", () => {
  assert.match(daily, /cron: "15 22 \* \* \*"/);
  assert.match(daily, /GEMINI_TEXT_MODEL:.*gemini-3\.7-flash/);
  assert.match(daily, /default: "3"/);
  assert.match(daily, /--model gemini-api/);
  assert.match(daily, /--critic gemini-api/);
  assert.match(daily, /--concurrency 1/);
  assert.match(daily, /ai:preflight/);
});

test("preflight失敗を記録してから赤にし、PASS keyだけpublisherへ渡す", () => {
  assert.match(daily, /--preflight-report \.local\/ci\/gemini-preflight\.json/);
  assert.match(daily, /Enforce preflight success/);
  assert.match(daily, /results\.filter\(x=>x\.status==='ok'\)/);
  assert.match(daily, /-f keys="\$\{\{ steps\.outcomes\.outputs\.passed_space \}\}"/);
  assert.doesNotMatch(daily, /-f keys="\$\{\{ steps\.targets\.outputs\.keys_space \}\}"/);
});

test("publisherは明示対象のskipとoutbox cleanup push失敗を成功扱いしない", () => {
  assert.match(publisher, /Enforce explicit publish result/);
  assert.match(publisher, /明示対象の公開が未完了/);
  assert.match(publisher, /outbox cleanup push failed/);
});
