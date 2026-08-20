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
