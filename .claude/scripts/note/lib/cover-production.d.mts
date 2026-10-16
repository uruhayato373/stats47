import type { CoverArticle, CoverBrief, CoverLedger, CoverProductionReference } from './cover-assets.mjs';
import type { CoverMapReference } from './cover-geography.mjs';
export interface CoverVisualRules { layout: 'prefecture-map' | 'topic-object' | 'topic-comparison' | 'work-tools' | 'color-materials'; characters: 'forbidden'; supplementMinPxAt320: number; checks: string[] }
export interface CoverPolicy { id: string; version: number; generation?: 'imagegen-complete'; category: string; label: string; readerValue: string; direction: string; accent: string; prompt: string; copyRules: string[]; reviewChecklist: string[]; visualRules?: CoverVisualRules }
export interface CoverPolicies { schemaVersion: 1; account: 'stats47'; commonPrompt: string; completePrompt?: string; completePromptV2?: string; policies: CoverPolicy[] }
export interface CoverPlan { schemaVersion: number; renderer: 'note-pop-cover-v1' | 'note-imagegen-cover-v1'; account: string; productionId: string; articleKey: string; articleTitle: string; noteUrl: string | null; policyId: string; policyVersion: number; policySnapshot: CoverPolicy; backgroundPrompt?: string; imagePrompt?: string; mapReference?: CoverMapReference; dataScope?: CoverBrief['dataScope']; composition: { width: number; height: number; headline: string; subline: string; accent: string; publisher: string }; evidence: string; instructions: string; planSha256: string }
export type ProductionStage = 'unplanned' | 'brief' | 'ready' | 'stale' | 'review' | 'changes' | 'approved' | 'published';
export interface ProductionArticle { key: string; title: string; noteUrl?: string; category: string }
export interface CoverProductionView { id: string | null; policy: CoverPolicy; brief: CoverBrief | null; plan: CoverPlan | null; blockers: string[]; stage: ProductionStage; revision: string; candidateMatches: boolean; candidateRevisionId: string | null }
export function validateCoverPolicies(data: unknown, categories?: readonly { key: string }[]): CoverPolicies;
export function readCoverPolicies(root?: string): CoverPolicies;
export function latestCoverPolicy(policies: CoverPolicies, category: string): CoverPolicy;
export function seedCoverProduction(ledger: CoverLedger, articles: ProductionArticle[], policies: CoverPolicies): void;
export function buildCoverPlan(row: CoverArticle, article: ProductionArticle, policies: CoverPolicies): CoverPlan | null;
export function coverBriefIssues(row: CoverArticle, article: ProductionArticle, policies: CoverPolicies): string[];
export function coverProductionToken(row: CoverArticle, article: ProductionArticle, policies: CoverPolicies): string;
export function coverProductionView(row: CoverArticle, article: ProductionArticle, policies: CoverPolicies): CoverProductionView;
export function assertCoverPlan(row: CoverArticle, article: ProductionArticle, policies: CoverPolicies, supplied: unknown): CoverProductionReference;
export function assertCurrentCoverCandidate(row: CoverArticle, revisionId: string, context?: { article: ProductionArticle; policies: CoverPolicies }): void;
