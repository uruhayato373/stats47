import { createHash } from "node:crypto";
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { join, resolve } from "node:path";

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

/** KDP送信対象の全ファイルが、R2へ検証済みの最新revisionと一致することを確認する。 */
export function assertKindleAssetsArchived(root, id, listing) {
  if (!/^K-S[1-4]-\d{2}$/.test(id)) return { ok: false, reason: "不正なbook id" };
  const statePath = join(root, ".claude/state/products/kindle-archives.json");
  if (!existsSync(statePath)) return { ok: false, reason: "Kindle archive台帳がありません" };
  let state;
  try {
    state = JSON.parse(readFileSync(statePath, "utf8"));
  } catch (error) {
    return { ok: false, reason: `Kindle archive台帳を読めません: ${error.message}` };
  }
  const book = state?.books?.[id];
  const revision = Array.isArray(book?.revisions) ? book.revisions.find((item) => item?.revision === book.latestRevision && (!item.version || item.version === book.version)) : undefined;
  if (!revision) return { ok: false, reason: `${id} のR2 archive revisionがありません` };
  const version = revision.version ?? book.version;
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,63}$/.test(version ?? "")) return { ok: false, reason: "不正なarchive version" };
  if (!revision.verifiedAt || !Number.isFinite(Date.parse(revision.verifiedAt))) return { ok: false, reason: "archiveの検証済み記録がありません" };
  const dir = join(root, ".local/kindle-books", id, version);
  if (typeof listing?.epubPath !== "string" || typeof listing?.coverPath !== "string" || resolve(root, listing.epubPath) !== join(dir, "book.epub") ||
    resolve(root, listing.coverPath) !== join(dir, "cover.jpg")) return { ok: false, reason: "KDP送信版とarchive版が一致しません" };
  const required = ["book.epub", "cover.jpg", "cover.png", "metadata.json", "READINESS.md"];
  const allowed = new Set([...required, "review.md", "review.json"]);
  const files = Array.isArray(revision.files) ? revision.files : [];
  if (files.some(f => !f || typeof f !== "object" || !allowed.has(f.name)) ||
    new Set(files.map(f => f.name)).size !== files.length || required.some(name => !files.some(f => f.name === name))) return { ok: false, reason: "archive必須ファイル集合が不完全または不正です" };
  for (const file of revision.files || []) {
    const localPath = join(dir, file.name);
    if (!existsSync(localPath)) return { ok: false, reason: `archive済みファイルがローカルにありません: ${file.name}` };
    if (realpathSync(localPath) !== join(realpathSync(root), ".local/kindle-books", id, version, file.name)) return { ok: false, reason: "archive資産のsymlinkは送信できません" };
    const bytes = readFileSync(localPath);
    if (bytes.length !== file.plainSize || sha256(bytes) !== file.plainSha256) {
      return { ok: false, reason: `${file.name} が最新R2 archive revisionと一致しません` };
    }
  }
  return { ok: true, version, revision: revision.revision, verifiedAt: revision.verifiedAt,
    fileSha256: Object.fromEntries(files.map(f => [f.name, f.plainSha256])) };
}

/** Pin the verified bytes before any UI awaits; Playwright must not reopen a mutable path later. */
export function captureKindleUpload(root, listing, archive) {
  if (!archive?.ok) throw new Error("verified archive required");
  const capture = (path, name, mimeType) => {
    const buffer = readFileSync(resolve(root, path));
    if (sha256(buffer) !== archive.fileSha256?.[name]) throw new Error(`送信前に資産が変化しました: ${name}`);
    return { name, mimeType, buffer };
  };
  return { epub: capture(listing.epubPath, "book.epub", "application/epub+zip"),
    cover: capture(listing.coverPath, "cover.jpg", "image/jpeg") };
}
