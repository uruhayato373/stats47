import { calculateBodySize } from "../utils/calculate-body-size";

/**
 * R2 へ送る前の staging (リポジトリ直下の `.local/r2/`) にオブジェクトを書く。
 *
 * これは R2 への書き込みではない。本番に届けるには、書いたキーを push 段
 * (`push-exact-r2-assets.ts` / `diff-push-r2.ts`) で送る必要がある。旧名 `saveToR2` は名前が
 * R2 へ保存するように読め、push 段を持たない workflow や、R2 キャッシュのつもりの呼び出し
 * (e-Stat メタ情報キャッシュ) が手元のファイルに書くだけで終わっていた (2026-10-10 改名)。
 *
 * staging のルートは次の順で決める。push 段はリポジトリ直下の `.local/r2` を読むので、既定はそこに揃える。
 *   1. options.root
 *   2. 環境変数 R2_STAGING_DIR
 *   3. cwd から上へ辿って見つけたリポジトリ (package.json の name が stats47-monorepo) の `.local/r2`
 * どれも決まらなければ例外にする (cwd に `.local/r2` を作って push 段から見えない場所へ書かない)。
 */

const REPO_PACKAGE_NAME = "stats47-monorepo";
const STAGING_DIR = ".local/r2";
const MAX_PARENT_LEVELS = 8;

export interface WriteR2StagingResult {
  key: string;
  size: number;
  path: string;
}

function resolveStagingRoot(explicitRoot: string | undefined): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require("fs") as typeof import("fs");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require("path") as typeof import("path");

  const configured = explicitRoot ?? process.env.R2_STAGING_DIR;
  if (configured) return path.resolve(configured);

  let dir = process.cwd();
  for (let i = 0; i < MAX_PARENT_LEVELS; i++) {
    const pkgPath = path.join(dir, "package.json");
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8")) as { name?: string };
      if (pkg.name === REPO_PACKAGE_NAME) return path.join(dir, STAGING_DIR);
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error(
    `R2 staging のルートが決まりません (cwd=${process.cwd()})。リポジトリ内で実行するか R2_STAGING_DIR を指定してください`,
  );
}

function assertStagingKey(key: string): void {
  const segments = key.split("/");
  if (!key || key.startsWith("/") || key.includes("\\") || segments.some((s) => s === "" || s === "." || s === "..")) {
    throw new Error(`不正な R2 キー: ${JSON.stringify(key)}`);
  }
}

export async function writeR2Staging(
  key: string,
  body: string | ArrayBuffer | Buffer | Uint8Array,
  options?: { root?: string },
): Promise<WriteR2StagingResult> {
  assertStagingKey(key);
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require("fs") as typeof import("fs");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require("path") as typeof import("path");

  const filePath = path.join(resolveStagingRoot(options?.root), key);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const data =
    typeof body === "string" || Buffer.isBuffer(body)
      ? body
      : Buffer.from(body instanceof ArrayBuffer ? new Uint8Array(body) : body);
  fs.writeFileSync(filePath, data);
  return { key, size: calculateBodySize(body), path: filePath };
}
