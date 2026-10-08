/**
 * 年度の指標の図に「2021年」と書かないことを固定する (BLOG-FETCH-RANKING-FISCAL-01)。
 * 実行: node --test .claude/scripts/blog/lib/__tests__/ranking-year-label.test.mjs
 *
 * 純粋関数の判定に加え、fetch-ranking-data-r2.mjs をローカルの偽 R2 に向けて実行し、
 * ランキングとタイルマップの両方の data JSON の subtitle を確かめる (配線まで固定する)。
 */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { resolveYearFormat, yearLabelOf } from "../ranking-year-label.mjs";

const SCRIPT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "fetch-ranking-data-r2.mjs");

test("item.yearFormat が fiscal なら年度、calendar なら年", () => {
  assert.equal(yearLabelOf("2021", { yearFormat: "fiscal" }), "2021年度");
  assert.equal(yearLabelOf("2021", { yearFormat: "calendar" }), "2021年");
});

test("yearFormat を持たない item.json は builder が焼いた yearName から年度を判定する", () => {
  const fiscal = { latestYear: { yearCode: "2021", yearName: "2021年度" }, availableYears: [{ yearCode: "2020", yearName: "2020年度" }] };
  assert.equal(resolveYearFormat(fiscal), "fiscal");
  assert.equal(yearLabelOf("2020", fiscal), "2020年度");
  const calendar = { latestYear: { yearCode: "2020", yearName: "2020年" }, availableYears: [{ yearCode: "2020", yearName: "2020年" }] };
  assert.equal(yearLabelOf("2020", calendar), "2020年");
});

test("年の情報が無い item (item.json 取得失敗を含む) は従来どおり暦年", () => {
  assert.equal(yearLabelOf("2020", {}), "2020年");
  assert.equal(yearLabelOf("2020", undefined), "2020年");
});

function serve(routes) {
  const server = http.createServer((req, res) => {
    const body = routes[req.url.split("?")[0]];
    if (!body) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify(body));
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server)));
}

function run(args, env) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [SCRIPT, ...args], { env: { ...process.env, ...env } });
    let stderr = "";
    child.stderr.on("data", (chunk) => (stderr += chunk));
    child.on("close", (status) => resolve({ status, stderr }));
  });
}

const PREFS = ["北海道", "青森県", "東京都"];
const values = {
  partitions: [
    { yearCode: "2021", values: PREFS.map((areaName, i) => ({ areaName, areaCode: `0${i + 1}000`, value: 100 - i * 10 })) },
    { yearCode: "2020", values: PREFS.map((areaName, i) => ({ areaName, areaCode: `0${i + 1}000`, value: 90 - i * 10 })) },
  ],
};

for (const [label, item, expected] of [
  ["年度の指標", { title: "県民所得", unit: "千円", latestYear: { yearCode: "2021", yearName: "2021年度" }, availableYears: [{ yearCode: "2021", yearName: "2021年度" }, { yearCode: "2020", yearName: "2020年度" }] }, "2021年度"],
  ["暦年の指標", { title: "人口", unit: "人", latestYear: { yearCode: "2021", yearName: "2021年" }, availableYears: [{ yearCode: "2021", yearName: "2021年" }] }, "2021年"],
]) {
  test(`fetch-ranking-data-r2: ${label}のランキングと地図の subtitle は「${expected}」`, async (t) => {
    const server = await serve({
      "/app/ranking/sample-key/values.json": values,
      "/app/ranking/sample-key/item.json": { item },
    });
    const base = fs.mkdtempSync(path.join(os.tmpdir(), "fetch-ranking-year-"));
    t.after(() => {
      server.close();
      fs.rmSync(base, { recursive: true, force: true });
    });
    const { port } = server.address();
    const result = await run(
      ["--slug", "sample", "--base", base, "--keys", "sample-key", "--with-map"],
      { R2_PUBLIC_FETCH_URL: `http://127.0.0.1:${port}` },
    );
    assert.equal(result.status, 0, result.stderr);
    const dataDir = path.join(base, "sample", "data");
    const ranking = JSON.parse(fs.readFileSync(path.join(dataDir, "sample-prefecture-rankings.json"), "utf8"));
    const map = JSON.parse(fs.readFileSync(path.join(dataDir, "sample-map.json"), "utf8"));
    assert.equal(ranking.subtitle, expected);
    assert.equal(map.subtitle, expected);
    assert.equal(ranking.year, "2021");
  });
}
