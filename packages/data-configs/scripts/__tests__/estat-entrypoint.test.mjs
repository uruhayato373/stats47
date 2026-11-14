import assert from "node:assert/strict";
import test from "node:test";
import { auditSources, isSource } from "../check-estat-entrypoint.mjs";
const text = ['https://api.', 'e-stat.go.jp/', ' NEXT_PUBLIC_', 'ESTAT_APP', '_ID'].join('');
const source = { path: "scripts/new.ts", text };
const rule = { url: 1, appId: 1, reason: "Legacy test fixture" };
test("unapproved executable/config/test literals fail", () => {
  for (const path of ["scripts/new.ts", "config/new.json", ".github/workflows/new.yml", "packages/foo/test.test.ts", "data/metrics/new.ts"]) assert.equal(auditSources([{ ...source, path }], {}).length, 1);
});
test("exceptions are exact paths and count ceilings, not permission for new uses", () => {
  assert.deepEqual(auditSources([source], { [source.path]: rule }), []);
  assert.ok(auditSources([{ ...source, text: text.repeat(2) }], { [source.path]: rule }).length);
  assert.ok(auditSources([source], { "scripts/*": rule }).length);
});
test("stale entries and allowlist expansion fail", () => {
  assert.ok(auditSources([], { [source.path]: rule }).length);
  assert.ok(auditSources([source], { [source.path]: rule }, {}).length);
  assert.deepEqual(auditSources([source], { [source.path]: rule }, { [source.path]: { ...rule, url: 2 } }), []);
});
test("credential files are never read, and prose/recorded evidence is not executable source", () => {
  for (const path of [".env", "apps/web/.env.development", "docs/foo.md", "data/report.json"]) assert.equal(isSource(path), false);
  assert.deepEqual(auditSources([{ path: "packages/estat-api/src/core/client/ingest-client.ts", text }], {}), []);
});
