import type {
  ReferenceChannelCoverageDTO,
  ReferenceContentPortfolioDTO,
  ReferenceProductionChannelDTO,
  ReferenceProductionStageDTO,
  ReferenceProductionUnitDTO,
} from "../contracts/types";

export interface SourceEvidenceItem {
  id: string;
  resolution: string;
  primarySource?: { url?: string };
  mapping?: {
    metricKeys?: string[];
    areaCodes?: string[];
    contentRoles?: string[];
  };
}

export interface SourceEvidenceInventory {
  sourceKey: string;
  edition: string;
  sourcePath: string;
  items: SourceEvidenceItem[];
}

export interface ReferenceMetricSource {
  key: string;
  title: string;
  active: boolean;
  sourcePath: string;
}

export interface ReferenceBlogSource {
  slug: string;
  title: string;
  published: boolean;
  rankingKeys: string[];
}

export interface ReferenceNoteSource {
  key: string;
  status: string;
  stats47Targets?: string[];
}

export interface ReferenceKindleSource {
  id: string;
  status: string;
  rankingKeys: string[];
  blogSlugs: string[];
}

export interface ReferenceAreaSource {
  code: string;
  name: string;
  editorialPath: string | null;
}

export interface ReferenceContentInput {
  expectedSourceKeys?: string[];
  inventories: SourceEvidenceInventory[];
  metrics: ReferenceMetricSource[];
  blogs: ReferenceBlogSource[];
  notes: ReferenceNoteSource[];
  kindleBooks: ReferenceKindleSource[];
  areas: ReferenceAreaSource[];
}

const CHANNELS: ReferenceProductionChannelDTO[] = [
  "site",
  "blog",
  "note",
  "kindle",
];
const STAGES: ReferenceProductionStageDTO[] = [
  "integrated",
  "draft",
  "ready",
  "blocked",
  "not-applicable",
];
const PRODUCTION_RESOLUTIONS = new Set([
  "reuse-existing-metric",
  "new-metric",
  "combined-analysis",
]);
const CONTEXT_RESOLUTIONS = new Set(["context-only"]);
const BLOCKED_RESOLUTIONS = new Set([
  "primary-source-unavailable",
  "rights-hold",
]);

function unique(values: Iterable<string>): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b, "ja"));
}

function coverage(
  channel: ReferenceProductionChannelDTO,
  stage: ReferenceProductionStageDTO,
  itemIds: string[],
  detail: string,
): ReferenceChannelCoverageDTO {
  return { channel, stage, itemIds: unique(itemIds), detail };
}

function sourceSummary(inventory: SourceEvidenceInventory) {
  const byResolution: Record<string, number> = {};
  for (const item of inventory.items) {
    byResolution[item.resolution] = (byResolution[item.resolution] ?? 0) + 1;
  }
  const count = (set: Set<string>) =>
    inventory.items.filter((item) => set.has(item.resolution)).length;
  return {
    sourceKey: inventory.sourceKey,
    edition: inventory.edition,
    itemCount: inventory.items.length,
    productionEvidence: count(PRODUCTION_RESOLUTIONS),
    contextEvidence: count(CONTEXT_RESOLUTIONS),
    blockedEvidence: count(BLOCKED_RESOLUTIONS),
    notApplicable: byResolution["not-applicable"] ?? 0,
    byResolution,
    sourcePath: inventory.sourcePath,
  };
}

function nextAction(channels: ReferenceChannelCoverageDTO[]): string {
  const drafts = channels.filter((channel) => channel.stage === "draft");
  if (drafts.length > 0) {
    return `${drafts.map((channel) => channel.channel).join(" / ")} の原稿を品質ゲートまで進める`;
  }
  const ready = channels.filter((channel) => channel.stage === "ready");
  if (ready.length > 0) {
    return `${ready.map((channel) => channel.channel).join(" / ")} の既存制作フローへ送る`;
  }
  if (channels.some((channel) => channel.stage === "blocked")) {
    return "一次資料または実装先を確定するまで公開しない";
  }
  return "既存コンテンツの計測・更新を継続する";
}

export function buildReferenceContentPortfolio(
  input: ReferenceContentInput,
): ReferenceContentPortfolioDTO {
  const findings: ReferenceContentPortfolioDTO["audit"]["findings"] = [];
  const loadedSourceKeys = new Set(input.inventories.map((inventory) => inventory.sourceKey));
  for (const sourceKey of input.expectedSourceKeys ?? []) {
    if (!loadedSourceKeys.has(sourceKey)) {
      findings.push({
        severity: "error",
        code: "REFERENCE_INVENTORY_MISSING",
        itemId: sourceKey,
        message: "登録済み参考文献の解決済みinventoryがありません",
      });
    }
  }
  const metricByKey = new Map(input.metrics.map((metric) => [metric.key, metric]));
  const areaByCode = new Map(input.areas.map((area) => [area.code, area]));
  const allItems = input.inventories.flatMap((inventory) =>
    inventory.items.map((item) => ({ inventory, item })),
  );

  const metricKeys = unique(
    allItems.flatMap(({ item }) =>
      ["reuse-existing-metric", "new-metric"].includes(item.resolution)
        ? (item.mapping?.metricKeys ?? [])
        : [],
    ),
  );
  const areaCodes = unique(
    allItems.flatMap(({ item }) =>
      item.resolution === "combined-analysis" ? (item.mapping?.areaCodes ?? []) : [],
    ),
  );

  const units: ReferenceProductionUnitDTO[] = [];
  for (const key of metricKeys) {
    const evidence = allItems.filter(({ item }) => item.mapping?.metricKeys?.includes(key));
    const metric = metricByKey.get(key);
    if (!metric) {
      findings.push({
        severity: "error",
        code: "REFERENCE_METRIC_MISSING",
        itemId: key,
        message: "参考文献から接続されたmetricがgit TSに存在しません",
      });
    } else if (!metric.active) {
      findings.push({
        severity: "warning",
        code: "REFERENCE_METRIC_INACTIVE",
        itemId: key,
        message: "参考文献から接続されたmetricが非公開です",
      });
    }
    const roles = unique(evidence.flatMap(({ item }) => item.mapping?.contentRoles ?? []));
    const blogHits = input.blogs.filter(
      (blog) => blog.published && (blog.slug === key || blog.rankingKeys.includes(key)),
    );
    const blogDrafts = input.blogs.filter(
      (blog) => !blog.published && (blog.slug === key || blog.rankingKeys.includes(key)),
    );
    const noteHits = input.notes.filter((note) =>
      note.status === "published" && note.stats47Targets?.includes(`/ranking/${key}`),
    );
    const noteDrafts = input.notes.filter((note) =>
      note.status !== "published" && note.stats47Targets?.includes(`/ranking/${key}`),
    );
    const allNoteHits = input.notes.filter((note) =>
      note.stats47Targets?.includes(`/ranking/${key}`),
    );
    const blogSlugs = new Set(blogHits.map((blog) => blog.slug));
    const kindleHits = input.kindleBooks.filter(
      (book) =>
        book.rankingKeys.includes(key) || book.blogSlugs.some((slug) => blogSlugs.has(slug)),
    );
    const siteReady = Boolean(metric?.active);
    const channels = [
      coverage(
        "site",
        siteReady ? "integrated" : "blocked",
        metric ? [key] : [],
        siteReady ? "既存ranking metricへ統合済み" : "公開中のmetricが無いため停止",
      ),
      coverage(
        "blog",
        blogHits.length > 0
          ? "integrated"
          : blogDrafts.length > 0
            ? "draft"
            : siteReady
              ? "ready"
              : "blocked",
        [...blogHits, ...blogDrafts].map((blog) => blog.slug),
        blogHits.length > 0
          ? "ランキングへの内部リンクを持つ公開記事あり"
          : blogDrafts.length > 0
            ? "ランキングへの内部リンクを持つローカル下書きあり"
            : "既存metricと一次資料から新規記事を制作可能",
      ),
      roles.includes("note")
        ? coverage(
            "note",
            noteHits.length > 0
              ? "integrated"
              : noteDrafts.length > 0
                ? "draft"
                : siteReady
                  ? "ready"
                  : "blocked",
            allNoteHits.map((note) => note.key),
            noteHits.length > 0
              ? "stats47送客先を持つnote記事あり"
              : noteDrafts.length > 0
                ? "stats47送客先を持つnote下書きあり"
                : "既存metricからnoteランキング記事を制作可能",
          )
        : coverage("note", "not-applicable", [], "inventory上のnote展開対象外"),
      kindleHits.length > 0
        ? coverage(
            "kindle",
            kindleHits.some((book) => ["generated", "published"].includes(book.status))
              ? "integrated"
              : "draft",
            kindleHits.map((book) => book.id),
            "既存Kindleカタログのrankingまたはblog章へ統合済み",
          )
        : coverage(
            "kindle",
            "not-applicable",
            [],
            "1指標1冊にせず、需要確認済みの既存書籍ポートフォリオだけへ採択",
          ),
    ];
    const unit: ReferenceProductionUnitDTO = {
      id: `metric:${key}`,
      kind: "metric",
      label: metric?.title || key,
      sourceKeys: unique(evidence.map(({ inventory }) => inventory.sourceKey)),
      evidenceCount: evidence.length,
      primarySourceUrls: unique(
        evidence.flatMap(({ item }) => (item.primarySource?.url ? [item.primarySource.url] : [])),
      ),
      roles,
      channels,
      nextAction: nextAction(channels),
      sourcePaths: unique([
        ...evidence.map(({ inventory }) => inventory.sourcePath),
        ...(metric ? [metric.sourcePath] : []),
      ]),
    };
    units.push(unit);
  }

  for (const code of areaCodes) {
    const evidence = allItems.filter(({ item }) => item.mapping?.areaCodes?.includes(code));
    const area = areaByCode.get(code);
    if (!area?.editorialPath) {
      findings.push({
        severity: "error",
        code: "REFERENCE_AREA_EDITORIAL_MISSING",
        itemId: code,
        message: "公式自治体資料へ接続された地域のarea editorialがありません",
      });
    }
    const channels = [
      coverage(
        "site",
        area?.editorialPath ? "integrated" : "blocked",
        area?.editorialPath ? [code] : [],
        area?.editorialPath
          ? "県データブックの編集コンテンツへ統合済み"
          : "area editorialが無いため停止",
      ),
      coverage("blog", "not-applicable", [], "地域資料はareaページの根拠に集約"),
      coverage("note", "not-applicable", [], "地域資料はareaページの根拠に集約"),
      coverage("kindle", "not-applicable", [], "地域資料は既存地域別書籍の設計を重複させない"),
    ];
    units.push({
      id: `area:${code}`,
      kind: "area",
      label: area?.name || code,
      sourceKeys: unique(evidence.map(({ inventory }) => inventory.sourceKey)),
      evidenceCount: evidence.length,
      primarySourceUrls: unique(
        evidence.flatMap(({ item }) => (item.primarySource?.url ? [item.primarySource.url] : [])),
      ),
      roles: ["area"],
      channels,
      nextAction: nextAction(channels),
      sourcePaths: unique([
        ...evidence.map(({ inventory }) => inventory.sourcePath),
        ...(area?.editorialPath ? [area.editorialPath] : []),
      ]),
    });
  }

  const sources = input.inventories.map(sourceSummary);
  const byChannel = Object.fromEntries(
    CHANNELS.map((channel) => [
      channel,
      Object.fromEntries(
        STAGES.map((stage) => [
          stage,
          units.filter((unit) =>
            unit.channels.some((entry) => entry.channel === channel && entry.stage === stage),
          ).length,
        ]),
      ),
    ]),
  ) as ReferenceContentPortfolioDTO["summary"]["byChannel"];
  const allSlots = units.flatMap((unit) => unit.channels);
  const errors = findings.filter((finding) => finding.severity === "error").length;
  const warnings = findings.filter((finding) => finding.severity === "warning").length;

  return {
    summary: {
      sourceItems: sources.reduce((sum, source) => sum + source.itemCount, 0),
      productionEvidence: sources.reduce((sum, source) => sum + source.productionEvidence, 0),
      contextEvidence: sources.reduce((sum, source) => sum + source.contextEvidence, 0),
      blockedEvidence: sources.reduce((sum, source) => sum + source.blockedEvidence, 0),
      notApplicable: sources.reduce((sum, source) => sum + source.notApplicable, 0),
      productionUnits: units.length,
      integratedSlots: allSlots.filter((slot) => slot.stage === "integrated").length,
      draftSlots: allSlots.filter((slot) => slot.stage === "draft").length,
      readySlots: allSlots.filter((slot) => slot.stage === "ready").length,
      blockedSlots: allSlots.filter((slot) => slot.stage === "blocked").length,
      byChannel,
    },
    audit: {
      status: errors > 0 ? "fail" : warnings > 0 ? "warn" : "pass",
      findings,
    },
    sources,
    units: units.sort((a, b) => {
      const stageOrder: Record<ReferenceProductionStageDTO, number> = {
        draft: 0,
        ready: 1,
        blocked: 2,
        integrated: 3,
        "not-applicable": 4,
      };
      const priority = (unit: ReferenceProductionUnitDTO) =>
        Math.min(...unit.channels.map((channel) => stageOrder[channel.stage]));
      return (
        priority(a) - priority(b) ||
        (a.kind === "metric" ? 0 : 1) - (b.kind === "metric" ? 0 : 1) ||
        a.label.localeCompare(b.label, "ja")
      );
    }),
  };
}
