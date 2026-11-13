import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { mergeIndexKeys, prepareState, stageDirFor, verifyState } from "../state-publish.mjs";

function serve(t, served) {
  const original = globalThis.fetch;
  globalThis.fetch = async (url) => {
    const path = new URL(url).pathname;
    if (!(path in served)) return new Response("nf", { status: 404 });
    return new Response(served[path], { status: 200 });
  };
  t.after(() => {
    globalThis.fetch = original;
  });
}

test("index は既存の key と今回の key と latest.json を重複なしで並べ、不正な key は拒否する", () => {
  assert.deepEqual(mergeIndexKeys(["b.json", "latest.json"], ["a.json", "b.json"]), ["a.json", "b.json", "latest.json"]);
  assert.throws(() => mergeIndexKeys([], ["../x.json"]), /不正な key/);
  assert.throws(() => mergeIndexKeys("x", ["a.json"]), /配列/);
});

test("prepare は既存 index に今回の生 snapshot を足し、名前の新しいものを latest.json にして stage に置く", async (t) => {
  const root = mkdtempSync(join(tmpdir(), "stats47-state-publish-"));
  mkdirSync(join(root, "data/psi/live"), { recursive: true });
  const older = join(root, "data/psi/live/psi-batch-2026-11-06T21-43-19.json");
  const newer = join(root, "data/psi/live/psi-batch-2026-11-13T22-10-00.json");
  writeFileSync(older, '{"generated_at":"2026-11-06T21:43:19Z"}');
  writeFileSync(newer, '{"generated_at":"2026-11-13T22:10:00Z"}');
  serve(t, { "/state/psi/index.json": JSON.stringify(["psi-batch-2026-10-30T21-00-00.json", "latest.json"]) });

  const staged = await prepareState("psi", [newer, older], { root, log: () => {} });
  const dir = stageDirFor("psi", root);
  assert.deepEqual(staged.keys, ["psi-batch-2026-10-30T21-00-00.json", "psi-batch-2026-11-06T21-43-19.json", "psi-batch-2026-11-13T22-10-00.json", "latest.json"]);
  assert.deepEqual(JSON.parse(readFileSync(join(dir, "index.json"), "utf8")), staged.keys);
  assert.equal(readFileSync(join(dir, "latest.json"), "utf8"), readFileSync(newer, "utf8"));
  assert.equal(readFileSync(join(dir, "psi-batch-2026-11-06T21-43-19.json"), "utf8"), readFileSync(older, "utf8"));
});

test("prepare は index.json が無い最初の回を空から始め、生 snapshot が無ければ止まる", async (t) => {
  const root = mkdtempSync(join(tmpdir(), "stats47-state-publish-"));
  const file = join(root, "a.json");
  writeFileSync(file, "{}");
  serve(t, {});
  const staged = await prepareState("cloudflare/snapshots", [file], { root, log: () => {} });
  assert.deepEqual(staged.keys, ["a.json", "latest.json"]);
  await assert.rejects(() => prepareState("psi", [], { root, log: () => {} }), /生 snapshot が無い/);
  await assert.rejects(() => prepareState("../x", [file], { root, log: () => {} }), /不正な domain/);
});

test("verify は公開 URL の bytes と index 登録が stage と一致したときだけ通る", async (t) => {
  const root = mkdtempSync(join(tmpdir(), "stats47-state-publish-"));
  const file = join(root, "psi-batch-2026-11-13T22-10-00.json");
  writeFileSync(file, '{"v":1}');
  serve(t, {});
  await prepareState("psi", [file], { root, log: () => {} });

  serve(t, {
    "/state/psi/psi-batch-2026-11-13T22-10-00.json": '{"v":1}',
    "/state/psi/latest.json": '{"v":1}',
    "/state/psi/index.json": readFileSync(join(stageDirFor("psi", root), "index.json"), "utf8"),
  });
  await verifyState("psi", { root, attempts: 1, log: () => {} });

  serve(t, {
    "/state/psi/psi-batch-2026-11-13T22-10-00.json": '{"v":0}',
    "/state/psi/latest.json": '{"v":1}',
    "/state/psi/index.json": readFileSync(join(stageDirFor("psi", root), "index.json"), "utf8"),
  });
  await assert.rejects(() => verifyState("psi", { root, attempts: 1, log: () => {} }), /read-back/);
});
