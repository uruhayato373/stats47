import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { parseRange, resolveSafe } from "@/lib/server/safe-local-file";

describe("parseRange", () => {
  const SIZE = 1000;

  it("ヘッダ無し (null / undefined) → null (呼び元は 200 全量)", () => {
    expect(parseRange(null, SIZE)).toBeNull();
    expect(parseRange(undefined, SIZE)).toBeNull();
  });

  it("非 bytes ヘッダ → null", () => {
    expect(parseRange("items=0-99", SIZE)).toBeNull();
  });

  it("通常 bytes=0-99 → { start:0, end:99 }", () => {
    expect(parseRange("bytes=0-99", SIZE)).toEqual({ start: 0, end: 99 });
  });

  it("開始省略 bytes=-100 → start は 0 (旧実装の正規表現挙動: サフィックスを扱わない)", () => {
    // 実装は /bytes=(\d*)-(\d*)/ で m[1]="" → start=0、m[2]="100" → end=100。
    expect(parseRange("bytes=-100", SIZE)).toEqual({ start: 0, end: 100 });
  });

  it("終了省略 bytes=100- → end は size-1 にクランプ", () => {
    expect(parseRange("bytes=100-", SIZE)).toEqual({ start: 100, end: 999 });
  });

  it("end が size 超過 → size-1 にクランプ", () => {
    expect(parseRange("bytes=0-5000", SIZE)).toEqual({ start: 0, end: 999 });
  });

  it("start >= size → 'unsatisfiable' (呼び元は 416)", () => {
    expect(parseRange("bytes=1000-1099", SIZE)).toBe("unsatisfiable");
    expect(parseRange("bytes=2000-", SIZE)).toBe("unsatisfiable");
  });
});

describe("resolveSafe", () => {
  let base: string;

  beforeEach(() => {
    base = fs.mkdtempSync(path.join(os.tmpdir(), "safe-base-"));
    fs.mkdirSync(path.join(base, "sub"), { recursive: true });
    fs.writeFileSync(path.join(base, "sub", "file.txt"), "hello");
  });

  afterEach(() => {
    fs.rmSync(base, { recursive: true, force: true });
  });

  it("正常なパスを解決する", () => {
    const r = resolveSafe(base, ["sub", "file.txt"]);
    expect("file" in r).toBe(true);
    if ("file" in r) expect(fs.readFileSync(r.file, "utf-8")).toBe("hello");
  });

  it("`..` traversal を forbidden で拒否", () => {
    const r = resolveSafe(base, ["..", "etc", "passwd"]);
    expect("error" in r && r.error.kind).toBe("forbidden");
  });

  it("URL エンコード `%2e%2e` (..) を forbidden で拒否", () => {
    // resolveSafe が内部で decodeURIComponent するため ".." に戻り拒否される。
    const r = resolveSafe(base, ["%2e%2e", "%2e%2e", "secret"]);
    expect("error" in r && r.error.kind).toBe("forbidden");
  });

  it("不正な URL エンコード (%) を forbidden で拒否", () => {
    const r = resolveSafe(base, ["%"]);
    expect("error" in r && r.error.kind).toBe("forbidden");
  });

  it("絶対パス (先頭スラッシュ) を forbidden で拒否", () => {
    // decodeURIComponent("/etc/passwd") はそのまま。path.resolve(base, "/etc/passwd") は
    // "/etc/passwd" になり base 外 → isInside=false で forbidden。
    const r = resolveSafe(base, ["/etc/passwd"]);
    expect("error" in r && r.error.kind).toBe("forbidden");
  });

  it("NUL バイトを含むセグメントを forbidden で拒否", () => {
    const r = resolveSafe(base, ["file\0.txt"]);
    expect("error" in r && r.error.kind).toBe("forbidden");
  });

  it("symlink による base 脱出を forbidden で拒否", () => {
    // base の外にターゲットを作り、base 内から symlink を張る。
    const outside = fs.mkdtempSync(path.join(os.tmpdir(), "safe-outside-"));
    fs.writeFileSync(path.join(outside, "secret.txt"), "leaked");
    const linkPath = path.join(base, "escape");
    fs.symlinkSync(path.join(outside, "secret.txt"), linkPath);
    try {
      const r = resolveSafe(base, ["escape"]);
      // realpath が base 外を指すため forbidden。
      expect("error" in r && r.error.kind).toBe("forbidden");
    } finally {
      fs.rmSync(outside, { recursive: true, force: true });
    }
  });

  it("ディレクトリを not-found で拒否 (ファイルのみ配信)", () => {
    const r = resolveSafe(base, ["sub"]);
    expect("error" in r && r.error.kind).toBe("not-found");
  });

  it("不在ファイルを not-found で拒否", () => {
    const r = resolveSafe(base, ["sub", "nope.txt"]);
    expect("error" in r && r.error.kind).toBe("not-found");
  });

  it("空セグメント配列 (base 自身) を not-found で拒否", () => {
    // path.resolve(base) === base → isInside は rel==="" で false → forbidden。
    const r = resolveSafe(base, []);
    expect("error" in r).toBe(true);
  });
});
