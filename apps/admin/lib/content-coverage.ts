/**
 * 展開状況: 4 型 × 媒体で、どのコンテンツがどこまで展開できているかを数える。
 * 型と規則の正本は data/content/content-types.json。件数は持たず毎回集計する。読み取りのみ。
 * 件数だけを出し、回収できるかの判断は事業イシューマップに任せる (事業の問いと混ぜない)。
 */

import { SITE } from "@stats47/types";

import { classifyAll, classifyBlog, classifyNote, classifyPost } from "../../../.claude/scripts/content-types/classify-core.mjs";

export const COVERAGE_CHANNELS = [
  { id: "site", label: "サイト" },
  { id: "sns", label: "SNS" },
  { id: "note", label: "note" },
  { id: "kindle", label: "Kindle" },
] as const;
export type CoverageChannel = (typeof COVERAGE_CHANNELS)[number]["id"];
export const UNCLASSIFIED = "unclassified";

export type ContentTypeDef = { id: string; title: string; question: string; examples: string };
export type ContentTypeRules = {
  pageKinds: Record<string, string>;
  excludedPageKinds: string[];
  blogSlugSuffixes: Record<string, string>;
  blogSlugInfixes: Record<string, string>;
  noteVerticals: Record<string, string>;
  noteSeries: Record<string, string>;
  snsDomains: Record<string, string>;
  kindle: string;
};
export type ContentTypesLedger = { types: ContentTypeDef[]; rules: ContentTypeRules; assignments: Array<{ id: string; type: string; reason: string }> };

export type CoveragePage = { id: string; kind: string; key: string; title: string; href: string; published?: boolean };
export type CoverageNote = { key: string; title: string; status: string; series?: string; vertical?: string; noteUrl?: string };
export type CoveragePost = { id: number; status: string; platform: string; domain: string; content_key?: string; caption?: string; post_url?: string };
export type CoverageBook = { channel: string; key: string; title: string; status: string };
export type CoverageInput = {
  ledger: ContentTypesLedger;
  pages: CoveragePage[];
  answerPages: Set<string>;
  notes: CoverageNote[];
  posts: CoveragePost[];
  products: CoverageBook[];
  draftSlugs?: string[];
};

export type Classified = { type: string | null; how: string };
export type CoverageItem = Classified & { id: string; channel: CoverageChannel; title: string; state: "公開" | "未公開"; detail: string; href: string | null };
export type CoverageCell = { published: number; preparing: number };
export type CoverageMatrix = { rows: Array<{ type: string; title: string; question: string; examples: string; cells: Record<CoverageChannel, CoverageCell> }>; items: CoverageItem[] };

export { classifyBlog, classifyNote, classifyPost };


export function buildContentCoverage({ ledger, pages, answerPages, notes, posts, products, draftSlugs = [] }: CoverageInput): CoverageMatrix {
  const { types } = ledger;
  const classified: Map<string, Classified> = classifyAll({ ledger, pages, answerPages, notes, posts, books: products, draftSlugs });
  const judged = (id: string): Classified => classified.get(id) ?? { type: null, how: "規則で決まらない" };
  const pageById = new Map(pages.map((p) => [p.id, p]));

  const siteItems = [...classified.keys()]
    .filter((id) => !/^(note|sns|kindle):/.test(id))
    .map((id): CoverageItem => {
      const p = pageById.get(id);
      const slug = id.replace(/^blog:/, "");
      return {
        ...judged(id),
        id,
        channel: "site",
        title: p?.title ?? slug,
        state: p?.published ? "公開" : "未公開",
        detail: p?.kind ?? "原稿",
        href: p?.published ? `${SITE.origin}${p.href}` : null,
      };
    });

  const noteItems = notes.map((n): CoverageItem => {
    const id = `note:${n.key}`;
    return { ...judged(id), id, channel: "note", title: n.title, state: n.status === "published" ? "公開" : "未公開", detail: n.vertical ?? "", href: n.noteUrl ?? null };
  });

  const postItems = posts
    .filter((p) => p.status !== "deleted")
    .map((p): CoverageItem => ({
      ...judged(`sns:${p.id}`),
      id: `sns:${p.id}`,
      channel: "sns",
      title: (p.caption ?? p.content_key ?? `投稿 ${p.id}`).split("\n")[0],
      state: p.status === "posted" ? "公開" : "未公開",
      detail: `${p.platform} ${p.domain}`,
      href: p.post_url ?? null,
    }));

  const bookItems = products
    .filter((p) => p.channel === "kdp" && p.status !== "withdrawn")
    .map((p): CoverageItem => ({
      ...judged(`kindle:${p.key}`),
      id: `kindle:${p.key}`,
      channel: "kindle",
      title: p.title,
      state: p.status === "live" ? "公開" : "未公開",
      detail: p.status,
      href: null,
    }));

  const items = [...siteItems, ...postItems, ...noteItems, ...bookItems];
  const cells = (type: string | null) =>
    Object.fromEntries(
      COVERAGE_CHANNELS.map(({ id }) => {
        const own = items.filter((i) => i.channel === id && i.type === type);
        return [id, { published: own.filter((i) => i.state === "公開").length, preparing: own.filter((i) => i.state === "未公開").length }];
      }),
    ) as Record<CoverageChannel, CoverageCell>;

  return {
    rows: [
      ...types.map((t) => ({ type: t.id, title: t.title, question: t.question, examples: t.examples, cells: cells(t.id) })),
      { type: UNCLASSIFIED, title: "未分類", question: "規則で型が決まらないもの", examples: "content-types.json の規則か個別の指定で振り分ける", cells: cells(null) },
    ],
    items,
  };
}

export type FitProposal = "rewrite" | "merge" | "retire";
export type FitItem = { id: string; title: string; type: string; proposal: FitProposal; signals: string[]; mergeWith?: string; clicks: number; impressions: number };
export type TypeFitReview = { observedAt: string; gscWeeks: string[]; articlesRead: number; articlesUnobserved: number; items: FitItem[]; decisions: Array<{ id: string; action: string }> };

/** 処置がまだ決まっていない案だけを返す。読まれている記事を先に見る */
export function openFitItems(review: TypeFitReview): FitItem[] {
  const decided = new Set(review.decisions.map((d) => d.id));
  return review.items.filter((i) => !decided.has(i.id)).sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions);
}
