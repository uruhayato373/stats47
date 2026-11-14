/**
 * PR の E2E 用の R2 読み取り中継 (.github/scripts/r2-overlay-server.mjs) の契約。
 * page-components だけを PR の生成物から返し、それ以外は本番へ取り次ぐ (E2E-THEME-PR-PAGECOMPONENTS-01)。
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const { createOverlayServer, localPageComponentsFile, localMetricSnapshotFile } = await import(
  pathToFileURL(path.join(ROOT, ".github/scripts/r2-overlay-server.mjs")).href
);

function listen(server) {
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server.address().port)));
}

function fixtureDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "r2-overlay-"));
  fs.mkdirSync(path.join(dir, "theme"));
  fs.writeFileSync(path.join(dir, "theme", "consumer-prices.json"), '[{"componentType":"cpi-heatmap"}]');
  return dir;
}

test("page-components は PR の生成物を返し、それ以外の key は本番へ取り次ぐ", async () => {
  const upstream = http.createServer((req, res) => {
    res.writeHead(req.url === "/app/stats/x/values.json" ? 200 : 404, { "content-type": "application/json" });
    res.end(req.url === "/app/stats/x/values.json" ? '{"from":"upstream"}' : "");
  });
  const upstreamPort = await listen(upstream);
  const overlay = createOverlayServer({ upstream: `http://127.0.0.1:${upstreamPort}`, localDir: fixtureDir() });
  const port = await listen(overlay);
  try {
    const local = await fetch(`http://127.0.0.1:${port}/app/page-components/theme/consumer-prices.json`);
    assert.equal(local.status, 200);
    assert.equal(await local.text(), '[{"componentType":"cpi-heatmap"}]');

    const proxied = await fetch(`http://127.0.0.1:${port}/app/stats/x/values.json`);
    assert.equal(proxied.status, 200);
    assert.equal(await proxied.text(), '{"from":"upstream"}');

    // PR に生成物が無い key は本番の結果 (ここでは 404) をそのまま返す
    const missing = await fetch(`http://127.0.0.1:${port}/app/page-components/theme/not-in-pr.json`);
    assert.equal(missing.status, 404);
  } finally {
    overlay.close();
    upstream.close();
  }
});

test("page-components の外や上位ディレクトリを指す path はローカルのファイルに当てない", () => {
  const dir = fixtureDir();
  assert.equal(localPageComponentsFile("/app/page-components/theme/consumer-prices.json", dir), path.join(dir, "theme", "consumer-prices.json"));
  assert.equal(localPageComponentsFile("/app/page-components/theme/..%2F..%2Fsecret.json", dir), null);
  assert.equal(localPageComponentsFile("/app/page-components/../theme/consumer-prices.json", dir), null);
  assert.equal(localPageComponentsFile("/app/stats/theme/consumer-prices.json", dir), null);
  assert.equal(localPageComponentsFile("/app/page-components/theme/consumer-prices.txt", dir), null);
});

test("generated metric metadata overrides remote metadata while observations remain upstream", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "metric-overlay-"));
  const itemDir = path.join(dir, "app/ranking/total-population");
  fs.mkdirSync(itemDir, {recursive:true});
  fs.writeFileSync(path.join(itemDir, "item.json"), '{"presentation":"current"}');
  fs.mkdirSync(path.join(dir, 'app/home'), {recursive:true});
  fs.writeFileSync(path.join(dir, 'app/home/featured.json'), '{"presentation":"home-current"}');
  fs.mkdirSync(path.join(dir, 'app/areas/13000/cities/13101'), {recursive:true});
  fs.writeFileSync(path.join(dir, 'app/areas/13000/cities/13101/databook.json'), '{"databook":"current"}');
  fs.mkdirSync(path.join(dir, "app/stats/total-population"), {recursive:true});
  fs.writeFileSync(path.join(dir, "app/stats/total-population/values.json"), '{"not":"authoritative"}');
  const upstream = http.createServer((_req,res) => {res.writeHead(200);res.end('{"from":"upstream"}');});
  const upstreamPort = await listen(upstream);
  const overlay = createOverlayServer({upstream: 'http://127.0.0.1:'+upstreamPort, snapshotDir:dir});
  const port = await listen(overlay);
  try {
    const local = await fetch('http://127.0.0.1:'+port+'/app/ranking/total-population/item.json');
    assert.equal(await local.text(), '{"presentation":"current"}');
    const home = await fetch('http://127.0.0.1:'+port+'/app/home/featured.json');
    assert.equal(await home.text(), '{"presentation":"home-current"}');
    const databook = await fetch('http://127.0.0.1:'+port+'/app/areas/13000/cities/13101/databook.json');
    assert.equal(await databook.text(), '{"databook":"current"}');
    const head = await fetch('http://127.0.0.1:'+port+'/app/ranking/total-population/item.json', {method:'HEAD'});
    assert.equal(head.status, 200);assert.equal(await head.text(), '');
    const data = await fetch('http://127.0.0.1:'+port+'/app/stats/total-population/values.json');
    assert.equal(await data.text(), '{"from":"upstream"}');
    assert.equal(localMetricSnapshotFile('/app/ranking/..%2Fsecret/item.json',dir),null);
    assert.equal(localMetricSnapshotFile('/app/stats/total-population/values.json',dir),null);
  } finally {overlay.close();upstream.close();fs.rmSync(dir,{recursive:true,force:true});}
});

test('中継が手元から返す種類は共通の定義から決まり、返さない種類は本番へ取り次ぐ (METRIC-RELEASE-PATHS-SSOT-01)', async () => {
  const { OVERLAY_PATH_PATTERN, METRIC_RELEASE_KINDS } = await import(new URL('../../../../.github/scripts/metric-release-paths.mjs', import.meta.url));
  // 期待する種類はここに直接書く。定義から 1 種類消すと落ちる
  for (const p of ['/app/ranking/x/item.json', '/app/ranking-items/all.json', '/app/home/featured.json', '/app/municipalities/ranking/x/item.json', '/app/municipalities/ranking/x/values.json', '/app/areas/13000/cities/13101/databook.json']) assert.ok(OVERLAY_PATH_PATTERN.test(p), p);
  for (const p of ['/app/categories/all.json', '/app/survey/all.json', '/app/municipalities/ranking/x/ai-content.json', '/app/stats/x/values.json']) assert.equal(OVERLAY_PATH_PATTERN.test(p), false, p);
  for (const kind of METRIC_RELEASE_KINDS.filter((k) => !k.overlay)) assert.ok(kind.reason, `${kind.id} は返さない理由を書く`);
});

test('本番 R2 が 5xx を返した取り次ぎも、接続失敗と同じくログに残る (E2E-FAILURE-EVIDENCE-01)', async () => {
  const upstream = http.createServer((req, res) => {
    res.writeHead(req.url === "/app/stats/x/values.json" ? 503 : 404);
    res.end();
  });
  const upstreamPort = await listen(upstream);
  const lines = [];
  const overlay = createOverlayServer({ upstream: `http://127.0.0.1:${upstreamPort}`, localDir: fixtureDir(), log: (line) => lines.push(line) });
  const port = await listen(overlay);
  try {
    const failed = await fetch(`http://127.0.0.1:${port}/app/stats/x/values.json`);
    assert.equal(failed.status, 503);
    assert.ok(lines.some((l) => l.includes("upstream 503") && l.includes("/app/stats/x/values.json")), lines.join("\n"));
    // 404 は PR にだけ無い key の通常の取り次ぎなので、失敗として数えない
    await fetch(`http://127.0.0.1:${port}/app/stats/x/missing.json`);
    assert.equal(lines.some((l) => l.includes("missing.json")), false, lines.join("\n"));
  } finally {
    overlay.close();
    upstream.close();
  }
});

test('代表 E2E ジョブは、サーバーの出力と R2 中継のログを失敗時に artifact へ上げる (E2E-FAILURE-EVIDENCE-01)', () => {
  const workflow = fs.readFileSync(path.join(ROOT, ".github/workflows/pr-quality-check.yml"), "utf8");
  const start = workflow.indexOf("\n  e2e:\n");
  const end = workflow.indexOf("\n  quality-check:\n", start);
  assert.ok(start >= 0 && end > start, "e2e job が見つからない");
  const job = workflow.slice(start, end);
  // Playwright の webServer は reuseExistingServer で使われず、next start の出力は /tmp のファイルへ行く。
  // そのファイルを artifact の対象へ集めていなければ、ジョブのログが流れた後は読めない。
  assert.match(job, /cp \/tmp\/pr-e2e-next\.log \/tmp\/pr-e2e-r2-overlay\.log apps\/web\/server-logs\//, "2 つのログを server-logs へ集める");
  const upload = job.slice(job.indexOf("name: playwright-e2e-report"));
  assert.ok(upload.includes("apps/web/server-logs/"), "server-logs を artifact の path に含める");
});
