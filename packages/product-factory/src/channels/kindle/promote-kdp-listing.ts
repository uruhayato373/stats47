/**
 * Promote one immutable Kindle revision proposal into the KDP publication ledger.
 *
 * The proposal stays separate until review, Previewer, archive verification and
 * owner approval are complete. New editions retain the live predecessor inside
 * `previousEditions`; the old ASIN is not unpublished until the replacement is live.
 *
 * CLI:
 *   npm run products:kindle:kdp-promote --workspace=@stats47/product-factory -- \
 *     --id K-S1-01 --version v4-... --mode new-edition [--apply]
 */
import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../../..");
const LEDGER_PATH = join(REPO_ROOT, ".claude/config/kdp-listings.json");
const PROPOSALS_ROOT = join(REPO_ROOT, ".local/kindle-listing-revisions");
const BOOK_ID = /^K-S[1-4]-\d{2}$/;
const VERSION = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,63}$/;
const OPERATIONAL_FIELDS = new Set([
  "draftId",
  "asin",
  "publishedAt",
  "lastSubmittedAt",
  "salesStartedAt",
  "kdpStatus",
  "kdpStatusLabel",
  "kdpStatusCheckedAt",
  "publicationStage",
  "publicationStageUpdatedAt",
  "publicationStageEvidence",
  "publicationStageLastAttempt",
]);

type JsonRecord = Record<string, unknown>;

function record(value: unknown, label: string): JsonRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} is not an object`);
  return value as JsonRecord;
}

function string(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function omitOperational(listing: JsonRecord): JsonRecord {
  return Object.fromEntries(Object.entries(listing).filter(([key]) => !OPERATIONAL_FIELDS.has(key)));
}

export function prepareNewEdition(current: JsonRecord, candidate: JsonRecord, now: string): JsonRecord {
  if (current.status !== "listed" || current.kdpStatus !== "live") {
    throw new Error("new-edition requires a live listed predecessor");
  }
  const predecessorAsin = string(current.asin);
  const predecessorDraftId = string(current.draftId);
  if (!predecessorAsin || !predecessorDraftId) throw new Error("live predecessor ASIN/draftId is missing");
  const currentHistory = Array.isArray(current.previousEditions)
    ? current.previousEditions.map((item) => record(item, "previous edition"))
    : [];
  if (currentHistory.some((item) => item.asin === predecessorAsin)) {
    throw new Error(`predecessor ${predecessorAsin} is already recorded`);
  }
  const { previousEditions: _ignoredHistory, ...predecessor } = current;
  const previousTitle = string(current.title);
  const author = string(current.author);
  const disclaimer = `Previously published as ${previousTitle} by ${author}.`;
  const description = string(candidate.description);
  const editionNumber = Number.isInteger(current.editionNumber)
    ? Number(current.editionNumber) + 1
    : 2;

  return {
    ...omitOperational(candidate),
    description: `${disclaimer}\n\n${description}`,
    editionNumber,
    replacesAsin: predecessorAsin,
    previousEditions: [
      ...currentHistory,
      {
        ...predecessor,
        supersededAt: now,
        unpublishAfterReplacementLive: true,
      },
    ],
    status: "draft",
    asin: null,
    publishedAt: null,
    kdpStatus: "draft",
    kdpStatusLabel: "新版下書き準備",
    kdpStatusCheckedAt: now,
    publicationStage: "prepared",
    publicationStageUpdatedAt: now,
    publicationStageEvidence: { prepared: { at: now, mode: "new-edition" } },
  };
}

export function prepareUpdate(current: JsonRecord, candidate: JsonRecord, now = new Date().toISOString()): JsonRecord {
  if (current.status !== "listed" || current.kdpStatus !== "live") {
    throw new Error("update requires a live listed publication");
  }
  if (current.title !== candidate.title || current.subtitle !== candidate.subtitle) {
    throw new Error("published title/subtitle is locked; use new-edition");
  }
  return {
    ...candidate,
    publicationStage: "prepared",
    publicationStageUpdatedAt: now,
    publicationStageEvidence: { prepared: { at: now, mode: "update" } },
  };
}

function arg(name: string): string {
  const index = process.argv.indexOf(`--${name}`);
  const value = index >= 0 ? process.argv[index + 1] : "";
  if (!value || value.startsWith("--")) throw new Error(`--${name} requires a value`);
  return value;
}

function main(): void {
  const id = arg("id");
  const version = arg("version");
  const mode = arg("mode");
  const apply = process.argv.includes("--apply");
  if (!BOOK_ID.test(id)) throw new Error(`invalid book id: ${id}`);
  if (!VERSION.test(version)) throw new Error(`invalid version: ${version}`);
  if (mode !== "update" && mode !== "new-edition") throw new Error(`invalid mode: ${mode}`);

  const proposalPath = join(PROPOSALS_ROOT, `${version}.${id}.json`);
  if (!existsSync(proposalPath)) throw new Error(`proposal not found: ${proposalPath}`);
  const ledger = record(JSON.parse(readFileSync(LEDGER_PATH, "utf8")), "ledger");
  const listings = record(ledger.listings, "ledger listings");
  const proposal = record(JSON.parse(readFileSync(proposalPath, "utf8")), "proposal");
  if (proposal.version !== version || proposal.readyToPublish !== false || proposal.publicationRecordsChanged !== false) {
    throw new Error("proposal safety markers or version do not match");
  }
  const candidate = record(record(proposal.listings, "proposal listings")[id], "candidate listing");
  const current = record(listings[id], "current listing");
  const expectedEpub = `.local/kindle-books/${id}/${version}/book.epub`;
  const expectedCover = `.local/kindle-books/${id}/${version}/cover.jpg`;
  if (candidate.epubPath !== expectedEpub || candidate.coverPath !== expectedCover) {
    throw new Error("proposal assets do not match the requested edition");
  }
  const now = new Date().toISOString();
  const next = mode === "new-edition" ? prepareNewEdition(current, candidate, now) : prepareUpdate(current, candidate, now);
  console.log(`[kdp-promote] ${id} mode=${mode} ${string(current.title)} -> ${string(next.title)}`);
  if (!apply) {
    console.log("[kdp-promote] dry-run: publication ledger was not changed");
    return;
  }
  const nextLedger = {
    ...ledger,
    _note: "KDP publication ledger. New editions retain prior live records in listing.previousEditions until replacement-live read-back and explicit unpublish.",
    listings: { ...listings, [id]: next },
  };
  const temporary = `${LEDGER_PATH}.tmp-${process.pid}`;
  writeFileSync(temporary, JSON.stringify(nextLedger, null, 2) + "\n", { flag: "wx" });
  renameSync(temporary, LEDGER_PATH);
  console.log(`[kdp-promote] applied: ${id}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
