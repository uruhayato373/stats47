import type { StorefrontProduct } from "../../src/features/products/types";

export interface KindleStorefrontEdition {
  readonly title: string;
  /** 販売先 (Amazon) に掲示した紹介文。版ごとに持つ。 */
  readonly description?: string;
  readonly priceYen: number;
  readonly status: string;
  readonly asin?: string | null;
  readonly kdpStatus?: string | null;
  readonly withdrawal?: unknown;
  readonly unpublishAfterReplacementLive?: boolean;
}

export interface KindleStorefrontListing extends KindleStorefrontEdition {
  readonly replacesAsin?: string;
  readonly previousEditions?: readonly KindleStorefrontEdition[];
}

function isLive(edition: KindleStorefrontEdition): boolean {
  return edition.status === "listed" && edition.kdpStatus === "live" &&
    Boolean(edition.asin) && !edition.withdrawal;
}

/** 新版を販売中と偽らず、明示的に維持されている販売中の旧版だけを引き継ぐ。 */
export function selectLiveKindleEdition(
  listing: KindleStorefrontListing,
): KindleStorefrontEdition | null {
  if (!["draft", "listed"].includes(listing.status) || listing.withdrawal) return null;
  if (isLive(listing)) return listing;
  if (!listing.replacesAsin) return null;
  const predecessors = (listing.previousEditions ?? []).filter((edition) =>
    edition.asin === listing.replacesAsin &&
    edition.unpublishAfterReplacementLive === true && isLive(edition),
  );
  return predecessors.length === 1 ? predecessors[0] : null;
}

const OLD_EDITION_NOTE =
  "販売中の版は旧版です。新版は準備・審査中のため、リンク先の書名・版をご確認ください。";

/** 紹介文を【見出し】で区切る。1 つ目は見出しの前の導入文。 */
function splitListingSections(description: string): { lead: string; sections: Map<string, string> } {
  const [lead, ...rest] = description.split(/【([^】]+)】/);
  const sections = new Map<string, string>();
  for (let index = 0; index < rest.length; index += 2) sections.set(rest[index], rest[index + 1] ?? "");
  return { lead, sections };
}

function joinParagraphs(text: string): string {
  return text.split("\n").map((line) => line.trim()).filter(Boolean).join("");
}

/**
 * 販売中の版の紹介文から、商品ページの内容・収録内容・読者・注意を本ごとに作る。
 * 見出しが欠けた本は定型文で埋めずに生成を止める。目次は出品した版の章 (現行版のみ) を使う。
 */
export function buildKindleStorefrontContent(
  id: string,
  listing: KindleStorefrontEdition,
  edition: KindleStorefrontEdition,
  book: { readonly concept: string; readonly chapters: readonly { readonly title: string }[] },
): Pick<StorefrontProduct, "description" | "included" | "audience" | "purchaseNotes" | "tableOfContents"> {
  const { lead, sections } = splitListingSections(edition.description ?? "");
  const section = (name: string) => {
    const body = sections.get(name);
    if (!body?.trim()) throw new Error(`Kindle ${id}: 販売中の版の紹介文に【${name}】がありません`);
    return body;
  };
  const bullets = (name: string) => {
    const items = section(name).split("\n").map((line) => line.trim())
      .filter((line) => line.startsWith("・")).map((line) => line.slice(1).trim());
    if (items.length === 0) throw new Error(`Kindle ${id}: 紹介文の【${name}】に箇条書きがありません`);
    return items;
  };
  const isCurrent = edition === listing;
  const dataNote = joinParagraphs(section("データについて"));
  const content = {
    description: isCurrent ? book.concept : joinParagraphs(lead),
    included: [joinParagraphs(section("収録内容")), ...bullets("この本で分かること")],
    audience: bullets("こんな方に"),
    purchaseNotes: isCurrent ? [dataNote] : [OLD_EDITION_NOTE, dataNote],
  };
  if (!content.description) throw new Error(`Kindle ${id}: 販売中の版の紹介文に導入文がありません`);
  return isCurrent ? { ...content, tableOfContents: book.chapters.map(({ title }) => title) } : content;
}
