const assert = require("node:assert/strict");
const { execFileSync, spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const ROOT = path.resolve(__dirname, "..", "..", "..", "..");
const CHECKER = path.join(ROOT, ".claude/scripts/lib/check-route-contract.cjs");
function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "stats47-route-contract-"));
  const checker = path.join(root, ".claude/scripts/lib/check-route-contract.cjs");
  fs.mkdirSync(path.dirname(checker), { recursive: true });
  fs.copyFileSync(CHECKER, checker);
  return { root, checker };
}
function page(item, route, source) {
  const file = path.join(item.root, "apps/web/src/app", route, "page.tsx");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, source);
}
function run(item, args = []) {
  const result = spawnSync(process.execPath, [item.checker, "--json", ...args], { cwd: item.root, encoding: "utf8" });
  return { ...result, output: JSON.parse(result.stdout) };
}

test("一致するmetadataとcanonicalを受理する", (t) => {
  const item = fixture(); t.after(() => fs.rmSync(item.root, { recursive: true, force: true }));
  page(item, "about", `export const metadata = { alternates: { canonical: "/about" } }; export default function Page(){}`);
  const result = run(item);
  assert.equal(result.status, 0, result.stderr);
});

test("新規pageのmetadata欠落を検出する", (t) => {
  const item = fixture(); t.after(() => fs.rmSync(item.root, { recursive: true, force: true }));
  page(item, "missing", `export default function Page(){}`);
  const result = run(item);
  assert.equal(result.status, 1);
  assert.ok(result.output.findings.some((finding) => finding.code === "PAGE_METADATA_MISSING"));
});

test("静的routeのcanonical不一致を検出する", (t) => {
  const item = fixture(); t.after(() => fs.rmSync(item.root, { recursive: true, force: true }));
  page(item, "about", `export const metadata = { alternates: { canonical: "/other" } }; export default function Page(){}`);
  const result = run(item);
  assert.equal(result.status, 1);
  assert.ok(result.output.findings.some((finding) => finding.code === "CANONICAL_MISMATCH"));
});

test("noindexとliteral sitemapの矛盾を検出する", (t) => {
  const item = fixture(); t.after(() => fs.rmSync(item.root, { recursive: true, force: true }));
  page(item, "private", `export const metadata = { robots: "noindex, follow" }; export default function Page(){}`);
  const sitemap = path.join(item.root, "apps/web/src/app/sitemap.ts");
  fs.writeFileSync(sitemap, `export default function sitemap(){ return [{ url: "/private" }]; }`);
  const result = run(item);
  assert.equal(result.status, 1);
  assert.ok(result.output.findings.some((finding) => finding.code === "NOINDEX_SITEMAP_CONFLICT"));
});

test("baseline内の既存違反は許容する", (t) => {
  const item = fixture(); t.after(() => fs.rmSync(item.root, { recursive: true, force: true }));
  page(item, "legacy", `export default function Page(){}`);
  execFileSync(process.execPath, [item.checker, "--write-baseline"], { cwd: item.root });
  const result = run(item, ["--baseline"]);
  assert.equal(result.status, 0, result.stderr);
});
