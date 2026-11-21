import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

// .claude の代表ページ計測の入口を読むので基盤のテストに置く (本体 apps/web/scripts/lib/__tests__/local-verification.test.mjs とは別)
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");

test("代表ページ計測はChromium sessionをURL間で共有し、ローカルは1回計測する", () => {
  const representative = fs.readFileSync(
    path.join(ROOT, ".claude/scripts/page-quality/run-representative.ts"),
    "utf8",
  );
  const browser = fs.readFileSync(
    path.join(ROOT, "packages/ops/src/page-quality/lib/measure-browser.ts"),
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
