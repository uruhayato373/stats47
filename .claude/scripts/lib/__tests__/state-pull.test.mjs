import assert from "node:assert/strict";
import { mkdtempSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { localDirFor, pullState } from "../state-pull.mjs";

test("domain の先頭 segment の直下に live/ を切り、残りをその中に置く", () => {
  const root = "/r";
  assert.equal(localDirFor("ads/ga4-affiliate", root).split(/[\\/]/).slice(-5).join("/"), ".claude/state/ads/live/ga4-affiliate");
  assert.equal(localDirFor("search-growth", root).split(/[\\/]/).slice(-4).join("/"), ".claude/state/search-growth/live");
  assert.throws(() => localDirFor("", root));
});

test("index.json の key を取得して live/ に書き、不正な key と domain は拒否する", async (t) => {
  const root = mkdtempSync(join(tmpdir(), "stats47-state-pull-"));
  const served = {
    "/state/ads/ga4-affiliate/index.json": JSON.stringify(["2026-09-14.json", "latest.json"]),
    "/state/ads/ga4-affiliate/2026-09-14.json": '{"date":"2026-09-14"}',
    "/state/ads/ga4-affiliate/latest.json": '{"date":"2026-09-14"}',
    "/state/bad/index.json": JSON.stringify(["../escape.json"]),
  };
  const original = globalThis.fetch;
  globalThis.fetch = async (url) => {
    const path = new URL(url).pathname;
    if (!(path in served)) return new Response("nf", { status: 404 });
    return new Response(served[path], { status: 200 });
  };
  t.after(() => {
    globalThis.fetch = original;
  });
  const written = await pullState("ads/ga4-affiliate", { root, log: () => {} });
  assert.equal(written.length, 2);
  assert.ok(existsSync(join(root, ".claude/state/ads/live/ga4-affiliate/latest.json")));
  assert.equal(JSON.parse(readFileSync(join(root, ".claude/state/ads/live/ga4-affiliate/2026-09-14.json"), "utf8")).date, "2026-09-14");
  const latestOnly = await pullState("ads/ga4-affiliate", { root, latestOnly: true, log: () => {} });
  assert.deepEqual(latestOnly.map((p) => p.split("/").at(-1)), ["latest.json"]);
  await assert.rejects(() => pullState("bad", { root, log: () => {} }), /不正な key/);
  await assert.rejects(() => pullState("../x", { root, log: () => {} }), /不正な domain/);
  await assert.rejects(() => pullState("missing", { root, log: () => {} }), /404/);
});
