import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

/** KDP送信対象の全ファイルが、R2へ検証済みの最新revisionと一致することを確認する。 */
export function assertKindleAssetsArchived(root, id) {
  const statePath = join(root, ".claude/state/products/kindle-archives.json");
  if (!existsSync(statePath)) return { ok: false, reason: "Kindle archive台帳がありません" };
  let state;
  try {
    state = JSON.parse(readFileSync(statePath, "utf8"));
  } catch (error) {
    return { ok: false, reason: `Kindle archive台帳を読めません: ${error.message}` };
  }
  const book = state.books?.[id];
  const revision = book?.revisions?.find((item) => item.revision === book.latestRevision);
  if (!revision) return { ok: false, reason: `${id} のR2 archive revisionがありません` };
  for (const file of revision.files || []) {
    const localPath = join(root, ".local/kindle-books", id, book.version || "v1", file.name);
    if (!existsSync(localPath)) return { ok: false, reason: `archive済みファイルがローカルにありません: ${file.name}` };
    const bytes = readFileSync(localPath);
    if (bytes.length !== file.plainSize || sha256(bytes) !== file.plainSha256) {
      return { ok: false, reason: `${file.name} が最新R2 archive revisionと一致しません` };
    }
  }
  if (!revision.files?.length) return { ok: false, reason: `${id} のarchive file台帳が空です` };
  return { ok: true, revision: revision.revision, verifiedAt: revision.verifiedAt };
}
