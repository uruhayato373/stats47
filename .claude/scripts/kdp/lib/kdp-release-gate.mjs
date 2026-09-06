import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { assertKindleAssetsArchived } from "./kdp-archive-gate.mjs";

/** Shared by single and batch flows. Approval/identity gates remain the caller's responsibility. */
export function assertKindleReleaseReady(root, id, listing) {
  const archive = assertKindleAssetsArchived(root, id, listing);
  if (!archive.ok) return archive;
  // Reuse the catalog's TS content gate rather than maintain a second review policy in JavaScript.
  const result = spawnSync(process.execPath, [
    "--import", "tsx", join(root, "packages/product-factory/scripts/verify-publishable.mts"),
    "--version", archive.version, "--book", id, "--content-only",
  ], { cwd: root, encoding: "utf8", timeout: 30_000, maxBuffer: 1024 * 1024 });
  if (result.error || result.status !== 0) {
    return { ok: false, reason: `入稿本文の品質・版・独立レビュー検査に未達: ${(result.stdout || result.error?.message || "検査実行失敗").trim().slice(0, 1500)}` };
  }
  return archive;
}
