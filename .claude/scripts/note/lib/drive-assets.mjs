/**
 * note 画像の「候補・元画像」を置く Google Drive の場所 (二層の上側。契約: .claude/rules/note-image-assets.md)。
 *   Drive (非公開・人が見る): stats47/note画像/<slug>/candidates/
 *   R2 (承認した最終版だけ): media/note-backgrounds/<slug>/<sha12>/background.jpg
 * マウント解決は参考資料 vault (source-vault) と同じ実装。マウントが無い PC では例外 (別の場所へ黙って落とさない)。
 */
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const DRIVE_NOTE_FOLDER = "note画像";
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");

export async function noteCandidatesDir(slug, { create = false } = {}) {
  const { resolveVaultRoot } = await import(join(ROOT, ".claude/scripts/source-vault/source-vault.mjs"));
  const { root } = resolveVaultRoot();
  const dir = join(root, DRIVE_NOTE_FOLDER, slug, "candidates");
  if (create) mkdirSync(dir, { recursive: true });
  else if (!existsSync(dir)) throw new Error(`Drive に候補フォルダが無い: ${dir}`);
  return dir;
}

/** `drive:<slug>/<ファイル名>` を Drive 上の絶対パスへ */
export async function resolveDriveInput(spec) {
  const match = /^drive:([a-z0-9-]+)\/([^/\\]+)$/.exec(spec);
  if (!match) throw new Error(`drive: の形式は drive:<slug>/<ファイル名>: ${spec}`);
  return join(await noteCandidatesDir(match[1]), match[2]);
}
