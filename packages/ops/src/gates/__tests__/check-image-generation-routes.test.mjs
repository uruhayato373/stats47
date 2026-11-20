import assert from "node:assert/strict";
import test from "node:test";

import { auditImageRoutes } from "../check-image-generation-routes.mjs";

const config = {
  routes: [{ id: "blog", entry: "skill.md" }],
  deterministicRoutes: [],
  legacy: [{ path: "old.ts", removalCard: "OLD-01" }],
};
const base = { config, backlog: "### [OLD-01] 撤去", exists: () => true };
const clean = [{ path: "a.ts", text: "const x = 1" }];

test("登録された経路だけなら通る", () => {
  assert.deepEqual(auditImageRoutes({ ...base, files: clean }), []);
});

test("画像 API を直接呼ぶ新しいコードを止める", () => {
  for (const text of ['responseModalities: ["IMAGE"]', 'const m = "gemini-2.5-flash-image"', 'run("@cf/stabilityai/sdxl")', "openai.images.generate({})"]) {
    assert.equal(auditImageRoutes({ ...base, files: [{ path: "new.ts", text }] }).length, 1, text);
  }
});

test("撤去待ちの既存コードとテストは止めない", () => {
  assert.deepEqual(auditImageRoutes({ ...base, files: [{ path: "old.ts", text: "flash-image" }, { path: "lib/__tests__/x.test.ts", text: "flash-image" }] }), []);
});

test("撤去カードが無い legacy と、撤去済みの登録を止める", () => {
  assert.equal(auditImageRoutes({ ...base, backlog: "", files: clean }).length, 1);
  assert.equal(auditImageRoutes({ ...base, exists: (path) => path !== "old.ts", files: clean }).length, 1);
});
