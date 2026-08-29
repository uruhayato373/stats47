/**
 * クライアントと共有する API レスポンス DTO。
 * server-only モジュールを import しない (この型はブラウザ側でも使える)。
 */

export interface MediaCandidateDTO {
  url: string | null;
  source: string;
  note?: string;
}

export interface PostDTO {
  id: number;
  platform: string;
  post_type: string | null;
  domain: string | null;
  content_key: string | null;
  caption: string | null;
  status: string;
  scheduled_at: string | null;
  posted_at: string | null;
  media_path: string | null;
  impressions: number | null;
  likes: number | null;
  reposts: number | null;
  replies: number | null;
  bookmarks: number | null;
  template: string | null;
  media_candidates: MediaCandidateDTO[];
  [key: string]: unknown;
}

export interface PostsResponse {
  count: number;
  posts: PostDTO[];
}

export interface InventoryResponse {
  posts: PostDTO[];
  extras: Array<Record<string, unknown>>;
}

export interface LimitInfoDTO {
  used: number;
  max: number;
  window: string;
  label: string;
  scheduledInJson?: number;
}

export interface LimitsResponse {
  limits: { x: LimitInfoDTO; instagram: LimitInfoDTO };
  galleryState: Record<string, unknown>;
}

export interface IgConsistencyResponse {
  onlyInJson: Array<Record<string, unknown>>;
  onlyInPosts: Array<{ id: number; date: string; content_key: string | null }>;
}

export interface JobSummaryDTO {
  id: number;
  kind: string;
  status: string;
  exitCode: number | null;
  startedAt: string;
  endedAt: string | null;
  tail: string[];
}

export interface AssetTabDTO {
  id: string;
  label: string;
  kind: string;
}

export interface AssetImageDTO {
  variant: string;
  url: string | null;
  local?: boolean;
}

export interface AssetEntryDTO {
  key: string;
  label: string;
  pageUrl: string | null;
  images: AssetImageDTO[];
}

export interface AssetTabResponse {
  tab: string;
  label: string;
  source: string;
  aspect: string;
  r2KeyPattern: string;
  entries: AssetEntryDTO[];
}

export interface AssetsSummaryResponse {
  sns: { total: number; posted: number; scheduled: number; draft: number };
  blogArticles: number;
  noteCovers: number;
  videoMasters: number;
  assetTabs: number;
}

export interface AssetsCheckResponse {
  checked: number;
  result: Record<string, { ok: boolean; status: number; ct: string } | unknown>;
}

// ─── official dashboard research catalog (/research) ───────────────

export type DashboardPublisherTypeDTO =
  | "national-government"
  | "prefecture"
  | "municipality";

export type DashboardVerificationStatusDTO = "verified" | "partial";

export interface ResearchDashboardDTO {
  id: string;
  title: string;
  publisher: string;
  publisherType: DashboardPublisherTypeDTO;
  officialUrl: string;
  status: DashboardVerificationStatusDTO;
  platform: string;
  notes: string;
  storyCount: number;
}

export interface ResearchStoryDTO {
  id: string;
  dashboardId: string;
  dashboardTitle: string;
  dashboardStatus: DashboardVerificationStatusDTO;
  category: string;
  title: string;
  question: string;
  storyPattern: string;
  indicatorFamilies: string[];
  visualizations: string[];
  geographyLevels: string[];
  stats47ThemeKeys: string[];
  sourceUrl: string;
  evidenceLevel: string;
  verifiedAt: string;
}

export interface DashboardCatalogResponse {
  researchedAt: string;
  sourcePath: string;
  summary: {
    dashboards: number;
    localDashboards: number;
    stories: number;
    resasStories: number;
    coveredThemes: number;
    declaredThemes: number;
    partialDashboards: number;
    staleStories: number;
  };
  audit: {
    status: "pass" | "warn" | "fail";
    errors: string[];
    warnings: string[];
  };
  filters: {
    themes: Array<{ key: string; label: string; count: number }>;
    patterns: Array<{ key: string; count: number }>;
  };
  dashboards: ResearchDashboardDTO[];
  stories: ResearchStoryDTO[];
}

export interface SvgChartDTO {
  slug: string;
  file: string;
  cat: string;
  url: string;
  viewBox: string | null;
  hasTheme: boolean;
  hasViewBox: boolean;
}

export interface SvgCatalogResponse {
  catalogs: Array<{ key: string; label: string; desc: string; count: number }>;
  items: SvgChartDTO[];
  articleCount: number;
}

export interface ErrorResponse {
  error: string;
}

export interface JobAcceptedResponse {
  id: number;
}

export interface ProbeR2Response {
  found: Array<{ rel: string; size: number }>;
}

export interface ScheduleIgResponse {
  file: string;
  postId: number;
}

// ─── content operations (/content) ─────────────────────

export type ContentChannelDTO = "x" | "instagram" | "note" | "kindle";
export type ContentStageDTO =
  | "draft"
  | "ready"
  | "scheduled"
  | "published"
  | "blocked";
export type ContentFindingSeverityDTO = "error" | "warning";

export interface ContentFindingDTO {
  severity: ContentFindingSeverityDTO;
  code: string;
  channel: ContentChannelDTO;
  itemId: string | null;
  message: string;
}

export interface ContentChannelSummaryDTO {
  channel: ContentChannelDTO;
  label: string;
  href: string;
  total: number;
  draft: number;
  ready: number;
  scheduled: number;
  published: number;
  blocked: number;
  source: string;
}

export interface KindleContentDTO {
  id: string;
  title: string;
  subtitle: string | null;
  series: string;
  stage: ContentStageDTO;
  listingStatus: string;
  buildStatus: string | null;
  priceYen: number;
  asin: string | null;
  draftId: string | null;
  publishedAt: string | null;
  hasEpub: boolean;
  hasCover: boolean;
  manuscriptCount: number;
  nextAction: string;
  sourcePaths: string[];
}

export interface NoteContentDTO {
  key: string;
  title: string;
  vertical: string;
  series: string | null;
  magazine: string | null;
  stage: ContentStageDTO;
  catalogStatus: string;
  operationalStatus: string | null;
  isPaid: boolean;
  priceJpy: number;
  noteUrl: string | null;
  publishedAt: string | null;
  r2Path: string;
  r2Body: boolean;
  stats47Targets: string[];
  nextAction: string;
  sourcePaths: string[];
}

export type ReferenceProductionKindDTO = "metric" | "area";
export type ReferenceProductionChannelDTO = "site" | "blog" | "note" | "kindle";
export type ReferenceProductionStageDTO =
  | "integrated"
  | "draft"
  | "ready"
  | "blocked"
  | "not-applicable";

export interface ReferenceChannelCoverageDTO {
  channel: ReferenceProductionChannelDTO;
  stage: ReferenceProductionStageDTO;
  itemIds: string[];
  detail: string;
}

export interface ReferenceProductionUnitDTO {
  id: string;
  kind: ReferenceProductionKindDTO;
  label: string;
  sourceKeys: string[];
  evidenceCount: number;
  primarySourceUrls: string[];
  roles: string[];
  channels: ReferenceChannelCoverageDTO[];
  nextAction: string;
  sourcePaths: string[];
}

export interface ReferenceSourceSummaryDTO {
  sourceKey: string;
  edition: string;
  itemCount: number;
  productionEvidence: number;
  contextEvidence: number;
  blockedEvidence: number;
  notApplicable: number;
  byResolution: Record<string, number>;
  sourcePath: string;
}

export interface ReferenceContentPortfolioDTO {
  summary: {
    sourceItems: number;
    productionEvidence: number;
    contextEvidence: number;
    blockedEvidence: number;
    notApplicable: number;
    productionUnits: number;
    integratedSlots: number;
    draftSlots: number;
    readySlots: number;
    blockedSlots: number;
    byChannel: Record<
      ReferenceProductionChannelDTO,
      Record<ReferenceProductionStageDTO, number>
    >;
  };
  audit: {
    status: "pass" | "warn" | "fail";
    findings: Array<{
      severity: "error" | "warning";
      code: string;
      itemId: string | null;
      message: string;
    }>;
  };
  sources: ReferenceSourceSummaryDTO[];
  units: ReferenceProductionUnitDTO[];
}

export interface ContentOperationsResponse {
  generatedAt: string;
  decisions: Array<{
    channel: ContentChannelDTO;
    status: "pending" | "decided";
    title: string;
    detail: string;
    resumeCondition: string;
    source: string;
  }>;
  audit: {
    status: "pass" | "warn" | "fail";
    errors: number;
    warnings: number;
    findings: ContentFindingDTO[];
  };
  channels: ContentChannelSummaryDTO[];
  kindle: KindleContentDTO[];
  note: NoteContentDTO[];
  references: ReferenceContentPortfolioDTO;
}

// ─── buzz-map (gallery /buzz-map) ─────────────────────

export interface BuzzMapAssetStatusDTO {
  hasLocalAssets: boolean;
  localRels: string[];
  hasSpec: boolean;
}

export interface BuzzMapPostStatusDTO {
  postId: number | null;
  status: string | null;
  platform: string | null;
}

export interface BuzzMapEntryDTO {
  metricKey: string;
  source: string;
  lane: string;
  title: string;
  score: number;
  status: string;
  themeId: string | null;
  note: string | null;
  ideaId?: string;
  subtitle?: string | null;
  category?: string;
  priority?: string;
  recommendedType?: string;
  sourceKind?: string;
  metricKeys?: string[];
  feasibility?: string;
  capability?: string;
  commercialUse?: string;
  sensitivity?: string;
  eligible?: boolean;
  autoPostable?: boolean;
  gateReasons?: string[];
  landingStrategy?: string;
  landingReadiness?: string;
  primaryUrl?: string | null;
  breakdown?: Record<string, number>;
  aliasesOf?: string[];
  assets: BuzzMapAssetStatusDTO | null;
  post: BuzzMapPostStatusDTO | null;
  r2AssetBaseUrl: string | null;
  [key: string]: unknown;
}

export interface BuzzMapCatalogResponse {
  summary: {
    generatedAt: string | null;
    counts: Record<string, number>;
    aggregate: {
      total: number;
      eligible: number;
      blocked: number;
      landingReady: number;
      generated: number;
      draft: number;
      posted: number;
    };
  };
  entries: BuzzMapEntryDTO[];
}
