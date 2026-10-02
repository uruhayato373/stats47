import type { CoverRevision } from './cover-assets.mjs';
export interface CoverStore { get(key: string): Promise<Buffer | null>; put(key: string, bytes: Buffer): Promise<void> }
export function createCoverStore(): CoverStore;
export function fetchCoverSource(url: string): Promise<Buffer>;
export function fetchNoteDetail(noteId: string): Promise<{ key: string; noteUrl: string; user: { urlname: string }; eyecatch: string | null; body: string; name: string; price: number }>;
export function readStoredCover(revision: CoverRevision, store?: CoverStore): Promise<Buffer>;
export function storeCoverBytes(articleKey: string, bytes: Buffer, store?: CoverStore): Promise<Pick<CoverRevision, 'sha256' | 'storage' | 'bytes'>>;
