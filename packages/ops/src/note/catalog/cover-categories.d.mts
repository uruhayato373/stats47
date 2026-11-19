import type { NoteArticle } from './types';
export type NoteCoverCategory = 'intro' | 'household' | 'ranking-question' | 'ranking-story' | 'explainer' | 'dataset-geo' | 'practitioner' | 'palette';
export const NOTE_COVER_CATEGORIES: readonly { key: NoteCoverCategory; label: string }[];
export function noteCoverCategory(article: Pick<NoteArticle, 'key' | 'title' | 'vertical'>): NoteCoverCategory;
