/**
 * buzz-map 集客ゲート: 人が選定した企画の台帳 (curated ideas) の読み込み口。
 *
 * 記録の正本は台帳 `sns.buzz-map-curated-ideas` (data/sns/buzz-map-curated-ideas.json + Schema
 * config/schema/sns.buzz-map-curated-ideas.schema.json)。ここは型を付けて export するだけで、記録を持たない
 * (2026-11-22 まで 8,772 行の TS に直書きしていた。data-storage.md の「台帳は data/ に JSON + Schema」に合わせて移した)。
 * 規約: .claude/rules/buzz-map-standards.md / .claude/rules/sns-content-standards.md
 *
 * build-buzz-map-catalog.ts が machine lane とこの台帳を統合し、重複を解消して state JSON
 * (data/sns/buzz-map-catalog.json) を生成する。state JSON を直接編集しない。企画は台帳の JSON だけを編集する。
 *
 * 各エントリの metricKeys は「実在確認済みの key のみ」を持つ (data/metrics/<key>.ts
 * または machine catalog の metricKey で照合)。実在確認できない場合は [] + feasibility:"needs-data"。
 * ダミーデータ・存在しない metricKey の捏造はしない。
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { datasetPath } from "../../../../config/datasets.mjs";

const PROJECT_ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../../..");

export type LandingStrategy =
  | "existing-ranking"
  | "existing-blog"
  | "existing-theme"
  | "extend-theme"
  | "create-blog"
  | "create-theme"
  | "blocked";

export type LandingReadiness =
  | "ready"
  | "needs-content"
  | "draft"
  | "review-passed"
  | "publish-pending"
  | "live"
  | "blocked";

export interface BuzzMapLandingPlan {
  strategy: LandingStrategy;
  readiness: LandingReadiness;
  primaryUrl: string | null;
  primaryKey: string | null;
  secondaryUrls: string[];
  articleSlug: string | null;
  themeSlug: string | null;
  landingPromise: string;
  ctaLabel: string;
  searchIntent: string | null;
  monetizationVertical: "none" | "housing" | "mobility" | "labor" | "education";
  attributionByChannel: Partial<
    Record<"x" | "instagram", "direct" | "profile" | "unattributed">
  >;
  blockers: string[];
}

export interface CuratedBuzzMapIdea {
  ideaId: string;
  title: string;
  subtitle: string;
  hook: string;
  question: string;
  level: "pref" | "muni" | "mesh";
  recommendedType: "A" | "B" | "C" | "D" | "E" | "F" | "flow";
  category: string;
  sourceKind: "estat" | "ksj" | "mlit-dpf" | "gsi" | "derived" | "external";
  metricKeys: string[];
  /** 同義候補を1件へ統合した際の別名・別候補 */
  aliases?: string[];
  dataRefs: Array<{
    id: string;
    version?: string;
    year?: string;
    license: string;
    sourceUrl?: string;
  }>;
  viralPatterns: string[];
  externalEvidence: Array<{ url: string; note: string; surveyedAt: string }>;
  gscEvidence: Array<{
    query: string;
    impressions?: number;
    clicks?: number;
    week?: string;
  }>;
  competitorOverlap: "none" | "partial" | "exact";
  feasibility: "now" | "needs-pipeline" | "needs-renderer" | "needs-data";
  capability: string;
  commercialUse: "allowed" | "review-required" | "blocked";
  sensitivity: "low" | "medium" | "high";
  priority: "P0" | "P1" | "P2" | "P3";
  score: number;
  scoreBreakdown: Record<string, number>;
  blockers: string[];
  channels: Array<"x" | "instagram">;
  renderPlan: string;
  landingPlan: BuzzMapLandingPlan;
}

// ---------------------------------------------------------------------------
// 台帳の読み込み (型の検査は Schema が check-datasets で行う)
// ---------------------------------------------------------------------------

const ledger = JSON.parse(
  readFileSync(join(PROJECT_ROOT, datasetPath("sns.buzz-map-curated-ideas")), "utf8"),
) as { schemaVersion: 1; ideas: CuratedBuzzMapIdea[] };

export const CURATED_BUZZ_MAP_IDEAS: CuratedBuzzMapIdea[] = ledger.ideas;
