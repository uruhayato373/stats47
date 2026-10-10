import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { writeR2Staging } from "../write-staging";

/**
 * writeR2Staging は R2 へ送る前の staging に書く。push 段 (push-exact-r2-assets / diff-push-r2) は
 * リポジトリ直下の `.local/r2` を読むので、書き込み先が実行場所で変わってはいけない。
 * 旧 saveToR2 はカレントディレクトリから上に既存の `.local/r2` を探し、無ければその場に作っていた。
 */
describe("writeR2Staging", () => {
  let tmp: string;
  const originalEnv = process.env.R2_STAGING_DIR;

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "stats47-write-staging-"));
    delete process.env.R2_STAGING_DIR;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (originalEnv === undefined) delete process.env.R2_STAGING_DIR;
    else process.env.R2_STAGING_DIR = originalEnv;
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it("サブディレクトリから実行してもリポジトリ直下の .local/r2 に書く", async () => {
    fs.writeFileSync(path.join(tmp, "package.json"), JSON.stringify({ name: "stats47-monorepo" }));
    const sub = path.join(tmp, "apps", "web");
    fs.mkdirSync(sub, { recursive: true });
    // サブディレクトリ側に別の package.json があっても、リポジトリのものまで辿る
    fs.writeFileSync(path.join(sub, "package.json"), JSON.stringify({ name: "web" }));
    vi.spyOn(process, "cwd").mockReturnValue(sub);

    const result = await writeR2Staging("app/survey/all.json", '{"a":1}');

    const expected = path.join(tmp, ".local", "r2", "app", "survey", "all.json");
    expect(result).toEqual({ key: "app/survey/all.json", size: 7, path: expected });
    expect(fs.readFileSync(expected, "utf8")).toBe('{"a":1}');
    expect(fs.existsSync(path.join(sub, ".local"))).toBe(false);
  });

  it("options.root が環境変数より優先され、Buffer はそのまま書く", async () => {
    process.env.R2_STAGING_DIR = path.join(tmp, "from-env");
    const root = path.join(tmp, "explicit");

    const result = await writeR2Staging("app/x.bin", Buffer.from([1, 2, 3]), { root });

    expect(result.path).toBe(path.join(root, "app", "x.bin"));
    expect([...fs.readFileSync(result.path)]).toEqual([1, 2, 3]);
    expect(fs.existsSync(path.join(tmp, "from-env"))).toBe(false);
  });

  it("リポジトリの外ではカレントディレクトリに作らず例外にする", async () => {
    vi.spyOn(process, "cwd").mockReturnValue(tmp);

    await expect(writeR2Staging("app/x.json", "{}")).rejects.toThrow(/staging のルートが決まりません/);
    expect(fs.existsSync(path.join(tmp, ".local"))).toBe(false);
  });

  it.each(["", "/abs.json", "app/../x.json", "app//x.json", "app\\x.json"])(
    "不正なキー %j を拒否する",
    async (key) => {
      await expect(writeR2Staging(key, "{}", { root: tmp })).rejects.toThrow(/不正な R2 キー/);
    },
  );
});
