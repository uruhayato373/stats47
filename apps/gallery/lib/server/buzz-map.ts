import "server-only";

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { projectRoot, localSnsDir, R2_BASE } from "./project-root";
import { query as queryPosts } from "./posts-store";

/**
 * buzz-map カタログの読み取り + 表示用 decorate。
 *
 * 正典: .claude/rules/buzz-map-standards.md §4-5。
 * SSOT は .claude/state/sns/buzz-map-catalog.json (builder = build-buzz-map-catalog.ts が生成)。
 * この module は read-only (catalog を書き換えない、書込は builder CLI 経由のみ)。
 *
 * decorate は「ローカル素材の有無」「posts.json の draft/scheduled/posted 状態」を
 * catalog entry に横から付与する (catalog 自体には持たせない — R2/posts.json が真実源)。
 */

export interface BuzzMapEntry {
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
  [key: string]: unknown;
}

interface CatalogFile {
  generatedAt: string | null;
  weights: Record<string, number>;
  counts: Record<string, number>;
  entries: BuzzMapEntry[];
}

function catalogPath(): string {
  return path.join(projectRoot(), ".claude/state/sns/buzz-map-catalog.json");
}

function loadCatalog(): CatalogFile {
  const fp = catalogPath();
  if (!existsSync(fp)) {
    return { generatedAt: null, weights: {}, counts: {}, entries: [] };
  }
  return JSON.parse(readFileSync(fp, "utf8")) as CatalogFile;
}

/** R2 §8.2 の想定素材 rel パス (ideaId 単位)。ローカルミラー突合 + R2 公開 URL fallback に使う。 */
const BUZZ_MAP_ASSET_RELS = [
  "x/stills",
  "x/reel.mp4",
  "x/caption.txt",
  "instagram/stills",
  "instagram/reel.mp4",
  "instagram/caption.txt",
] as const;

export interface BuzzMapAssetStatus {
  /** ローカルミラー (.local/r2/sns/buzz-map/<ideaId>/) に何かあるか */
  hasLocalAssets: boolean;
  /** ローカルに見つかった rel の一覧 */
  localRels: string[];
  /** apps/remotion/src/features/buzz-map/specs/<ideaId>.json が存在するか */
  hasSpec: boolean;
}

function scanIdeaAssets(ideaId: string): BuzzMapAssetStatus {
  const base = path.join(localSnsDir(), "buzz-map", ideaId);
  const localRels: string[] = [];
  if (existsSync(base)) {
    for (const rel of BUZZ_MAP_ASSET_RELS) {
      const p = path.join(base, rel);
      if (existsSync(p)) localRels.push(rel);
    }
  }
  const specPath = path.join(
    projectRoot(),
    "apps/remotion/src/features/buzz-map/specs",
    `${ideaId}.json`,
  );
  return {
    hasLocalAssets: localRels.length > 0,
    localRels,
    hasSpec: existsSync(specPath),
  };
}

export interface BuzzMapPostStatus {
  /** posts.json に buzz-map ideaId (content_key ベース) で紐づくレコードがあるか */
  postId: number | null;
  status: string | null;
  platform: string | null;
}

/** posts.json の buzz-map レコードを ideaId (content_key) で引く。domain="buzz-map" 前提 (§6 content bundle)。 */
function findPostForIdea(ideaId: string): BuzzMapPostStatus {
  const hits = queryPosts(
    (p) => p.domain === "buzz-map" && p.content_key === ideaId && !p.deleted_at,
  );
  if (hits.length === 0) return { postId: null, status: null, platform: null };
  // 最新 (id 最大) を代表とする
  const latest = hits.reduce((a, b) => (b.id > a.id ? b : a));
  return { postId: latest.id, status: latest.status, platform: latest.platform };
}

export interface BuzzMapCatalogSummary {
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
}

export interface BuzzMapDecoratedEntry extends BuzzMapEntry {
  assets: BuzzMapAssetStatus | null;
  post: BuzzMapPostStatus | null;
  r2AssetBaseUrl: string | null;
}

export interface BuzzMapCatalogResponse {
  summary: BuzzMapCatalogSummary;
  entries: BuzzMapDecoratedEntry[];
}

/**
 * 既定は curated レーンのみ decorate して返す (machine レーン 778 件は「投稿できるネタ」の
 * 対象外・curated が主戦場)。lane="all" で catalog 全 938 件を返せる (machine レーン監査用。
 * ideaId を持たないため assets/post は null になる)。
 */
export function readBuzzMapCatalog(opts: { lane?: string } = {}): BuzzMapCatalogResponse {
  const catalog = loadCatalog();
  const lane = opts.lane ?? "curated";
  const filtered = lane === "all" ? catalog.entries : catalog.entries.filter((e) => e.lane === lane);

  const entries: BuzzMapDecoratedEntry[] = filtered.map((e) => {
    const ideaId = e.ideaId ?? null;
    const assets = ideaId ? scanIdeaAssets(ideaId) : null;
    const post = ideaId ? findPostForIdea(ideaId) : null;
    return {
      ...e,
      assets,
      post,
      r2AssetBaseUrl: ideaId ? `${R2_BASE}/sns/buzz-map/${ideaId}` : null,
    };
  });

  // status machine の catalog entry.status を正とする (SSOT)。
  // ローカル素材の有無 (assets.hasLocalAssets) や posts.json の状態は表示用の補助情報であり、
  // 集計の母数にしない (二重の真実源によるカウントずれの再発防止)。
  const aggregate = {
    total: entries.length,
    eligible: entries.filter((e) => e.eligible === true).length,
    blocked: entries.filter((e) => e.landingStrategy === "blocked").length,
    landingReady: entries.filter(
      (e) => e.landingReadiness === "live" || e.landingReadiness === "ready",
    ).length,
    generated: entries.filter((e) => e.status === "generated").length,
    draft: entries.filter((e) => e.status === "draft").length,
    posted: entries.filter((e) => e.status === "posted").length,
  };

  return {
    summary: { generatedAt: catalog.generatedAt, counts: catalog.counts, aggregate },
    entries,
  };
}

/** ideaId から entry 1 件を引く (allowlist 検証用)。 */
export function findBuzzMapIdea(ideaId: string): BuzzMapEntry | null {
  const catalog = loadCatalog();
  return catalog.entries.find((e) => e.lane === "curated" && e.ideaId === ideaId) ?? null;
}

/** 全 curated ideaId の集合 (API 側の allowlist 検証に使う)。 */
export function listCuratedIdeaIds(): Set<string> {
  const catalog = loadCatalog();
  return new Set(
    catalog.entries.filter((e) => e.lane === "curated" && e.ideaId).map((e) => e.ideaId as string),
  );
}
