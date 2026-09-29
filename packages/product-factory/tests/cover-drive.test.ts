import { describe, expect, it } from "vitest";
import { resolveDriveInput } from "../scripts/cover-drive";

describe("Kindle 表紙の Drive 入力", () => {
  it("drive:<bookId>/<ファイル名> 以外の形式を拒否する (別の書籍・パス区切り・絶対パスへの抜けを防ぐ)", async () => {
    for (const bad of ["drive:", "drive:K-S1-01", "drive:k-s1-01/a.png", "drive:K-S1-01/../K-S1-02/a.png", "drive:K-S1-01/sub/a.png", "/abs/a.png"]) {
      await expect(resolveDriveInput(bad)).rejects.toThrow(/drive: の形式/);
    }
  });
});
