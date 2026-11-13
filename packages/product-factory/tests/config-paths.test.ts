/**
 * `config/` の置き場は config/paths.mjs だけが持つ。
 *
 * なぜ必要か: 置き場を移したとき直書きが旧パスに残ると、読めずに黙って空を返す
 * (例: sales-catalog の read() は欠落を warning に落として処理を続ける)。
 * 定数が実在を指し、コードが定数を経由していれば、移動漏れはこのテストで止まる。
 * 検査する名前は定数の値から作る (一覧を二重に持たない)。
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import * as CONFIG_PATHS from "../../../config/paths.mjs";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const MODULE = "config/paths.mjs";
const CODE_GLOBS = ["*.ts", "*.tsx", "*.mts", "*.cts", "*.js", "*.jsx", "*.mjs", "*.cjs", "*.sh", "*.ps1", "*.py"];
// 行頭がコメント、または import / export ... from の行は対象外 (import 先の誤りは型検査と実行時に必ず落ちる)
const SKIP_LINE = /^\s*(?:\/\/|\/?\*|#|import\b|export\b.*\bfrom\b)/;

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// "config/kdp-account.json" → "kdp-account.json"。ディレクトリ付きで現れたら直書きとみなす (置き場は問わない)
// data/ paths are governed by check-datasets, which permits static imports and
// test fixtures. This contract owns literal paths into config/ only.
const tails = Object.values(CONFIG_PATHS).filter((p) => /^(?:\.claude\/)?config\//.test(String(p))).map((p) => String(p).replace(/^(?:\.claude\/)?config\//, ""));
const NAMES = tails.map(escape).join("|");
const PATH_LITERAL = new RegExp(`/(?:${NAMES})(?![\\w-])`);
// path.join(ROOT, ".claude", "config", "x.json") のように部品へ分けた形も拾う
const QUOTED_NAME = new RegExp(`["'\`](?:${NAMES})["'\`]`);

describe("config-paths", () => {
  it("すべての定数が実在するファイル・ディレクトリを指す", () => {
    for (const [name, rel] of Object.entries(CONFIG_PATHS)) {
      expect(existsSync(join(root, rel)), `${name} = ${rel}`).toBe(true);
    }
  });

  it("コードは config/ のパスを直書きせず config/paths.mjs を経由する", () => {
    const files = execFileSync("git", ["-C", root, "grep", "--untracked", "-l", "-E", NAMES, "--", ...CODE_GLOBS], { encoding: "utf8" })
      .split("\n")
      .filter((f) => f && f !== MODULE);
    const offenders = files.flatMap((file) =>
      readFileSync(join(root, file), "utf8")
        .split(/\r?\n/)
        .flatMap((line, i) =>
          !SKIP_LINE.test(line) && (PATH_LITERAL.test(line) || QUOTED_NAME.test(line)) ? [`${file}:${i + 1}: ${line.trim()}`] : [],
        ),
    );
    expect(offenders).toEqual([]);
  }, 60_000);
  // 定数は repo root からの相対パス。fs に素のまま渡すと、cwd が root でないとき ENOENT になる
  // (marketplace-status.mjs / build-a8-program-id-map.ts がこの形だった)。root と結合するか datasetPath() 経由で読む。
  // .sh は先頭で cd "$PROJECT_DIR" して root を cwd にするので対象外。
  it("定数を fs 関数へ root と結合せずに渡さない (cwd がルートでないと ENOENT になる)", () => {
    const constants = Object.keys(CONFIG_PATHS).filter((n) => /^[A-Z][A-Z0-9_]*$/.test(n));
    const FS_FUNCTIONS = "(?:readFileSync|writeFileSync|appendFileSync|existsSync|readdirSync|statSync|mkdirSync|readFile|writeFile)";
    const files = execFileSync("git", ["-C", root, "grep", "--untracked", "-l", "-E", escape(MODULE), "--", "*.ts", "*.tsx", "*.mts", "*.cts", "*.js", "*.mjs", "*.cjs"], { encoding: "utf8" })
      .split("\n")
      .filter((f) => f && f !== MODULE);
    const offenders = files.flatMap((file) => {
      const text = readFileSync(join(root, file), "utf8");
      // `const CONFIG = A8_REPORT_AUTOMATION;` のような別名も、素のまま渡されれば同じ事故になる
      const names = new Set(constants.filter((c) => new RegExp(`\\b${c}\\b`).test(text)));
      for (const c of [...names]) {
        for (const m of text.matchAll(new RegExp(`(?:const|let)\\s+(\\w+)\\s*=\\s*${c}\\s*;`, "g"))) names.add(m[1]);
      }
      if (names.size === 0) return [];
      const call = new RegExp(`\\b${FS_FUNCTIONS}\\(\\s*(?:${[...names].join("|")})\\s*[,)]`);
      return text.split(/\r?\n/).flatMap((line, i) => (call.test(line) ? [`${file}:${i + 1}: ${line.trim()}`] : []));
    });
    expect(offenders).toEqual([]);
  }, 60_000);
});
