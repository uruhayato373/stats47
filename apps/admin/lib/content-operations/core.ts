import type {
  ContentChannelDTO,
  ContentChannelSummaryDTO,
  ContentFindingDTO,
  ContentOperationsResponse,
  ContentStageDTO,
  KindleContentDTO,
  NoteContentDTO,
} from "../contracts/types";

export interface SourceSocialPost {
  platform: string;
  status: string;
}

export interface SourceKindleListing {
  id: string;
  title: string;
  subtitle?: string | null;
  status: string;
  priceYen: number;
  asin?: string | null;
  draftId?: string | null;
  publishedAt?: string | null;
  epubPath: string;
  coverPath: string;
  hasEpub: boolean;
  hasCover: boolean;
  manuscriptCount: number;
}

export interface SourceKindleBuildBook {
  id: string;
  status: string;
}

export interface SourceNoteArticle {
  key: string;
  title: string;
  vertical: string;
  series?: string;
  magazine: string | null;
  isPaid: boolean;
  priceJpy?: number;
  status: string;
  noteUrl?: string;
  publishedAt?: string;
  r2Path: string;
  r2Body?: boolean;
  stats47Targets?: string[];
}

export interface ContentOperationsInput {
  generatedAt: string;
  socialPosts: SourceSocialPost[];
  kindleListings: SourceKindleListing[];
  kindleBuildBooks: SourceKindleBuildBook[];
  noteArticles: SourceNoteArticle[];
  noteDraftStatuses: Record<string, string>;
  backlogText: string;
  kdpPolicy: {
    mode: "active" | "paused";
    decisionStatus: "pending" | "decided";
    title: string;
    reason: string;
    resumeCondition: string;
    source: string;
  };
}

const LABELS: Record<ContentChannelDTO, string> = {
  x: "X",
  instagram: "Instagram",
  note: "note",
  kindle: "Kindle",
};

const HREFS: Record<ContentChannelDTO, string> = {
  x: "/content/x",
  instagram: "/content/instagram",
  note: "/content/note",
  kindle: "/content/kindle",
};

const SOURCES: Record<ContentChannelDTO, string> = {
  x: ".claude/state/sns/posts.json",
  instagram: ".claude/state/sns/posts.json",
  note: ".claude/scripts/note/catalog/ (git TS) + R2本文",
  kindle:
    "packages/product-factory/src/channels/kindle/book-catalog.ts + .claude/config/kdp-listings.json",
};

function socialStage(status: string): ContentStageDTO {
  if (status === "posted" || status === "published") return "published";
  if (status === "scheduled") return "scheduled";
  if (status === "ready" || status === "ready-to-publish") return "ready";
  if (status === "blocked" || status === "failed") return "blocked";
  return "draft";
}

function summarize(
  channel: ContentChannelDTO,
  stages: ContentStageDTO[],
): ContentChannelSummaryDTO {
  const count = (stage: ContentStageDTO) => stages.filter((x) => x === stage).length;
  return {
    channel,
    label: LABELS[channel],
    href: HREFS[channel],
    total: stages.length,
    draft: count("draft"),
    ready: count("ready"),
    scheduled: count("scheduled"),
    published: count("published"),
    blocked: count("blocked"),
    source: SOURCES[channel],
  };
}

function kindleSeries(id: string): string {
  const match = id.match(/^K-(S\d)-/);
  return match?.[1] ?? "unknown";
}

function auditDuplicateIds(
  channel: ContentChannelDTO,
  ids: string[],
): ContentFindingDTO[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) duplicates.add(id);
    seen.add(id);
  }
  return [...duplicates].map((id) => ({
    severity: "error",
    code: "DUPLICATE_ID",
    channel,
    itemId: id,
    message: `安定ID ${id} が重複しています`,
  }));
}

export function buildContentOperations(
  input: ContentOperationsInput,
): ContentOperationsResponse {
  const findings: ContentFindingDTO[] = [
    ...auditDuplicateIds("kindle", input.kindleListings.map((x) => x.id)),
    ...auditDuplicateIds("note", input.noteArticles.map((x) => x.key)),
  ];
  const contentCardPatterns: Array<[ContentChannelDTO, RegExp]> = [
    ["kindle", /^K-S[1-4]-\d{2}$/],
    ["note", /^NOTE-(?:ARTICLE|DRAFT)-/],
    ["x", /^SNS-(?:POST|X)-/],
    ["instagram", /^SNS-(?:POST|IG|INSTAGRAM)-/],
  ];
  for (const match of input.backlogText.matchAll(/^### \[([^\]]+)\]/gm)) {
    const id = match[1];
    const channel = contentCardPatterns.find(([, pattern]) => pattern.test(id))?.[0];
    if (channel) {
      findings.push({
        severity: "error",
        code: "BACKLOG_CONTENT_ITEM_MIRROR",
        channel,
        itemId: id,
        message: "個別制作物の状態をTODOへ複製せず、チャネルSSOTと/contentで管理してください",
      });
    }
  }
  const buildById = new Map(input.kindleBuildBooks.map((x) => [x.id, x]));
  const listingIds = new Set(input.kindleListings.map((x) => x.id));
  const buildIds = new Set(input.kindleBuildBooks.map((x) => x.id));

  for (const id of listingIds) {
    if (!buildIds.has(id)) {
      findings.push({
        severity: "error",
        code: "KINDLE_BUILD_STATE_MISSING",
        channel: "kindle",
        itemId: id,
        message: "KDP出品定義に対応するKindle生成台帳がありません",
      });
    }
  }
  for (const id of buildIds) {
    if (!listingIds.has(id)) {
      findings.push({
        severity: "error",
        code: "KDP_LISTING_MISSING",
        channel: "kindle",
        itemId: id,
        message: "Kindle生成台帳に対応するKDP出品定義がありません",
      });
    }
  }

  const kindle: KindleContentDTO[] = input.kindleListings.map((listing) => {
    const build = buildById.get(listing.id);
    if (!listing.title.trim() || !listing.epubPath || !listing.coverPath) {
      findings.push({
        severity: "error",
        code: "KDP_REQUIRED_FIELD_MISSING",
        channel: "kindle",
        itemId: listing.id,
        message: "title / epubPath / coverPath の必須項目が不足しています",
      });
    }
    if (!new Set(["draft", "listed"]).has(listing.status)) {
      findings.push({
        severity: "error",
        code: "KDP_STATUS_INVALID",
        channel: "kindle",
        itemId: listing.id,
        message: `未対応のKDP statusです: ${listing.status}`,
      });
    }
    if (listing.status === "listed" && (!listing.draftId || !listing.publishedAt)) {
      findings.push({
        severity: "error",
        code: "KDP_LISTED_EVIDENCE_MISSING",
        channel: "kindle",
        itemId: listing.id,
        message: "listed ですが draftId または publishedAt がありません",
      });
    }
    if (listing.status === "listed" && !listing.asin) {
      findings.push({
        severity: "warning",
        code: "KDP_ASIN_PENDING",
        channel: "kindle",
        itemId: listing.id,
        message: "listed ですがASIN未記録です（審査中なら正常）",
      });
    }

    const stage: ContentStageDTO =
      listing.status === "listed"
        ? "published"
        : listing.hasEpub && listing.hasCover
          ? "ready"
          : "draft";
    const nextAction =
      stage === "published"
        ? "売上・KENPを計測"
        : input.kdpPolicy.mode === "paused"
          ? `出版保留: ${input.kdpPolicy.resumeCondition}`
        : stage === "ready"
          ? "オーナー承認後に /kdp-publish"
          : "EPUB・表紙を再生成してPreviewer確認";

    return {
      id: listing.id,
      title: listing.title,
      subtitle: listing.subtitle ?? null,
      series: kindleSeries(listing.id),
      stage,
      listingStatus: listing.status,
      buildStatus: build?.status ?? null,
      priceYen: listing.priceYen,
      asin: listing.asin ?? null,
      draftId: listing.draftId ?? null,
      publishedAt: listing.publishedAt ?? null,
      hasEpub: listing.hasEpub,
      hasCover: listing.hasCover,
      manuscriptCount: listing.manuscriptCount,
      nextAction,
      sourcePaths: [
        "packages/product-factory/src/channels/kindle/book-catalog.ts",
        `.claude/config/kdp-listings.json#${listing.id}`,
        `packages/product-factory/src/channels/kindle/manuscripts/${listing.id}/`,
      ],
    };
  });

  const catalogKeys = new Set(input.noteArticles.map((x) => x.key));
  for (const key of Object.keys(input.noteDraftStatuses)) {
    if (!catalogKeys.has(key)) {
      findings.push({
        severity: "error",
        code: "NOTE_DRAFT_ORPHAN",
        channel: "note",
        itemId: key,
        message: "noteドラフト索引にありますがgit TSカタログに存在しません",
      });
    }
  }

  const note: NoteContentDTO[] = input.noteArticles.map((article) => {
    const operationalStatus = input.noteDraftStatuses[article.key] ?? null;
    if (!new Set(["draft", "published"]).has(article.status)) {
      findings.push({
        severity: "error",
        code: "NOTE_STATUS_INVALID",
        channel: "note",
        itemId: article.key,
        message: `未対応のnote catalog statusです: ${article.status}`,
      });
    }
    if (article.status === "published" && !article.noteUrl) {
      findings.push({
        severity: "error",
        code: "NOTE_PUBLISHED_EVIDENCE_MISSING",
        channel: "note",
        itemId: article.key,
        message: "published ですが noteUrl がありません",
      });
    }
    if (article.status === "published" && !article.publishedAt) {
      findings.push({
        severity: "warning",
        code: "NOTE_PUBLISHED_AT_UNKNOWN",
        channel: "note",
        itemId: article.key,
        message: "publishedAt が未記録です（回収スタブでは許容）",
      });
    }
    const stage: ContentStageDTO =
      article.status === "published"
        ? "published"
        : operationalStatus === "ready-to-publish"
          ? "ready"
          : "draft";
    const nextAction =
      stage === "published"
        ? article.r2Body === false
          ? "note.com本文をR2へ復元"
          : "流入・回遊を計測"
        : stage === "ready"
          ? "オーナー承認後に /publish-note"
          : "R2原稿を編集・レビュー";
    return {
      key: article.key,
      title: article.title,
      vertical: article.vertical,
      series: article.series ?? null,
      magazine: article.magazine,
      stage,
      catalogStatus: article.status,
      operationalStatus,
      isPaid: article.isPaid,
      priceJpy: article.priceJpy ?? 0,
      noteUrl: article.noteUrl ?? null,
      publishedAt: article.publishedAt ?? null,
      r2Path: article.r2Path,
      r2Body: article.r2Body !== false,
      stats47Targets: article.stats47Targets ?? [],
      nextAction,
      sourcePaths: [
        `.claude/scripts/note/catalog/data/${article.vertical}.ts#${article.key}`,
        article.r2Path,
      ],
    };
  });

  const socialStages = (channel: "x" | "instagram") =>
    input.socialPosts
      .filter((post) => post.platform === channel)
      .map((post) => socialStage(post.status));
  const channels = [
    summarize("x", socialStages("x")),
    summarize("instagram", socialStages("instagram")),
    summarize("note", note.map((x) => x.stage)),
    summarize("kindle", kindle.map((x) => x.stage)),
  ];
  const errors = findings.filter((x) => x.severity === "error").length;
  const warnings = findings.filter((x) => x.severity === "warning").length;

  return {
    generatedAt: input.generatedAt,
    decisions: [
      {
        channel: "kindle",
        status: input.kdpPolicy.decisionStatus,
        title: input.kdpPolicy.title,
        detail: input.kdpPolicy.reason,
        resumeCondition: input.kdpPolicy.resumeCondition,
        source: input.kdpPolicy.source,
      },
    ],
    audit: {
      status: errors > 0 ? "fail" : warnings > 0 ? "warn" : "pass",
      errors,
      warnings,
      findings,
    },
    channels,
    kindle: kindle.sort((a, b) => a.id.localeCompare(b.id)),
    note: note.sort((a, b) => {
      const stageOrder: Record<ContentStageDTO, number> = {
        ready: 0,
        draft: 1,
        blocked: 2,
        scheduled: 3,
        published: 4,
      };
      return stageOrder[a.stage] - stageOrder[b.stage] || a.title.localeCompare(b.title, "ja");
    }),
  };
}
