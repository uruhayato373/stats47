import assert from "node:assert/strict";
import test from "node:test";

import { coverThumbnailIssues } from "../kdp-cover-thumbnail.mjs";

const sha = "a".repeat(64);
const record = { coverSha256: sha, heightsPx: [120, 220], verdict: "readable", checkedAt: "2026-11-09", checkedBy: "owner" };

test("今の表紙を縮小して読めると記録した本だけ公開できる", () => {
  assert.deepEqual(coverThumbnailIssues("K-A", record, sha), []);
});

test("記録が無い・表紙が差し替わった・読めない・表紙が無い場合は止める", () => {
  assert.ok(coverThumbnailIssues("K-A", undefined, sha)[0].includes("記録が無い"));
  assert.ok(coverThumbnailIssues("K-A", record, "b".repeat(64))[0].includes("今の表紙と違う"));
  assert.ok(coverThumbnailIssues("K-A", { ...record, verdict: "unreadable" }, sha)[0].includes("読めない"));
  assert.ok(coverThumbnailIssues("K-A", record, null)[0].includes("表紙のファイルが無く"));
});
