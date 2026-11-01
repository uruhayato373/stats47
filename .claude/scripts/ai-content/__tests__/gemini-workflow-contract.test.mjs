import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const daily = readFileSync(".github/workflows/ai-content-gemini-daily.yml", "utf8");
const publisher = readFileSync(".github/workflows/publish-ai-content.yml", "utf8");

test("Gemini日次は少量・直列・structured preflight・独立criticを固定する", () => {
  assert.match(daily, /^  schedule:\n    - cron: "15 22 \* \* \*"/m);
  assert.match(daily, /github\.event_name == 'workflow_dispatch' && inputs\.verify_only\) \|\| vars\.GEMINI_FREE_TIER_VERIFIED == 'true'/);
  assert.match(daily, /ref: \$\{\{ inputs\.verify_only && github\.ref_name \|\| 'develop' \}\}/);
  assert.match(daily, /verify_only:[\s\S]*?default: true/);
  assert.match(daily, /LIMIT="\$\{\{ inputs\.verify_only && '1' \|\| inputs\.limit \|\| '3' \}\}"/);
  assert.match(daily, /GEMINI_TEXT_MODEL:.*gemini-3\.5-flash-lite/);
  assert.doesNotMatch(daily, /GEMINI_TEXT_MODEL:.*vars\.GEMINI_TEXT_MODEL/);
  assert.match(daily, /NODE_OPTIONS: --conditions react-server/);
  assert.match(daily, /default: "3"/);
  assert.match(daily, /--model gemini-api/);
  assert.match(daily, /--critic gemini-api/);
  assert.match(daily, /--concurrency 1/);
  assert.match(daily, /ai:preflight/);
});

test("無料枠canaryは実生成・審査するがgitとR2へ公開しない", () => {
  assert.match(daily, /--model gemini-api/);
  assert.match(daily, /--critic gemini-api/);
  assert.match(daily, /!inputs\.verify_only && steps\.generate\.outputs\.status != ''/);
  assert.match(daily, /!inputs\.verify_only && steps\.generate\.outputs\.status == 'success'/);
  assert.match(daily, /always\(\) && !inputs\.dry_run && !inputs\.verify_only/);
  assert.match(daily, /- 実生成: "\+r\.counters\.ok\+" PASS/);
  assert.match(daily, /r\.dryRun\|\|r\.targets!==1\|\|r\.counters\.ok!==1\|\|r\.critic!=="gemini-api"\|\|r\.requests\.critic<1/);
});

test("preflight失敗を記録してから赤にし、PASS keyだけpublisherへ渡す", () => {
  assert.match(daily, /--preflight-report \.local\/ci\/gemini-preflight\.json/);
  assert.match(daily, /--report "\$GITHUB_WORKSPACE\/\.local\/ci\/gemini-preflight\.json"/);
  assert.match(daily, /--report "\$GITHUB_WORKSPACE\/\.local\/ci\/gemini-run\.json"/);
  assert.match(daily, /Enforce preflight success/);
  assert.match(daily, /steps\.preflight\.outputs\.status == 'failure'/);
  assert.match(daily, /steps\.generate\.outputs\.status == 'failure'/);
  assert.doesNotMatch(daily, /continue-on-error:/);
  assert.doesNotMatch(daily, /hashFiles\('\.local\/ci/);
  assert.match(daily, /results\.filter\(x=>x\.status==='ok'\)/);
  assert.match(daily, /-f keys="\$\{\{ steps\.outcomes\.outputs\.passed_space \}\}"/);
  assert.doesNotMatch(daily, /-f keys="\$\{\{ steps\.targets\.outputs\.keys_space \}\}"/);
});

test("publisherは明示対象のskipとoutbox cleanup push失敗を成功扱いしない", () => {
  assert.match(publisher, /Enforce explicit publish result/);
  assert.match(publisher, /明示対象の公開が未完了/);
  assert.match(publisher, /outbox cleanup push failed/);
});
