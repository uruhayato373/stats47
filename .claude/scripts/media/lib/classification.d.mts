import type { ImageView, ImageRecord } from './workspace.mjs';
export const CLASSIFIER_VERSION: number;
export type ImageRole =
  | 'chart'
  | 'table'
  | 'diagram'
  | 'title'
  | 'source'
  | 'navigation'
  | 'summary'
  | 'caution'
  | 'photo'
  | 'illustration'
  | 'outline'
  | 'logo'
  | 'unresolved';
export interface Classification {
  templateId: string;
  role: ImageRole;
  status: 'recorded' | 'confirmed' | 'suggested' | 'pending' | 'stale';
  basis: string;
  reason: string;
  updatedAt?: string;
  purpose: string;
  selection: string;
}
export interface ClassificationDecision {
  purpose?: string;
  selection?: string;
  role: ImageRole;
  basis: string;
  reason: string;
  updatedAt: string;
}
export const IMAGE_ROLES: Record<ImageRole, string>;
export const CLASSIFICATION_STATES: Record<Classification['status'], string>;
export const IMAGE_QUEUES: Record<string, string>;
export function roleForTemplate(id: string): ImageRole;
export function classificationNeedsReview(value?: Classification): boolean;
export function slideTemplate(source?: string): string | null;
export function filenameTemplate(file: string): string;
export function resolveClassification(input: {
  kind?: string;
  templateId?: string;
  file: string;
  source?: string;
  record?: ImageRecord;
  basis: string;
  origin?: string;
}): Classification;
export function imageTasks(image: ImageView): string[];
export function classificationSummary(images: ImageView[]): {
  version: number;
  total: number;
  states: Record<string, number>;
  tasks: Record<string, number>;
};
export function auditClassification(
  images: ImageView[],
  templates: import('./workspace.mjs').Template[]
): ReturnType<typeof classificationSummary>;
