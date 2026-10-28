/**
 * ブログ本文の版を private R2 に退避する archiveVersion の契約。
 * 実行: node --test .claude/scripts/blog/__tests__/archive-blog-articles.test.mjs
 */
import { strict as assert } from "node:assert";
import crypto from "node:crypto";
import { test } from "node:test";

import { archiveKey, archiveVersion } from "../archive-blog-articles.mjs";

const memoryStore = () => {
  const objects = new Map();
  return {
    objects,
    async get(key) {
      return objects.get(key) ?? null;
    },
    async put(key, bytes) {
      objects.set(key, Buffer.from(bytes));
    },
  };
};
const sha = (s) => crypto.createHash("sha256").update(s).digest("hex");

test("版を SHA の名前で保存し、同じ版は二度書かない", async () => {
  const store = memoryStore();
  const body = Buffer.from("---\ntitle: t\n---\n本文\n");
  assert.deepEqual(await archiveVersion("a", body, store), { slug: "a", status: "stored", sha256: sha(body) });
  assert.ok(store.objects.has(archiveKey("a", sha(body))));
  assert.equal((await archiveVersion("a", body, store)).status, "exists");
  assert.equal(store.objects.size, 1);
});

test("内容が変われば別の版として残し、前の版を消さない", async () => {
  const store = memoryStore();
  await archiveVersion("a", Buffer.from("v1"), store);
  await archiveVersion("a", Buffer.from("v2"), store);
  assert.equal(store.objects.size, 2);
  assert.ok(store.objects.has(archiveKey("a", sha("v1"))));
});

test("公開版が無い記事は何もしない", async () => {
  const store = memoryStore();
  assert.equal((await archiveVersion("a", null, store)).status, "absent");
  assert.equal(store.objects.size, 0);
});

test("読み戻した版が違えば失敗する (書けたつもりで消える事故を止める)", async () => {
  const store = memoryStore();
  store.put = async (key) => store.objects.set(key, Buffer.from("壊れた"));
  await assert.rejects(archiveVersion("a", Buffer.from("v1"), store), /読み戻した版の SHA が一致しない/);
});
