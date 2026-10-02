export interface CoverRevision {
  id: string; kind: 'candidate' | 'published-original' | 'r2-archive'; version: string; createdAt: string;
  storage: { provider: 'r2-private'; bucket: 'stats47-private'; key: string };
  sha256: string; bytes: number; width: number; height: number;
  quality?: { textBounds: 'pass'; textOverlap: 'pass'; evidenceSha256: string };
  review: { status: 'pending' | 'pass' | 'needs-revision' | 'not-required'; reason: string | null; reviewedAt: string | null };
  provenance: { renderer: string | null; sourceUrl: string | null; sourceSha256: string | null };
}
export interface CoverArticle {
  articleKey: string; noteUrl: string | null; revisions: CoverRevision[];
  candidateRevisionId: string | null; approvedRevisionId: string | null; missingVersions: string[];
  published: { status: 'configured' | 'missing' | 'unknown'; url: string | null; observedAt: string; revisionId: string | null } | null;
}
export interface CoverLedger { schemaVersion: 1; account: 'stats47'; updatedAt: string; articles: CoverArticle[] }
export const COVER_ROOT: string;
export function assertCoverGenerationType(type: string): void;
export const COVER_LEDGER_PATH: string;
export function coverSha(bytes: Uint8Array | string): string;
export function coverAssetKey(key: string, sha: string): string;
export function coverUrlPath(url: string | null | undefined): string | null;
export function validateCoverLedger(ledger: unknown, catalog?: { key: string; noteUrl?: string }[]): CoverLedger;
export function readCoverLedger(root?: string): CoverLedger;
export function emptyCoverArticle(article: { key: string; noteUrl?: string }): CoverArticle;
export function updateCoverLedger(edit: (ledger: CoverLedger) => void | Promise<void>, root?: string): Promise<CoverLedger>;
export function recordCoverObservation(ledger: CoverLedger, observation: { key: string; noteUrl: string; status: 'configured' | 'missing' | 'unknown'; url: string | null; observedAt: string }): void;
export function addCoverRevision(row: CoverArticle, revision: CoverRevision, options?: { candidate?: boolean }): void;
export function reviewCoverRevision(row: CoverArticle, id: string, status: 'pass' | 'needs-revision', reason: string, now?: string): void;
export function approvedCoverRevision(row: CoverArticle): CoverRevision | null;
export function coverDisplayState(row: CoverArticle, now?: number): { candidate?: CoverRevision; approved?: CoverRevision; review: CoverRevision['review']['status'] | 'unavailable' | 'missing'; publication: 'published' | 'unpublished' | 'unapproved'; stale: boolean };
export function applyCoverAudit(ledger: CoverLedger, report: unknown): void;
