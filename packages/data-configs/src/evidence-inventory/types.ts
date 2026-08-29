export type EvidenceSourceKey =
  | "japan-zue"
  | "prefecture-databook"
  | "prefecture-deviation"
  | "claude-skills-guide";

export type EvidenceResolution =
  | "reuse-existing-metric"
  | "new-metric"
  | "combined-analysis"
  | "context-only"
  | "primary-source-unavailable"
  | "rights-hold"
  | "not-applicable";

export type EvidenceContentRole =
  | "ranking"
  | "survey"
  | "theme"
  | "area"
  | "japan"
  | "blog"
  | "note"
  | "youtube"
  | "instagram"
  | "x"
  | "agent"
  | "skill"
  | "internal-documentation";

export interface ReferenceSourcePolicy {
  sourceKey: EvidenceSourceKey;
  edition: string;
  statePath: string;
  inputUnit: "quantitative-item" | "page";
  fallbackResolution: EvidenceResolution;
  fallbackReason: string;
  publicOriginalReuse: "forbidden";
}

export interface InternalEvidenceAdoption {
  id: string;
  sourceKey: "claude-skills-guide";
  edition: "2026";
  pages: number[];
  concept: string;
  verifiedAgainst: string;
  mappedFiles: string[];
}
