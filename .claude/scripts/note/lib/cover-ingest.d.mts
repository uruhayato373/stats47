import type { CoverRevision } from './cover-assets.mjs';
import type { CoverStore } from './cover-storage.mjs';
export function registerCoverCandidate(proposal: unknown, bytes: Buffer, version: string, store?: CoverStore): Promise<CoverRevision>;
