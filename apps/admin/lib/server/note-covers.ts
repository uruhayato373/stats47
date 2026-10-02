import 'server-only';
import { readCoverLedger, validateCoverLedger, coverDisplayState, type CoverRevision } from '../../../../.claude/scripts/note/lib/cover-assets.mjs';
import { NOTE_COVER_CATEGORIES, noteCoverCategory, type NoteCoverCategory } from '../../../../.claude/scripts/note/catalog/cover-categories';
import { NOTE_ARTICLES, publishedArticles } from '../../../../.claude/scripts/note/catalog';
import { projectRoot } from './project-root';

export { NOTE_COVER_CATEGORIES };
export type { NoteCoverCategory };
export type NoteCoverReview = 'pass' | 'needs-revision' | 'pending' | 'missing' | 'unavailable';
export interface NoteCoverRow {
  key: string; title: string; noteUrl: string; category: NoteCoverCategory;
  review: NoteCoverReview; reviewReason: string | null;
  currentImageUrl: string | null; coverObservedAt: string | null; candidateImageUrl: string | null;
  candidateVersion: string | null; publication: 'published' | 'unpublished' | 'unapproved';
  stale: boolean; missingVersions: string[];
  archivedVersions: { id: string; version: string; imageUrl: string }[];
}
export function privateCoverUrl(key: string, revision: CoverRevision) {
  return `/note-cover/${encodeURIComponent(key)}?revision=${revision.id}`;
}
export function noteCoverManagement() {
  const ledger = validateCoverLedger(readCoverLedger(projectRoot()), NOTE_ARTICLES);
  const byKey = new Map(ledger.articles.map((row) => [row.articleKey, row]));
  const rows: NoteCoverRow[] = publishedArticles().map((article) => {
    const record = byKey.get(article.key);
    if (!record) throw new Error('note cover catalog coverage mismatch');
    const state = coverDisplayState(record);
    const archived = record.revisions.find((r) => r.id === record.published?.revisionId);
    return {
      key: article.key, title: article.title, noteUrl: article.noteUrl ?? '', category: noteCoverCategory(article),
      review: state.review === 'not-required' ? 'pending' : state.review,
      reviewReason: state.candidate?.review.reason ?? null,
      currentImageUrl: archived ? privateCoverUrl(article.key, archived) : record.published?.url ?? null,
      coverObservedAt: record.published?.observedAt ?? null,
      candidateImageUrl: state.candidate ? privateCoverUrl(article.key, state.candidate) : null,
      candidateVersion: state.candidate?.version ?? null, publication: state.publication, stale: state.stale,
      missingVersions: record.missingVersions,
      archivedVersions: record.revisions.filter((r) => r.id !== record.candidateRevisionId && r.id !== record.published?.revisionId)
        .map((r) => ({ id: r.id, version: r.version, imageUrl: privateCoverUrl(article.key, r) })),
    };
  });
  const counts = Object.fromEntries(NOTE_COVER_CATEGORIES.map(({ key }) => [key, rows.filter((row) => row.category === key).length])) as Record<NoteCoverCategory, number>;
  const reviews: NoteCoverReview[] = ['pass', 'needs-revision', 'pending', 'missing', 'unavailable'];
  const reviewCounts = Object.fromEntries(reviews.map((review) => [review, rows.filter((row) => row.review === review).length])) as Record<NoteCoverReview, number>;
  return { rows, counts, reviewCounts, updatedAt: ledger.updatedAt };
}
