import type { CoverPlan } from './cover-production.mjs';
export interface CoverMapReference { kind: 'prefecture-mainland'; code: string; name: string; sourcePath: string; sourceSha256: string; geometrySha256: string; svgSha256: string; extent: string }
export function prefectureCoverReference(articleKey: string, root?: string): { reference: CoverMapReference; svg: string };
export function renderCoverReference(plan: CoverPlan, root?: string): Promise<Buffer | null>;
export function assertCoverReference(plan: CoverPlan, bytes?: Buffer): Promise<void>;
