import assert from "node:assert/strict";
import test from "node:test";

import { evaluateKdpCreationCapacity, validateKdpListingMetadata } from "../kdp-preflight.mjs";
import { advancePublicationStage, stageForKdpStatus } from "../kdp-publication-stage.mjs";

const listing = {
  id: "K-S1-01",
  title: "新題",
  subtitle: null,
  titleKana: "シンダイ",
  titleRomaji: "Shindai",
  subtitleKana: null,
  subtitleRomaji: null,
  readingSourceTitle: "新題",
  readingSourceSubtitle: null,
  keywords: ["統計"],
  categoryPaths: [{ top: "社会・政治", sub: "社会学", place: "参考図書・白書" }],
  priceYen: 800,
  royaltyPlan: 70,
  editionNumber: 2,
  replacesAsin: "B000000001",
  previousEditions: [{ asin: "B000000001", title: "旧題", author: "stats47", unpublishAfterReplacementLive: true }],
  description: "Previously published as 旧題 by stats47.\n\n新版です。",
};

test("KDP metadata preflight accepts a consistent second edition", () => {
  const result = validateKdpListingMetadata("K-S1-01", listing);
  assert.equal(result.ok, true);
  assert.match(result.warnings.join(" / "), /改題/);
});

test("KDP metadata preflight rejects stale readings and broken predecessor links", () => {
  const result = validateKdpListingMetadata("K-S1-01", {
    ...listing,
    readingSourceTitle: "旧題",
    replacesAsin: "B000000002",
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join(" / "), /読みの対応タイトルが古い/);
  assert.match(result.errors.join(" / "), /previousEditions/);
});

test("creation capacity fails closed before exceeding ten active titles", () => {
  const rows = Array.from({ length: 9 }, (_, index) => ({ draftId: `A${index}`, kdpStatus: "in_review" }));
  const listings = { NEW1: {}, NEW2: {} };
  const result = evaluateKdpCreationCapacity(rows, listings, ["NEW1", "NEW2"]);
  assert.equal(result.ok, false);
  assert.equal(result.projectedActive, 11);
});

test("fresh bookshelf live status supersedes stale in-review ledger state", () => {
  const rows = [
    { draftId: "A1", kdpStatus: "live" },
    { draftId: "A2", kdpStatus: "in_review" },
  ];
  const listings = {
    OLD: { draftId: "A1", status: "listed", kdpStatus: "in_review" },
    ACTIVE: { draftId: "A2", status: "listed", kdpStatus: "in_review" },
    WITHDRAWN: { draftId: "A3", status: "withdrawn", kdpStatus: "draft" },
    NEW: {},
  };
  const result = evaluateKdpCreationCapacity(rows, listings, ["NEW"]);
  assert.equal(result.ok, true);
  assert.equal(result.remoteActive, 1);
  assert.equal(result.projectedActive, 2);
});

test("publication stages advance and never move backward", () => {
  const prepared = advancePublicationStage({}, "prepared", "2026-09-20T00:00:00.000Z");
  const submitted = advancePublicationStage(prepared, "submitted", "2026-09-20T01:00:00.000Z");
  assert.equal(submitted.publicationStage, "submitted");
  const retry = advancePublicationStage(submitted, "verified", "2026-09-20T02:00:00.000Z");
  assert.equal(retry.publicationStage, "submitted");
  assert.equal(retry.publicationStageLastAttempt.attemptedStage, "verified");
  assert.equal(stageForKdpStatus(listing, "live"), "live");
  assert.equal(stageForKdpStatus({ ...listing, previousEditions: [] }, "live"), "live");
  assert.equal(
    stageForKdpStatus({ ...listing, previousEditions: [{ asin: "B000000001", unpublishedAt: "2026-09-21" }] }, "live"),
    "previous_unpublished",
  );
});
