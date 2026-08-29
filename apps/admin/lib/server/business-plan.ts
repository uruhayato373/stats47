import "server-only";

import {
  BUSINESS_PLAN_2026,
  type BusinessPlanDecisionStatus,
  type BusinessPlanMeasurementStatus,
  type BusinessPlanWorkStatus,
} from "@stats47/data-configs/business-plan";
import { NOTE_ARTICLES } from "../../../../.claude/scripts/note/catalog";

import {
  fileExists,
  frontmatterValue,
  readJson,
  readText,
  wrap,
  type Wrapped,
} from "./state-io";

interface SocialPostState {
  posts: Array<{
    platform?: string;
    content_key?: string | null;
    status?: string;
    scheduled_at?: string | null;
    template?: string | null;
    media_path?: string | null;
    utm_url?: string | null;
  }>;
}

interface BusinessPlanState {
  schemaVersion: number;
  generatedAt: string;
  catalogId: string;
  catalogVersion: string;
  sourceSha256: string;
  coverage: Record<string, number>;
  statusCounts: Record<BusinessPlanDecisionStatus, number>;
  eventCounts: Partial<Record<BusinessPlanMeasurementStatus, number>>;
  sourceFreshness: Record<string, string | null>;
  nextActions: Array<{
    id: string;
    title: string;
    owner: string;
    gate: string;
  }>;
  measurementWarning: string;
}

export interface BusinessPlanDocumentView {
  id: string;
  title: string;
  path: string;
  role: string;
  owner: string;
  updated: string | null;
  status: string | null;
}

export interface BusinessPlanDocumentDetail extends BusinessPlanDocumentView {
  body: string;
}

export interface BusinessPlanAdminData {
  catalog: typeof BUSINESS_PLAN_2026;
  state: Wrapped<BusinessPlanState>;
  documents: Wrapped<BusinessPlanDocumentView[]>;
  counts: {
    readyContent: number;
    gatedInitiatives: number;
    unmeasuredEvents: number;
  };
  m1: {
    analyses: Array<{
      id: string;
      slug: string;
      title: string;
      status: BusinessPlanWorkStatus;
      dataKey: string;
      dataKind: "ranking" | "geo-snapshot";
      localSnapshotReady: boolean;
      expectedObservationCount: number;
      evidenceCheckedAt: string;
    }>;
    routes: Array<{
      path: string;
      title: string;
      status: BusinessPlanWorkStatus;
      implemented: boolean;
      searchVisibility: "noindex" | "index-gated";
    }>;
    x: Wrapped<{
      planned: number;
      registered: number;
      draft: number;
      scheduled: number;
      posted: number;
      missingContentKeys: string[];
      posts: Array<{
        contentKey: string;
        title: string;
        template: string;
        scheduledAt: string;
        registryStatus: string | null;
        mediaPath: string | null;
        mediaReady: boolean;
        utmUrl: string | null;
      }>;
    }>;
    note: {
      planned: number;
      registered: number;
      withBody: number;
      published: number;
      missingArticleKeys: string[];
      products: Array<{
        id: string;
        articleKey: string;
        title: string;
        priceYen: number;
        productStatus: BusinessPlanWorkStatus;
        catalogStatus: "draft" | "published" | null;
        hasBody: boolean;
        r2Path: string | null;
        readerOutcome: string;
        readinessGate: string;
      }>;
    };
    events: {
      planned: number;
      codeMapped: number;
      measured: number;
      registrationPending: number;
      items: Array<{
        id: string;
        label: string;
        canonicalEvent: string | null;
        status: BusinessPlanMeasurementStatus;
        note: string;
      }>;
    };
    releaseChecks: Array<{
      id: "site-data" | "x-drafts" | "note-catalog" | "ga4" | "approval";
      label: string;
      status: "pass" | "pending";
      detail: string;
      external: boolean;
    }>;
  };
}

export function businessPlanAdminData(): BusinessPlanAdminData {
  const documents = wrap(() =>
    BUSINESS_PLAN_2026.documents.map((document) => {
      const text = readText(document.path);
      return {
        ...document,
        updated: frontmatterValue(text, "updated"),
        status: frontmatterValue(text, "status"),
      };
    })
  );
  const state = wrap(() =>
    readJson<BusinessPlanState>(".claude/state/business-plan/latest.json")
  );
  const m1ContentKeys = new Set(
    BUSINESS_PLAN_2026.m1.xPosts.map((post) => post.contentKey)
  );
  const x = wrap(() => {
    const posts = readJson<SocialPostState>(".claude/state/sns/posts.json").posts.filter(
      (post) =>
        post.platform === "x" &&
        post.content_key !== null &&
        post.content_key !== undefined &&
        m1ContentKeys.has(post.content_key)
    );
    const postByContentKey = new Map(
      posts.map((post) => [post.content_key as string, post]),
    );
    const registered = new Set(postByContentKey.keys());
    return {
      planned: BUSINESS_PLAN_2026.m1.xPosts.length,
      registered: registered.size,
      draft: posts.filter((post) => post.status === "draft").length,
      scheduled: posts.filter((post) => post.status === "scheduled").length,
      posted: posts.filter((post) => post.status === "posted").length,
      missingContentKeys: BUSINESS_PLAN_2026.m1.xPosts
        .map((post) => post.contentKey)
        .filter((key) => !registered.has(key)),
      posts: BUSINESS_PLAN_2026.m1.xPosts.map((planned) => {
        const registeredPost = postByContentKey.get(planned.contentKey);
        const mediaPath = registeredPost?.media_path ?? null;
        return {
          contentKey: planned.contentKey,
          title: planned.title,
          template: registeredPost?.template ?? planned.template,
          scheduledAt: registeredPost?.scheduled_at ?? planned.scheduledAt,
          registryStatus: registeredPost?.status ?? null,
          mediaPath,
          mediaReady: mediaPath ? fileExists(mediaPath) : false,
          utmUrl: registeredPost?.utm_url ?? null,
        };
      }),
    };
  });
  const noteByKey = new Map(NOTE_ARTICLES.map((article) => [article.key, article]));
  const noteProducts = BUSINESS_PLAN_2026.m1.noteProducts.map((product) => {
    const article = noteByKey.get(product.articleKey);
    return {
      id: product.id,
      articleKey: product.articleKey,
      title: product.title,
      priceYen: product.priceYen,
      productStatus: product.status,
      catalogStatus: article?.status ?? null,
      hasBody: article !== undefined && article.r2Body !== false,
      r2Path: article?.r2Path ?? null,
      readerOutcome: product.readerOutcome,
      readinessGate: product.readinessGate,
    };
  });
  const m1NoteArticles = noteProducts.filter(
    (product) => product.catalogStatus !== null,
  );
  const m1Events = BUSINESS_PLAN_2026.m1.eventIds
    .map((id) => BUSINESS_PLAN_2026.events.find((event) => event.id === id))
    .filter((event) => event !== undefined);

  const analyses = BUSINESS_PLAN_2026.m1.analyses.map((analysis) => ({
    id: analysis.id,
    slug: analysis.slug,
    title: analysis.title,
    status: analysis.status,
    dataKey: analysis.r2Key ?? analysis.rankingKey ?? "未設定",
    dataKind: analysis.r2Key ? ("geo-snapshot" as const) : ("ranking" as const),
    localSnapshotReady: analysis.r2Key
      ? fileExists(`.local/r2/${analysis.r2Key}`)
      : Boolean(analysis.rankingKey),
    expectedObservationCount: analysis.expectedObservationCount,
    evidenceCheckedAt: analysis.evidenceCheckedAt,
  }));
  const routes = BUSINESS_PLAN_2026.m1.routes.map((route) => ({
    path: route.path,
    title: route.title,
    status: route.status,
    implemented:
      fileExists(
        route.path === "/geo"
          ? "apps/web/src/app/geo/page.tsx"
          : `apps/web/src/app${route.path}/page.tsx`,
      ) ||
      (route.path.startsWith("/geo/") &&
        fileExists("apps/web/src/app/geo/[analysisSlug]/page.tsx")),
    searchVisibility: route.searchVisibility,
  }));
  const xReady =
    !("error" in x) &&
    x.registered === x.planned &&
    x.missingContentKeys.length === 0 &&
    x.posts.every((post) => post.registryStatus !== null && post.mediaReady);
  const noteReady =
    m1NoteArticles.length === BUSINESS_PLAN_2026.m1.noteProducts.length;
  const eventCodeReady =
    m1Events.length === BUSINESS_PLAN_2026.m1.eventIds.length &&
    m1Events.every((event) => event.canonicalEvent !== null);
  const ga4Ready =
    eventCodeReady && m1Events.every((event) => event.status === "measured");
  const siteDataReady =
    routes.every((route) => route.implemented) &&
    analyses.every((analysis) => analysis.localSnapshotReady);

  return {
    catalog: BUSINESS_PLAN_2026,
    state,
    documents,
    counts: {
      readyContent: BUSINESS_PLAN_2026.contentOpportunities.filter(
        (item) => item.status === "ready"
      ).length,
      gatedInitiatives: BUSINESS_PLAN_2026.initiatives.filter(
        (item) => item.status === "gated"
      ).length,
      unmeasuredEvents: BUSINESS_PLAN_2026.events.filter(
        (item) => item.status === "not-instrumented"
      ).length,
    },
    m1: {
      analyses,
      routes,
      x,
      note: {
        planned: BUSINESS_PLAN_2026.m1.noteProducts.length,
        registered: m1NoteArticles.length,
        withBody: noteProducts.filter((product) => product.hasBody).length,
        published: noteProducts.filter(
          (product) => product.catalogStatus === "published",
        ).length,
        missingArticleKeys: BUSINESS_PLAN_2026.m1.noteProducts
          .map((product) => product.articleKey)
          .filter((key) => !noteByKey.has(key)),
        products: noteProducts,
      },
      events: {
        planned: BUSINESS_PLAN_2026.m1.eventIds.length,
        codeMapped: m1Events.filter((event) => event.canonicalEvent !== null).length,
        measured: m1Events.filter((event) => event.status === "measured").length,
        registrationPending: m1Events.filter(
          (event) => event.status !== "measured"
        ).length,
        items: m1Events.map((event) => ({
          id: event.id,
          label: event.label,
          canonicalEvent: event.canonicalEvent,
          status: event.status,
          note: event.note,
        })),
      },
      releaseChecks: [
        {
          id: "site-data",
          label: "サイト・R2データ",
          status: siteDataReady ? "pass" : "pending",
          detail: siteDataReady
            ? `${routes.length}画面と4分析のローカルsnapshotを確認済み`
            : "未実装routeまたはローカルsnapshot欠損があります",
          external: false,
        },
        {
          id: "x-drafts",
          label: "X初回15投稿",
          status: xReady ? "pass" : "pending",
          detail: xReady
            ? "15件のdraft・予定日時・UTM・画像素材を確認済み"
            : "draft登録または画像素材に不足があります",
          external: false,
        },
        {
          id: "note-catalog",
          label: "note商品カタログ",
          status: noteReady ? "pass" : "pending",
          detail: noteReady
            ? "15商品の価格・記事key・本文有無・開始ゲートを確認済み"
            : "noteカタログに未登録の商品があります",
          external: false,
        },
        {
          id: "ga4",
          label: "GA4登録・反映",
          status: ga4Ready ? "pass" : "pending",
          detail: ga4Ready
            ? "4イベントをGA4で計測確認済み"
            : eventCodeReady
              ? "コード実装済み。GA4カスタムディメンション登録と24〜48時間後の反映確認待ち"
              : "イベントコードの対応が不足しています",
          external: true,
        },
        {
          id: "approval",
          label: "外部公開承認",
          status: "pending",
          detail: "本番deploy・X投稿・note公開は対象差分を提示して明示承認後に実行",
          external: true,
        },
      ],
    },
  };
}

export function businessPlanDocument(
  id: string
): BusinessPlanDocumentDetail | null {
  const document = BUSINESS_PLAN_2026.documents.find((item) => item.id === id);
  if (!document) return null;
  const body = readText(document.path);
  return {
    ...document,
    updated: frontmatterValue(body, "updated"),
    status: frontmatterValue(body, "status"),
    body: body.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "").trim(),
  };
}

export const businessPlanLabels = {
  decision: {
    adopted: "採用",
    adapted: "適合変更",
    deferred: "保留",
    rejected: "不採用",
  } satisfies Record<BusinessPlanDecisionStatus, string>,
  work: {
    ready: "実行可能",
    "in-progress": "進行中",
    blocked: "停止",
    gated: "開始条件待ち",
    candidate: "候補",
  } satisfies Record<BusinessPlanWorkStatus, string>,
  measurement: {
    measured: "計測済み",
    "partially-measured": "部分計測",
    "not-instrumented": "未実装",
    manual: "手動記録",
  } satisfies Record<BusinessPlanMeasurementStatus, string>,
};
