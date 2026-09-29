/**
 * Kindle 表紙背景の「候補・元画像」を置く Google Drive の場所 (二層の上側)。
 *
 *   Drive (非公開・人が見る・耐久): stats47/Kindle表紙/<bookId>/candidates/   ← imagegen の出力・採用前の候補・元画像
 *   R2   (公開・CI が SHA 検証して読む): media/kindle-cover-assets/<bookId>/<revision>/  ← 承認した最終版だけ
 *
 * 承認前の版を公開 R2 に出さないための分離。契約: .claude/rules/coconala-product-standards.md「カバー画像の SSOT」。
 * Drive のマウント解決は参考資料 vault (source-vault) と同じ実装を使う。
 */
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "../../..");
export const DRIVE_COVER_FOLDER = "Kindle表紙";

/** stats47 folder 直下の `Kindle表紙/<bookId>/candidates`。Drive のマウントが無い PC では例外 (黙って別の場所へ落とさない) */
export async function coverCandidatesDir(bookId: string, options: { create?: boolean } = {}): Promise<string> {
  const vault = await import(pathToFileURL(resolve(REPO_ROOT, ".claude/scripts/source-vault/source-vault.mjs")).href);
  const { root } = vault.resolveVaultRoot();
  const dir = resolve(root, DRIVE_COVER_FOLDER, bookId, "candidates");
  if (options.create) mkdirSync(dir, { recursive: true });
  else if (!existsSync(dir)) throw new Error(`Drive に候補フォルダが無い: ${dir}`);
  return dir;
}

/** `drive:<bookId>/<ファイル名>` を Drive 上の絶対パスへ解決する */
export async function resolveDriveInput(spec: string): Promise<string> {
  const match = /^drive:([A-Z0-9-]+)\/([^/\\]+)$/.exec(spec);
  if (!match) throw new Error(`drive: の形式は drive:<bookId>/<ファイル名>: ${spec}`);
  return resolve(await coverCandidatesDir(match[1]), match[2]);
}
