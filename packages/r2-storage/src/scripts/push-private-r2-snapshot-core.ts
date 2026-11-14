/** Exact bytes, authoritative guard, manifest last. No listing or public-bucket fallback. */
import { createHash } from "node:crypto";
import type { PrivateR2Store } from "../lib/clients/private-r2-store.mjs";
import { assertR2WriteAllowed } from "./_assert-ci-write";
import { assertNoAuthoritativeOverwrite, type DiffPushPlan } from "./diff-push-r2-core";
import { classifyR2Key, R2_PRIVATE_BUCKET } from "./r2-key-classes";

export interface PrivateSnapshotObject { key: string; bytes: Buffer }
type Store = Pick<PrivateR2Store, "bucket" | "transport" | "get" | "put" | "head">;
const sha = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");

export async function pushPrivateR2Snapshot(options: {
  objects: readonly PrivateSnapshotObject[];
  manifestKey: string;
  store: Store;
  dryRun?: boolean;
  allowAuthoritativeOverwrite?: boolean;
}) {
  const { objects, manifestKey, store, dryRun = false, allowAuthoritativeOverwrite = false } = options;
  if (store.bucket !== R2_PRIVATE_BUCKET) throw new Error("Snapshot requires the private R2 bucket");
  if (store.transport !== "s3" && store.transport !== "wrangler-oauth") throw new Error("Unknown R2 transport");
  if (!objects.length || new Set(objects.map((o) => o.key)).size !== objects.length ||
      !objects.some((o) => o.key === manifestKey)) throw new Error("Missing manifest or duplicate snapshot keys");
  const ordered = [...objects.filter((o) => o.key !== manifestKey), objects.find((o) => o.key === manifestKey)!];
  const plan: DiffPushPlan<PrivateSnapshotObject & { size: number }> = { entries: [], removed: [] };
  // Complete the preflight for every key before the first PUT (including a changed manifest).
  for (const file of ordered) {
    const classification = classifyR2Key(store.bucket, file.key);
    if (!classification.registered || classification.origin !== "mac" || classification.class !== "authoritative") {
      throw new Error(`Expected registered authoritative Mac prefix: ${file.key}`);
    }
    const remote = await store.get(file.key); // errors are not interpreted as missing
    plan.entries.push({ file: { ...file, size: file.bytes.length }, registered: true, class: classification.class,
      change: remote === null ? "NEW" : sha(remote) === sha(file.bytes) ? "UNCHANGED" : "CHANGED" });
  }
  const counts = { NEW: 0, UNCHANGED: 0, CHANGED: 0 };
  for (const entry of plan.entries) counts[entry.change as keyof typeof counts]++;
  const report = { ...counts, transport: store.transport,
    verification: store.transport === "s3" ? "HEAD:size" : "GET:size+sha256" };
  if (dryRun) return report;
  assertNoAuthoritativeOverwrite(plan, allowAuthoritativeOverwrite, "enforce");
  assertR2WriteAllowed({ op: "estat-table-snapshot --push", bucket: store.bucket, targets: ordered.map((o) => o.key) });
  // S3 must support HEAD before the first PUT. OAuth GET was already checked in preflight.
  if (store.transport === "s3") await store.head(manifestKey);
  for (const { file, change } of plan.entries) {
    if (change !== "UNCHANGED") {
      // A key created after the preflight must not be overwritten, even by a NEW upload.
      await store.put(file.key, file.bytes, { ifNoneMatch: change === "NEW" });
    }
    if (store.transport === "s3") {
      const head = await store.head(file.key);
      if (!head || head.size !== file.size) throw new Error(`R2 HEAD size mismatch: ${file.key}`);
    } else {
      // OAuth's object endpoint returns 405 for HEAD. Re-read exact stored bytes, including gzip.
      const remote = await store.get(file.key);
      if (remote === null || remote.length !== file.size) throw new Error(`R2 GET size mismatch: ${file.key}`);
      if (sha(remote) !== sha(file.bytes)) throw new Error(`R2 GET sha256 mismatch: ${file.key}`);
    }
  }
  return report;
}
