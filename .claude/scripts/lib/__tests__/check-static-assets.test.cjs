const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const ROOT = path.resolve(__dirname, "..", "..", "..", "..");
const CHECKER = path.join(ROOT, ".claude/scripts/lib/check-static-assets.cjs");

function png(width, height) {
  const buffer = Buffer.alloc(24);
  Buffer.from("89504e470d0a1a0a", "hex").copy(buffer, 0);
  buffer.writeUInt32BE(width, 16);
  buffer.writeUInt32BE(height, 20);
  return buffer;
}

function ico(sizes) {
  const buffer = Buffer.alloc(6 + sizes.length * 16);
  buffer.writeUInt16LE(0, 0);
  buffer.writeUInt16LE(1, 2);
  buffer.writeUInt16LE(sizes.length, 4);
  sizes.forEach((size, index) => {
    const offset = 6 + index * 16;
    buffer[offset] = size === 256 ? 0 : size;
    buffer[offset + 1] = size === 256 ? 0 : size;
  });
  return buffer;
}

function createFixture() {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "stats47-static-assets-"));
  const checkerPath = path.join(fixtureRoot, ".claude/scripts/lib/check-static-assets.cjs");
  const manifestPath = path.join(fixtureRoot, "apps/web/src/app/manifest.ts");
  const metadataPath = path.join(fixtureRoot, "apps/web/src/lib/metadata/root-metadata.ts");
  const publicRoot = path.join(fixtureRoot, "apps/web/public");
  fs.mkdirSync(path.dirname(checkerPath), { recursive: true });
  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
  fs.mkdirSync(path.dirname(metadataPath), { recursive: true });
  fs.mkdirSync(publicRoot, { recursive: true });
  fs.copyFileSync(CHECKER, checkerPath);
  fs.writeFileSync(
    manifestPath,
    `icons: [
      { src: "/favicon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/mask-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/mask-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ]`,
  );
  fs.writeFileSync(
    metadataPath,
    `icons: { apple: [{ url: "/apple.png", sizes: "180x180" }] }`,
  );
  fs.writeFileSync(path.join(publicRoot, "favicon.svg"), '<svg viewBox="0 0 64 64"></svg>');
  for (const [name, size] of [
    ["icon-192.png", 192], ["icon-512.png", 512], ["mask-192.png", 192],
    ["mask-512.png", 512], ["apple.png", 180],
  ]) fs.writeFileSync(path.join(publicRoot, name), png(size, size));
  fs.writeFileSync(path.join(publicRoot, "favicon.ico"), ico([16, 32, 48, 256]));
  return { fixtureRoot, checkerPath, publicRoot };
}

function run(fixture) {
  const result = spawnSync(process.execPath, [fixture.checkerPath, "--json"], {
    cwd: fixture.fixtureRoot,
    encoding: "utf8",
  });
  return { ...result, output: JSON.parse(result.stdout) };
}

test("完全な icon set を受理する", (t) => {
  const fixture = createFixture();
  t.after(() => fs.rmSync(fixture.fixtureRoot, { recursive: true, force: true }));
  const result = run(fixture);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(result.output.findings, []);
});

test("存在しない asset を検出する", (t) => {
  const fixture = createFixture();
  t.after(() => fs.rmSync(fixture.fixtureRoot, { recursive: true, force: true }));
  fs.rmSync(path.join(fixture.publicRoot, "icon-512.png"));
  const result = run(fixture);
  assert.equal(result.status, 1);
  assert.ok(result.output.findings.some((finding) => finding.code === "MISSING"));
});

test("PNG実寸と宣言sizeの不一致を検出する", (t) => {
  const fixture = createFixture();
  t.after(() => fs.rmSync(fixture.fixtureRoot, { recursive: true, force: true }));
  fs.writeFileSync(path.join(fixture.publicRoot, "icon-192.png"), png(191, 192));
  const result = run(fixture);
  assert.equal(result.status, 1);
  assert.ok(result.output.findings.some((finding) => finding.code === "SIZE_MISMATCH"));
});

test("SVGのactive contentと外部URLを検出する", (t) => {
  const fixture = createFixture();
  t.after(() => fs.rmSync(fixture.fixtureRoot, { recursive: true, force: true }));
  fs.writeFileSync(
    path.join(fixture.publicRoot, "favicon.svg"),
    '<svg viewBox="0 0 64 64"><script></script><image href="https://example.com/a.png"/></svg>',
  );
  const result = run(fixture);
  assert.equal(result.status, 1);
  const codes = result.output.findings.map((finding) => finding.code);
  assert.ok(codes.includes("SVG_ACTIVE_CONTENT"));
  assert.ok(codes.includes("SVG_EXTERNAL_URL"));
});

test("favicon.icoの必須size欠落を検出する", (t) => {
  const fixture = createFixture();
  t.after(() => fs.rmSync(fixture.fixtureRoot, { recursive: true, force: true }));
  fs.writeFileSync(path.join(fixture.publicRoot, "favicon.ico"), ico([16, 32]));
  const result = run(fixture);
  assert.equal(result.status, 1);
  assert.ok(result.output.findings.some((finding) => finding.code === "ICO_SIZE"));
});
