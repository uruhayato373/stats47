import type { CoverPlan } from './cover-production.mjs';
export interface GeneratedCoverReview { planSha256: string; sourceSha256: string; tool: 'imagegen'; prompt: string; checkedAt: string; original: true; thumbnailWidth: 320; textBounds: 'pass'; textOverlap: 'pass'; reason: string; transcription: string[]; checks?: Record<string, 'pass'>; referenceSha256?: string }
export function expectedCoverText(plan: CoverPlan): string[];
export function expectedCoverChecks(plan: CoverPlan): string[];
export function assertGeneratedCoverReview(plan: CoverPlan, review: unknown, source: Buffer): asserts review is GeneratedCoverReview;
export function prepareGeneratedCover(plan: CoverPlan, source: Buffer, review: unknown, referenceBytes?: Buffer): Promise<{ png: Buffer; evidence: { renderer: CoverPlan['renderer']; production: CoverPlan; sourceImageSha256: string; referenceImageSha256?: string; visualReview: GeneratedCoverReview; validationMethod: 'visual'; normalization: string } }>;
