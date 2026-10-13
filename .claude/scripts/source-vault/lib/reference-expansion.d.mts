export type ExpansionChannel = 'ranking' | 'survey' | 'theme' | 'area' | 'japan' | 'blog' | 'note' | 'x' | 'instagram' | 'youtube';
export type ExpansionState = 'done' | 'derived' | 'planned' | 'declined' | 'pending';
export interface ReferenceAnalysis {
  id: string; sourceKey: string; edition: string; chapter: number; question: string; thesis: string; resolution: string;
  metricKeys: string[]; surveyIds: string[]; geoScopes: string[]; contentRoles: ExpansionChannel[]; nextAction: string;
  resolutionReason?: string;
  primarySources?: { organization: string; publicationOrDataset: string; url: string; dataYears?: string[] }[];
}
export interface ExpansionRecord {
  analysis: string; channel: ExpansionChannel; status: 'done' | 'planned' | 'declined'; target?: string; reason?: string; decidedAt: string; decidedBy: string;
}
export interface ExpansionLedger { schemaVersion: 1; records: ExpansionRecord[] }
export interface ChannelPage { kind: string; published: boolean; rankingKeys: string[]; platform?: string; title?: string }
export interface ExpansionRow { analysis: ReferenceAnalysis; channel: ExpansionChannel; state: ExpansionState; records: ExpansionRecord[] }
export const EXPANSION_ROOT: string;
export const CHANNELS: ExpansionChannel[];
export const DERIVED_CHANNELS: Set<ExpansionChannel>;
export function loadAnalyses(root?: string): ReferenceAnalysis[];
export function loadExpansion(root?: string): ExpansionLedger;
export function loadChannelIndex(root?: string): Map<string, ChannelPage>;
export function checkRecord(record: ExpansionRecord, analysis: ReferenceAnalysis | undefined, index: Map<string, ChannelPage>): string[];
export function validateExpansion(ledger: ExpansionLedger, analyses: ReferenceAnalysis[], index: Map<string, ChannelPage>): string[];
export function expansionStatus(analyses: ReferenceAnalysis[], ledger: ExpansionLedger, index: Map<string, ChannelPage>): ExpansionRow[];
export function suggestTargets(analysis: ReferenceAnalysis, channel: ExpansionChannel, index: Map<string, ChannelPage>, limit?: number): { id: string; overlap: number }[];
