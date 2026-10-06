/**
 * 販売台帳の置き場は src/ledger-paths.mjs だけが持つ。
 *
 * なぜ必要か: 置き場を移したとき直書きが旧パスに残ると、読めずに黙って空を返す
 * (例: sales-catalog の read() は欠落を warning に落として処理を続ける)。
 * 定数が実在を指し、コードが定数を経由していれば、移動漏れはこのテストで止まる。
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import * as LEDGER from "../src/ledger-paths.mjs";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const MODULE = "packages/product-factory/src/ledger-paths.mjs";
const NAMES = "coconala-listings|coconala-account|kdp-listings|kdp-account|note-account|coconala/assets|coconala-profile";
// ディレクトリ付きで台帳を指す文字列。置き場は問わない (旧置き場の残存も拾う)。
const PATH_LITERAL = /\/(?:(?:coconala-listings|coconala-account|kdp-listings|kdp-account|note-account)\.json|coconala\/assets\b|coconala-profile\.ts)/;
const CODE_GLOBS = ["*.ts", "*.tsx", "*.mts", "*.cts", "*.js", "*.jsx", "*.mjs", "*.cjs", "*.sh", "*.py"];
const COMMENT_LINE = /^\s*(?:\/\/|\/?\*|#)/;

describe("ledger-paths", () => {
  it("すべての定数が実在するファイル・ディレクトリを指す", () => {
    for (const [name, rel] of Object.entries(LEDGER)) {
      expect(existsSync(join(root, rel)), `${name} = ${rel}`).toBe(true);
    }
  });

  it("コードは台帳のパスを直書きせず ledger-paths.mjs を経由する", () => {
    const files = execFileSync("git", ["-C", root, "grep", "--untracked", "-l", "-E", NAMES, "--", ...CODE_GLOBS], { encoding: "utf8" })
      .split("\n")
      .filter((f) => f && f !== MODULE);
    const offenders = files.flatMap((file) =>
      readFileSync(join(root, file), "utf8")
        .split(/\r?\n/)
        .flatMap((line, i) => (!COMMENT_LINE.test(line) && PATH_LITERAL.test(line) ? [`${file}:${i + 1}: ${line.trim()}`] : [])),
    );
    expect(offenders).toEqual([]);
  }, 60_000);
});
