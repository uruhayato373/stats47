import { getFurusatoNozeiLink } from "../constants/furusato-nozei";
import { isRakutenAffiliateUrl } from "../constants/rakuten-links";

/** Shared by collection and rendering: old snapshots must pass the same content checks. */
export interface RakutenQualityItem {
  name: string;
  url: string;
  price: number;
  image: string | null;
  shopName?: string;
  genreId?: string;
}

export type FurusatoRegionEvidence = "shop" | "legacy-title" | "unknown" | "mismatch";
export type FurusatoContext = "regional" | "food";

const PREF_NAMES = Array.from({ length: 47 }, (_, i) =>
  getFurusatoNozeiLink(`${String(i + 1).padStart(2, "0")}000`)?.prefName,
).filter((name): name is string => Boolean(name));

const normalize = (value: string) => value.normalize("NFKC").toLowerCase()
  .replace(/[ぁ-ゖ]/g, (char) => String.fromCharCode(char.charCodeAt(0) + 0x60));
// Spelling equivalences, not a second product catalogue. The query list remains metric-derived.
const SPELLINGS = [["さんま", "秋刀魚"], ["コーヒー", "珈琲"], ["さけ", "鮭", "サーモン"]];
const NON_FOOD_KINDS = /衣料|衣類|肌着|シャツ|ブラジャー|ナイトブラ|ショーツ|パンツ|スカート|ワンピース|コート|タオル|カーテン|クッション|ぬいぐるみ|フィギュア|サプリメント|レザー|額装|スーツ/;
const COFFEE_ACCESSORIES = /(?:コーヒー|珈琲)(?:用|色|カラー|カップ|メーカー|ミル|ドリッパー|フィルター|サーバー)|(?:カップ|ポット|ドリッパー|フィルター|ミル|メーカー).*?(?:コーヒー|珈琲)/;
const VOUCHERS = /券|チケット|ギフトカード|地域通貨|ポイント|ウエディング|ウェディング|あとからセレクト|旅行クーポン|宿泊クーポン/;

export function isShippingFeeItem(name: string): boolean {
  // Do not reject real goods just because their title says 送料無料.
  return /(?:^|[《【(（\s])送料\s*[0-9０-９]|(?:追加|別途|調整|専用)送料|送料(?:追加|調整|専用)|(?:送料|配送手数料|代引手数料)のみ/.test(name);
}

export function hasProductTitleMatch(name: string, query: string): boolean {
  const title = normalize(name);
  const terms = query.trim().split(/\s+/).filter(Boolean);
  return terms.length > 0 && terms.every((term) => {
    const normalized = normalize(term);
    const spellings = SPELLINGS.find((group) => group.some((word) => normalize(word) === normalized)) ?? [term];
    return spellings.some((word) => title.includes(normalize(word)));
  });
}

function commonReasons(item: RakutenQualityItem): string[] {
  const reasons: string[] = [];
  if (!isRakutenAffiliateUrl(item.url)) reasons.push("non-affiliate-url");
  if (!Number.isFinite(item.price) || item.price <= 0) reasons.push("invalid-price");
  if (!item.image || !/^https:\/\//.test(item.image)) reasons.push("missing-image");
  if (isShippingFeeItem(item.name)) reasons.push("shipping-fee");
  return reasons;
}

export function productQualityReasons(item: RakutenQualityItem, query: string): string[] {
  const reasons = commonReasons(item);
  if (/ふるさと納税|寄附金|寄付金/.test(item.name)) reasons.push("donation-product");
  if (!hasProductTitleMatch(item.name, query)) reasons.push("title-mismatch");
  if (NON_FOOD_KINDS.test(item.name) && !NON_FOOD_KINDS.test(query)) reasons.push("product-kind-mismatch");
  if (/^(?:コーヒー|珈琲)$/.test(query) && COFFEE_ACCESSORIES.test(item.name)) reasons.push("product-accessory");
  return reasons;
}

export function furusatoRegionEvidence(item: RakutenQualityItem, prefName: string): FurusatoRegionEvidence {
  if (!PREF_NAMES.includes(prefName)) return "unknown";
  if (item.shopName) return item.shopName.startsWith(prefName) ? "shop" : "mismatch";
  // Legacy title evidence is weaker; remove after all 47 prefecture snapshots have verified shop names and old caches expire.
  const named = PREF_NAMES.filter((pref) => item.name.includes(pref));
  if (named.some((pref) => pref !== prefName)) return "mismatch";
  return named.length === 1 && named[0] === prefName ? "legacy-title" : "unknown";
}

export function furusatoQualityReasons(
  item: RakutenQualityItem,
  prefName: string,
  { context = "regional", requireShop = false }: { context?: FurusatoContext; requireShop?: boolean } = {},
): string[] {
  const reasons = commonReasons(item);
  if (!item.name.includes("ふるさと納税")) reasons.push("not-furusato");
  const evidence = furusatoRegionEvidence(item, prefName);
  if (evidence === "mismatch") reasons.push("prefecture-mismatch");
  if (evidence === "unknown" || (requireShop && evidence !== "shop")) reasons.push("region-unverified");
  if (context === "food" && VOUCHERS.test(item.name)) reasons.push("non-food-voucher");
  if (context === "food" && NON_FOOD_KINDS.test(item.name)) reasons.push("product-kind-mismatch");
  return reasons;
}

/** Keep API order; do not repeat an identical issued URL within a card. */
export function selectQualityItems<T extends RakutenQualityItem>(items: T[], reasons: (item: T) => string[], limit = 4): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (reasons(item).length || seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  }).slice(0, limit);
}
