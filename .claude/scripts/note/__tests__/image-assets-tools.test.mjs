import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { referencedPngs, missingImages } from "../ensure-note-images.mjs";
import { pendingSvgs } from "../regen-derived-png.mjs";
import { resolveDriveInput } from "../lib/drive-assets.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const require = createRequire(import.meta.url);
const tmp = () => mkdtempSync(join(tmpdir(), "note-tools-"));

test("draft の画像参照だけを拾い、コードフェンス内の例は無視する", () => {
  const md = "![a](images/a.png)\n\n```\n![example](images/example.png)\n```\n![外部](https://x/y.png)\n![b](images/b.png)\n";
  assert.deepEqual(referencedPngs(md), ["images/a.png", "images/b.png"]);
});

test("足りない画像: 参照された PNG と、render-spec を持つ記事の 4 枚", () => {
  const dir = tmp();
  try {
    mkdirSync(join(dir, "images"));
    writeFileSync(join(dir, "draft.md"), "![a](images/a.png)\n![b](images/b.png)\n");
    writeFileSync(join(dir, "images/a.png"), "x");
    assert.deepEqual(missingImages(dir), ["images/b.png"]);
    writeFileSync(join(dir, "render-spec.json"), "{}");
    const missing = missingImages(dir);
    assert.ok(missing.includes("images/b.png") && missing.includes("images/cover-1280x670.png") && missing.length === 5);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("再生成の対象は『Markdown が PNG として参照し、PNG がまだ無い SVG』だけ", () => {
  const dir = tmp();
  try {
    mkdirSync(join(dir, "images"));
    for (const name of ["used.svg", "unused.svg", "done.svg"]) writeFileSync(join(dir, "images", name), "<svg/>");
    writeFileSync(join(dir, "images/done.png"), "x");
    writeFileSync(join(dir, "draft.md"), "![u](images/used.png)\n![d](images/done.png)\n");
    assert.deepEqual(pendingSvgs(dir).map((f) => f.split("/").pop()), ["used.svg"]);
    assert.deepEqual(pendingSvgs(dir, { force: true }).map((f) => f.split("/").pop()).sort(), ["done.svg", "used.svg"]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("ensure-note-images は docs/31 の外を拒否する (終了コード 2)", () => {
  const dir = tmp();
  try {
    const r = spawnSync("node", [join(ROOT, ".claude/scripts/note/ensure-note-images.mjs"), dir], { encoding: "utf8" });
    assert.equal(r.status, 2);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("Drive 入力の形式を厳格に検査する (別 slug への抜け・パス区切りを拒否)", async () => {
  for (const bad of ["drive:", "drive:a-x", "drive:A-x/file.png", "drive:a-x/../y.png", "drive:a-x/sub/f.png", "/abs/path.png"]) {
    await assert.rejects(() => resolveDriveInput(bad), /drive: の形式/);
  }
});

test("背景の取り込み: 1280x670 の JPEG に正規化し、SHA と R2 キーが内容から決まる (同じ入力は同じ結果)", async () => {
  const sharp = require("sharp");
  const dir = tmp();
  const slug = "a-zz-tools-test";
  const staged = join(ROOT, ".local/r2/media/note-backgrounds", slug);
  let cacheFile = null;
  try {
    const src = join(dir, "in.png");
    await sharp({ create: { width: 900, height: 900, channels: 3, background: "#245" } }).png().toFile(src);
    const run = () => {
      const r = spawnSync("node", [join(ROOT, ".claude/scripts/note/ingest-note-background.mjs"), "--slug", slug, "--input", src], { encoding: "utf8" });
      assert.equal(r.status, 0, r.stderr);
      return JSON.parse(r.stdout);
    };
    const first = run();
    cacheFile = join(ROOT, ".local/note-backgrounds", `${first.sha256}.jpg`);
    const second = run();
    assert.equal(first.sha256, second.sha256);
    assert.equal(first.r2Key, `media/note-backgrounds/${slug}/${first.sha256.slice(0, 12)}/background.jpg`);
    const meta = await sharp(readFileSync(first.staged)).metadata();
    assert.deepEqual([meta.format, meta.width, meta.height], ["jpeg", 1280, 670]);
    // モデル・指示文が無いので spec には書けない (--write-spec は止まる)
    assert.ok(first.problems.some((p) => p.includes("model")) && first.problems.some((p) => p.includes("prompt")));
  } finally {
    rmSync(dir, { recursive: true, force: true });
    rmSync(staged, { recursive: true, force: true });
    if (cacheFile) rmSync(cacheFile, { force: true });
  }
});
