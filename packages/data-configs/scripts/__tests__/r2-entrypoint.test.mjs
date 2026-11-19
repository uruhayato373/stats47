import assert from "node:assert/strict";
import test from "node:test";
import { auditSources, followRenames, isSource, literalCounts } from "../../../r2-storage/scripts/check-r2-entrypoint.mjs";

const literals = {
  stats: ["app", "stats", "x"].join("/"),
  ranking: ["app", "ranking", "x"].join("/"),
  origin: ["storage", "stats47", "jp"].join("."),
  s3Client: ["new", "S3Client("].join(" "),
};
const text = Object.values(literals).join("\n");
const source = { path: "scripts/new.ts", text };
const rule = { stats: 1, ranking: 1, origin: 1, s3Client: 1, reason: "Legacy test fixture" };

test("each new literal fails in executable sources, configs, tests and workflows", () => {
  for (const text of Object.values(literals)) {
    for (const path of ["scripts/new.ts", "config/new.json", ".github/workflows/new.yml", "packages/foo/test.test.ts", "data/metrics/new.ts"]) {
      assert.match(auditSources([{ path, text }], {}).join("\n"), /outside approved limits/);
    }
  }
  assert.deepEqual(literalCounts(text.repeat(2)), { stats: 2, ranking: 2, origin: 2, s3Client: 2 });
});

test("exact-file per-literal ceilings prevent new uses", () => {
  assert.deepEqual(auditSources([source], { [source.path]: rule }), []);
  for (const text of Object.values(literals)) {
    assert.match(auditSources([{ ...source, text: source.text + text }], { [source.path]: rule }).join("\n"), /outside approved limits/);
  }
  assert.ok(auditSources([source], { "scripts/*": rule }).length);
});

test("baselines can only shrink, independently for every literal", () => {
  assert.match(auditSources([source], { [source.path]: rule }, {}).join("\n"), /may only shrink/);
  for (const key of Object.keys(literals)) {
    assert.match(auditSources([source], { [source.path]: rule }, { [source.path]: { ...rule, [key]: 0 } }).join("\n"), /may only shrink/);
    assert.deepEqual(auditSources([source], { [source.path]: rule }, { [source.path]: { ...rule, [key]: 2 } }), []);
    assert.match(auditSources([source], { [source.path]: { ...rule, [key]: 2 } }).join("\n"), /shrink stale allowlist counts/);
  }
});

test("unused entries, missing reasons and malformed ceilings fail", () => {
  assert.match(auditSources([], { [source.path]: rule }).join("\n"), /remove unused/);
  assert.match(auditSources([{ ...source, text: "" }], { [source.path]: rule }).join("\n"), /remove unused/);
  for (const invalid of [{ ...rule, reason: " " }, { ...rule, stats: -1 }, { ...rule, ranking: 0.5 }, { ...rule, origin: undefined }]) {
    assert.match(auditSources([source], { [source.path]: invalid }).join("\n"), /invalid exception/);
  }
});

test("source inventory excludes credentials, prose, recorded data and dependency locks", () => {
  for (const path of [".env", "apps/web/.env.development", "docs/foo.md", "data/report.json", ".claude/state/a.json", "node_modules/a.ts", "package-lock.json", ".claude/config/r2-entrypoint-baseline.json"]) {
    assert.equal(isSource(path), false);
  }
});

test("only the five exact entry files are exempt", () => {
  for (const path of [
    "packages/r2-storage/src/keys.ts",
    "packages/r2-storage/mirror/r2-keys.mjs",
    "packages/r2-storage/src/scripts/r2-key-classes.ts",
    "packages/r2-storage/src/lib/clients/private-r2-store.mjs",
    "packages/r2-storage/src/lib/clients/get-s3-client.ts",
  ]) {
    assert.deepEqual(auditSources([{ path, text }], {}), []);
    assert.ok(auditSources([{ path: `other/${path}`, text }], {}).length);
  }
});

test("改名したファイルの行は、元のパスの行を引き継いで縮小専用の比較をする", () => {
  const previous = { "old/a.mjs": { stats: 1 } };
  const followed = followRenames(previous, [["old/a.mjs", "new/a.mjs"]]);
  assert.deepEqual(followed["new/a.mjs"], { stats: 1 });
  // 引き継ぐのは元の行がある改名だけ。元に無いパスへは何も足さない
  assert.equal(followRenames(previous, [["old/b.mjs", "new/b.mjs"]])["new/b.mjs"], undefined);
  assert.equal(followRenames(undefined, [["old/a.mjs", "new/a.mjs"]]), undefined);
});
