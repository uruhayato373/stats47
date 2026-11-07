/**
 * 参照型の主は指標 (ランキング)。記事・note・SNS がどの指標につながるかを集める。読み取りのみ。
 * 記事の指標は図の出典から自動で記録された rankingKeys を読み、ここでは手で配線しない。
 */

export type MetricPage = { id: string; kind: string; key: string; title: string; href: string; published?: boolean; rankingKeys?: string[] };
export type MetricExternalPage = { id: string; title: string; href?: string; published?: boolean };
export type MetricLink = { from: string; to: string };

export type MetricRow = { key: string; title: string; href: string; hasMunicipality: boolean; blogs: number; notes: number; posts: number };
export type MetricDetail = {
  key: string;
  title: string;
  href: string;
  municipalityHref: string | null;
  blogs: Array<{ id: string; title: string; href: string; published: boolean }>;
  notes: MetricExternalPage[];
  posts: MetricExternalPage[];
};

type Input = { pages: MetricPage[]; externalPages: MetricExternalPage[]; externalLinks: MetricLink[] };

function index({ pages, externalPages, externalLinks }: Input) {
  const blogsByKey = new Map<string, MetricPage[]>();
  for (const page of pages) {
    if (page.kind !== "blog" || !page.published) continue;
    for (const key of page.rankingKeys ?? []) blogsByKey.set(key, [...(blogsByKey.get(key) ?? []), page]);
  }
  const externalById = new Map(externalPages.map((p) => [p.id, p]));
  const externalByKey = new Map<string, MetricExternalPage[]>();
  for (const link of externalLinks) {
    const target = externalById.get(link.from);
    if (!target || !link.to.startsWith("ranking:")) continue;
    const key = link.to.slice("ranking:".length);
    externalByKey.set(key, [...(externalByKey.get(key) ?? []), target]);
  }
  const municipality = new Map(pages.filter((p) => p.kind === "municipality-ranking" && p.published).map((p) => [p.key, p.href]));
  return { blogsByKey, externalByKey, municipality };
}

const isNote = (p: MetricExternalPage) => p.id.startsWith("note:");

/** 公開中のランキングごとの配線。つながりの多い指標を先に並べる */
export function buildMetricRows(input: Input): MetricRow[] {
  const { blogsByKey, externalByKey, municipality } = index(input);
  return input.pages
    .filter((p) => p.kind === "ranking" && p.published)
    .map((p): MetricRow => {
      const external = externalByKey.get(p.key) ?? [];
      return {
        key: p.key,
        title: p.title,
        href: p.href,
        hasMunicipality: municipality.has(p.key),
        blogs: blogsByKey.get(p.key)?.length ?? 0,
        notes: external.filter(isNote).length,
        posts: external.filter((e) => !isNote(e)).length,
      };
    })
    .sort((a, b) => b.blogs + b.notes + b.posts - (a.blogs + a.notes + a.posts) || a.key.localeCompare(b.key));
}

export function buildMetricDetail(key: string, input: Input): MetricDetail | null {
  const page = input.pages.find((p) => p.kind === "ranking" && p.key === key);
  if (!page) return null;
  const { blogsByKey, externalByKey, municipality } = index(input);
  const external = externalByKey.get(key) ?? [];
  return {
    key,
    title: page.title,
    href: page.href,
    municipalityHref: municipality.get(key) ?? null,
    blogs: (blogsByKey.get(key) ?? []).map((b) => ({ id: b.id, title: b.title, href: b.href, published: b.published === true })),
    notes: external.filter(isNote),
    posts: external.filter((e) => !isNote(e)),
  };
}
