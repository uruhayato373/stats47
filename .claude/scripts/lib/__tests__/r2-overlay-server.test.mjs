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
    const head = await fetch('http://127.0.0.1:'+port+'/app/ranking/total-population/item.json', {method:'HEAD'});
    assert.equal(head.status, 200);assert.equal(await head.text(), '');
    const data = await fetch('http://127.0.0.1:'+port+'/app/stats/total-population/values.json');
    assert.equal(await data.text(), '{"from":"upstream"}');
    assert.equal(localMetricSnapshotFile('/app/ranking/..%2Fsecret/item.json',dir),null);
    assert.equal(localMetricSnapshotFile('/app/stats/total-population/values.json',dir),null);
  } finally {overlay.close();upstream.close();fs.rmSync(dir,{recursive:true,force:true});}
});
