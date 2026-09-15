import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");

test("ローカル検証はfastとreleaseの二入口だけを公開する", () => {
  const rootPackage = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
  assert.equal(rootPackage.scripts["check:local"], "tsx apps/web/scripts/local-verification.ts fast");
  assert.equal(
    rootPackage.scripts["check:release-local"],
    "tsx apps/web/scripts/local-verification.ts release",
  );
});

test("release検査はdev成果物と分離し、1回のbuildを代表検査で共有する", () => {
  const source = fs.readFileSync(
    path.join(ROOT, "apps/web/scripts/local-verification.ts"),
    "utf8",
  );
  const nextConfig = fs.readFileSync(path.join(ROOT, "apps/web/next.config.ts"), "utf8");
  assert.match(source, /RELEASE_DIST_DIR = "\.local\/next-release"/);
  assert.match(source, /Web production build（1回）/);
  assert.equal((source.match(/"run", "build", "--workspace=apps\/web"/g) ?? []).length, 1);
  assert.match(source, /PLAYWRIGHT_TEST_BASE_URL: baseUrl/);
  assert.match(source, /runPageQuality\(baseUrl, diffBase, true\)/);
  assert.match(source, /MAX_LOCAL_TEST_FILES = 12/);
  assert.match(source, /args\.push\("--max-templates", "3"\)/);
  assert.match(source, /mode === "fast" \? "HEAD" : "origin\/main"/);
  assert.match(source, /process\.argv\.includes\("--typecheck"\)/);
  assert.match(nextConfig, /distDir: process\.env\.NEXT_DIST_DIR \|\| "\.next"/);
});

test("代表ページ計測はChromium sessionをURL間で共有し、ローカルは1回計測する", () => {
  const representative = fs.readFileSync(
    path.join(ROOT, ".claude/scripts/page-quality/run-representative.ts"),
    "utf8",
  );
  const browser = fs.readFileSync(
    path.join(ROOT, ".claude/scripts/page-quality/lib/measure-browser.ts"),
    "utf8",
  );
  assert.match(representative, /createBrowserMeasurementSession\(\)/);
  assert.match(representative, /get\("--runs"\) \?\? "1"/);
  assert.match(browser, /export async function createBrowserMeasurementSession/);
  assert.equal(
    (browser.match(/context\.newPage\(\)/g) ?? []).length,
    1,
    "横スクロール検査のために同じURLを余分に再読込しない",
  );
});
