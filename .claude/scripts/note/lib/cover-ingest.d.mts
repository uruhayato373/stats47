import type { CoverRevision } from '../../../../packages/ops/src/note/cover-assets.mjs';
import type { CoverStore } from '../../../../packages/ops/src/note/cover-storage.mjs';
export function registerCoverCandidate(proposal: unknown, bytes: Buffer, version: string, store?: CoverStore, backgroundBytes?: Buffer, referenceBytes?: Buffer): Promise<CoverRevision>;
