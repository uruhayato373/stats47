import 'server-only';

import fs from 'node:fs';
import path from 'node:path';

import { NOTE_COVER_REFRESH_VERSION } from '../../../../.claude/scripts/note/catalog/cover-designs';
import { NOTE_COVER_CATEGORIES, noteCoverCategory, type NoteCoverCategory } from '../../../../.claude/scripts/note/catalog/cover-categories';
import { publishedArticles } from '../../../../.claude/scripts/note/catalog';
import { projectRoot } from './project-root';

export { NOTE_COVER_CATEGORIES };
export type { NoteCoverCategory };

export type NoteCoverReview = 'pass' | 'needs-revision' | 'pending' | 'missing';

export interface NoteCoverRow {
  key: string;
  title: string;
  noteUrl: string;
  category: NoteCoverCategory;
  review: NoteCoverReview;
  reviewReason: string | null;
  currentImageUrl: string | null;
  candidateImageUrl: string | null;
}

type ManifestArticle = {
  key: string;
  noteUrl: string;
  file: string;
  beforeCover?: { url?: string | null };
  quality?: { visualReview?: string; reviewReason?: string };
};

type Manifest = {
  account: string;
  version: string;
  generatedAt: string;
  articles: ManifestArticle[];
};

export function noteCoverDirectory(): string {
  const date = NOTE_COVER_REFRESH_VERSION.replace(/-v\d+$/, '');
  return path.join(projectRoot(), '.local/note-cover-refresh', date);
}

function loadManifest(): Manifest | null {
  const file = path.join(noteCoverDirectory(), 'production-manifest.json');
  if (!fs.existsSync(file)) return null;
  const value: unknown = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!value || typeof value !== 'object') throw new Error('note cover manifest is invalid');
  const manifest = value as Manifest;
  if (manifest.account !== 'stats47' || manifest.version !== NOTE_COVER_REFRESH_VERSION || !Array.isArray(manifest.articles))
    throw new Error('note cover manifest identity mismatch');
  return manifest;
}

export function noteCoverManagement() {
  const manifest = loadManifest();
  const proposals = new Map(manifest?.articles.map((a) => [a.key, a]) ?? []);
  const rows: NoteCoverRow[] = publishedArticles().map((article) => {
    const proposal = proposals.get(article.key);
    const expectedFile = path.join(noteCoverDirectory(), 'after', `${article.key}.png`);
    const hasCandidate = Boolean(proposal && proposal.noteUrl === article.noteUrl &&
      typeof proposal.file === 'string' && path.resolve(proposal.file) === expectedFile && fs.existsSync(expectedFile));
    const value = hasCandidate ? proposal?.quality?.visualReview : null;
    const review: NoteCoverReview = !hasCandidate ? 'missing'
      : value === 'pass' ? 'pass'
      : value === 'needs-revision' ? 'needs-revision' : 'pending';
    return {
      key: article.key,
      title: article.title,
      noteUrl: article.noteUrl ?? '',
      category: noteCoverCategory(article),
      review,
      reviewReason: proposal?.quality?.reviewReason ?? null,
      currentImageUrl: proposal?.beforeCover?.url ?? null,
      candidateImageUrl: hasCandidate ? `/note-cover/${encodeURIComponent(article.key)}` : null,
    };
  });
  const counts = Object.fromEntries(NOTE_COVER_CATEGORIES.map(({ key }) => [key, rows.filter((row) => row.category === key).length])) as Record<NoteCoverCategory, number>;
  const reviewCounts = {
    pass: rows.filter((row) => row.review === 'pass').length,
    'needs-revision': rows.filter((row) => row.review === 'needs-revision').length,
    pending: rows.filter((row) => row.review === 'pending').length,
    missing: rows.filter((row) => row.review === 'missing').length,
  };
  return { rows, counts, reviewCounts, version: manifest?.version ?? null, generatedAt: manifest?.generatedAt ?? null };
}
