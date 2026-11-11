import assert from "node:assert/strict";
import test from "node:test";

import { aggregateGooglebot, classifyPath, unavailableGooglebot } from "../../cloudflare/lib/googlebot.mjs";

const row = (count, bytes, host, method, ct, path) => ({
  count,
  sum: { edgeResponseBytes: bytes },
  dimensions: { clientRequestHTTPHost: host, clientRequestHTTPMethodName: method, edgeResponseContentTypeName: ct, clientRequestPath: path },
});

test("パス型を県×テーマ・テーマ・Geo・その他に分ける", () => {
  assert.equal(classifyPath("/areas/13000/population"), "area-theme");
  assert.equal(classifyPath("/areas/13000"), "other");
  assert.equal(classifyPath("/themes/economy"), "theme");
  assert.equal(classifyPath("/geo/flood/13"), "geo");
  assert.equal(classifyPath("/geography"), "other");
  assert.equal(classifyPath("/ranking/x?y=1"), "other");
});

test("ホスト×メソッド・メソッド×content-type・POST のパス型別を件数と平均バイトで数える", () => {
  const r = aggregateGooglebot([
    row(10, 1000, "stats47.jp", "GET", "html", "/ranking/a"),
    row(2, 200, "stats47.jp", "POST", "x-component", "/areas/13000/pop"),
    row(2, 400, "stats47.jp", "POST", "x-component", "/areas/27000/pop"),
    row(1, 50, "stats47.jp", "POST", "x-component", "/themes/economy"),
    row(1, 70, "www.stats47.jp", "POST", "html", "/geo/flood"),
  ]);
  assert.equal(r.status, "ok");
  assert.equal(r.total, 16);
  assert.deepEqual(r.byHostMethod["stats47.jp POST"], { count: 5, avgBytes: 130 });
  assert.deepEqual(r.byHostMethod["www.stats47.jp POST"], { count: 1, avgBytes: 70 });
  assert.deepEqual(r.byMethodContentType["POST x-component"], { count: 5, avgBytes: 130 });
  assert.deepEqual(r.postByPathType["area-theme"], { count: 4, avgBytes: 150 });
  assert.deepEqual(r.postByPathType.theme, { count: 1, avgBytes: 50 });
  assert.deepEqual(r.postByPathType.geo, { count: 1, avgBytes: 70 });
  assert.equal(r.postByPathType.other, undefined);
  assert.equal(r.truncated, false);
});

test("空の応答は 0 件の ok、1000 行は truncated、失敗は 0 で埋めず unavailable", () => {
  assert.equal(aggregateGooglebot([]).total, 0);
  const many = Array.from({ length: 1000 }, () => row(1, 1, "h", "GET", "html", "/"));
  assert.equal(aggregateGooglebot(many).truncated, true);
  const u = unavailableGooglebot(new Error("GraphQL error: authz"));
  assert.deepEqual(u, { status: "unavailable", reason: "GraphQL error: authz" });
  assert.equal("total" in u, false);
});
